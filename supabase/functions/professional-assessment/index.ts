import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssessmentRequest {
  audio_base64: string;
  original_text: string;
  language?: string;
}

interface ProviderConfig {
  id: string;
  name: string;
  provider_type: string;
  api_endpoint: string;
  api_key_secret_name: string | null;
  api_secret_key_name: string | null;
  region: string | null;
  config_json: {
    api_key?: string;
    api_secret?: string;
    [key: string]: unknown;
  };
}

interface AssessmentResult {
  success: boolean;
  overall_score: number;
  pronunciation_score: number;
  accuracy_score: number;
  fluency_score: number;
  completeness_score: number;
  feedback: string;
  words_result?: Array<{
    word: string;
    accuracy_score: number;
    error_type?: string;
    phonemes?: Array<{
      phoneme: string;
      score: number;
    }>;
  }>;
  phonemes_result?: Array<{
    phoneme: string;
    score: number;
  }>;
  raw_response?: unknown;
}

// ==================== Azure Speech Pronunciation Assessment ====================
async function callAzureAssessment(
  provider: ProviderConfig,
  audio_base64: string,
  original_text: string,
  language: string
): Promise<AssessmentResult> {
  // 优先从 config_json 读取密钥，其次从环境变量
  const subscriptionKey = provider.config_json?.api_key ||
    Deno.env.get(provider.api_key_secret_name || 'AZURE_SPEECH_KEY');
  const region = provider.region || 'eastasia';

  if (!subscriptionKey) {
    throw new Error('Azure Speech API 密钥未配置，请在管理后台设置');
  }

  // 将 webm 音频转换为 WAV 格式的 base64（Azure 需要 WAV 格式）
  // 实际生产中需要使用 ffmpeg 等工具转换，这里我们先假设客户端发送的是 WAV
  const audioData = Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0));

  // 构建发音评估配置
  const pronunciationAssessmentConfig = {
    ReferenceText: original_text,
    GradingSystem: "HundredMark",
    Granularity: "Phoneme",
    Dimension: "Comprehensive",
    EnableMiscue: true
  };

  const pronunciationAssessmentHeader = btoa(JSON.stringify(pronunciationAssessmentConfig));

  const endpoint = `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;

  const url = new URL(endpoint);
  url.searchParams.set('language', language === 'zh-CN' ? 'zh-CN' : 'en-US');
  url.searchParams.set('format', 'detailed');

  console.log('Calling Azure Speech Assessment...');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'audio/wav',
      'Pronunciation-Assessment': pronunciationAssessmentHeader,
      'Accept': 'application/json',
    },
    body: audioData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Azure Speech error:', response.status, errorText);
    throw new Error(`Azure 语音评测失败: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Azure response:', JSON.stringify(result));

  // 解析 Azure 响应
  const nBest = result.NBest?.[0];
  const pronunciationAssessment = nBest?.PronunciationAssessment;

  if (!pronunciationAssessment) {
    throw new Error('Azure 评测结果解析失败');
  }

  // 解析单词级评分
  const wordsResult = nBest.Words?.map((word: {
    Word: string;
    PronunciationAssessment?: {
      AccuracyScore?: number;
      ErrorType?: string;
    };
    Phonemes?: Array<{
      Phoneme: string;
      PronunciationAssessment?: {
        AccuracyScore?: number;
      };
    }>;
  }) => ({
    word: word.Word,
    accuracy_score: word.PronunciationAssessment?.AccuracyScore || 0,
    error_type: word.PronunciationAssessment?.ErrorType,
    phonemes: word.Phonemes?.map((p: {
      Phoneme: string;
      PronunciationAssessment?: { AccuracyScore?: number };
    }) => ({
      phoneme: p.Phoneme,
      score: p.PronunciationAssessment?.AccuracyScore || 0,
    })),
  }));

  return {
    success: true,
    overall_score: Math.round(pronunciationAssessment.PronScore || 0),
    pronunciation_score: Math.round(pronunciationAssessment.PronScore || 0),
    accuracy_score: Math.round(pronunciationAssessment.AccuracyScore || 0),
    fluency_score: Math.round(pronunciationAssessment.FluencyScore || 0),
    completeness_score: Math.round(pronunciationAssessment.CompletenessScore || 0),
    feedback: generateFeedback(pronunciationAssessment, wordsResult),
    words_result: wordsResult,
    raw_response: result,
  };
}

// ==================== 腾讯 SOE 智能评测 ====================
async function callTencentSOEAssessment(
  provider: ProviderConfig,
  audio_base64: string,
  original_text: string,
  language: string
): Promise<AssessmentResult> {
  // 优先从 config_json 读取密钥，其次从环境变量
  const secretId = provider.config_json?.api_key ||
    Deno.env.get(provider.api_key_secret_name || 'TENCENT_SOE_SECRET_ID');
  const secretKey = provider.config_json?.api_secret ||
    Deno.env.get(provider.api_secret_key_name || 'TENCENT_SOE_SECRET_KEY');

  if (!secretId || !secretKey) {
    throw new Error('腾讯 SOE API 密钥未配置，请在管理后台设置');
  }

  const host = "soe.tencentcloudapi.com";
  const service = "soe";
  const action = "TransmitOralProcessWithInit"; // 使用带初始化的接口
  const version = "2018-07-24";
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().split('T')[0];

  // 生成 SessionId
  const sessionId = crypto.randomUUID();

  // 请求体 - 使用 TransmitOralProcessWithInit 的参数格式
  const payload = JSON.stringify({
    SeqId: 1,
    IsEnd: 1,
    SessionId: sessionId,
    VoiceFileType: 3, // webm = 3
    VoiceEncodeType: 1, // opus = 1
    UserVoiceData: audio_base64,
    RefText: original_text,
    WorkMode: 0, // 流式传输
    EvalMode: language === 'zh-CN' ? 1 : 2, // 中文用1句子模式，英文用2句子模式
    ScoreCoeff: 1.0,
    SoeAppId: "", // 可选，空字符串表示使用默认
    StorageMode: 0, // 不存储音频
  });

  // 腾讯云签名 v3
  const hashedPayload = await sha256Hex(payload);
  const httpRequestMethod = "POST";
  const canonicalUri = "/";
  const canonicalQueryString = "";
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-tc-action:${action.toLowerCase()}\n`;
  const signedHeaders = "content-type;host;x-tc-action";
  const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;

  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonicalRequest = await sha256Hex(canonicalRequest);
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;

  // 计算签名
  const secretDate = await hmacSha256(`TC3${secretKey}`, date);
  const secretService = await hmacSha256(secretDate, service);
  const secretSigning = await hmacSha256(secretService, "tc3_request");
  const signature = await hmacSha256Hex(secretSigning, stringToSign);

  const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  console.log('Calling Tencent SOE...');

  const response = await fetch(`https://${host}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Host': host,
      'X-TC-Action': action,
      'X-TC-Version': version,
      'X-TC-Timestamp': timestamp.toString(),
      // SOE API 不需要 Region 参数，移除以避免无效 Region 错误
      'Authorization': authorization,
    },
    body: payload,
  });

  const result = await response.json();
  console.log('Tencent SOE response:', JSON.stringify(result));

  if (result.Response?.Error) {
    throw new Error(`腾讯 SOE 错误: ${result.Response.Error.Message}`);
  }

  const resp = result.Response;

  // 解析单词评分
  const wordsResult = resp.Words?.map((w: {
    Word: string;
    PronAccuracy: number;
    PronFluency: number;
    MatchTag: number;
    PhoneInfos?: Array<{ Phone: string; PronAccuracy: number }>;
  }) => ({
    word: w.Word,
    accuracy_score: Math.round(w.PronAccuracy || 0),
    error_type: w.MatchTag === 0 ? 'None' : w.MatchTag === 1 ? 'Mispronunciation' : 'Omission',
    phonemes: w.PhoneInfos?.map((p: { Phone: string; PronAccuracy: number }) => ({
      phoneme: p.Phone,
      score: Math.round(p.PronAccuracy || 0),
    })),
  }));

  return {
    success: true,
    overall_score: Math.round(resp.PronAccuracy || 0),
    pronunciation_score: Math.round(resp.PronAccuracy || 0),
    accuracy_score: Math.round(resp.PronAccuracy || 0),
    fluency_score: Math.round(resp.PronFluency || 0),
    completeness_score: Math.round(resp.PronCompletion || 0),
    feedback: generateSOEFeedback(resp, wordsResult),
    words_result: wordsResult,
    raw_response: result,
  };
}

// ==================== 讯飞语音评测 ====================
async function callIFlyAssessment(
  provider: ProviderConfig,
  audio_base64: string,
  original_text: string,
  language: string
): Promise<AssessmentResult> {
  // 优先从 config_json 读取密钥，其次从环境变量
  const appId = provider.config_json?.api_key ||
    Deno.env.get(provider.api_key_secret_name || 'IFLY_APP_ID');
  const apiKey = provider.config_json?.api_secret ||
    Deno.env.get(provider.api_secret_key_name || 'IFLY_API_KEY');
  const apiSecret = Deno.env.get('IFLY_API_SECRET');

  if (!appId || !apiKey) {
    throw new Error('讯飞 API 密钥未配置，请在管理后台设置');
  }

  // 讯飞评测 WebSocket API 需要特殊处理
  // 这里使用 HTTP 接口的简化版本
  console.log('Calling IFly Assessment...');

  // 由于讯飞需要 WebSocket，暂时返回模拟结果并提示配置
  throw new Error('讯飞语音评测暂不支持，请使用 Azure 或腾讯 SOE');
}

// ==================== 辅助函数 ====================
function generateFeedback(assessment: {
  AccuracyScore?: number;
  FluencyScore?: number;
  CompletenessScore?: number;
}, wordsResult?: Array<{ word: string; accuracy_score: number; error_type?: string }>) {
  const feedback: string[] = [];

  if (assessment.AccuracyScore !== undefined) {
    if (assessment.AccuracyScore >= 90) {
      feedback.push('发音非常准确！');
    } else if (assessment.AccuracyScore >= 70) {
      feedback.push('发音基本准确，继续练习。');
    } else {
      feedback.push('发音需要加强练习。');
    }
  }

  if (assessment.FluencyScore !== undefined && assessment.FluencyScore < 70) {
    feedback.push('语速可以更加流畅自然。');
  }

  if (assessment.CompletenessScore !== undefined && assessment.CompletenessScore < 90) {
    feedback.push('注意完整朗读所有内容。');
  }

  // 找出发音错误的单词
  const errorWords = wordsResult?.filter(w => w.accuracy_score < 60).map(w => w.word);
  if (errorWords && errorWords.length > 0) {
    feedback.push(`需要重点练习: ${errorWords.slice(0, 5).join(', ')}`);
  }

  return feedback.join(' ');
}

function generateSOEFeedback(resp: {
  PronAccuracy?: number;
  PronFluency?: number;
  PronCompletion?: number;
  SuggestedScore?: number;
}, wordsResult?: Array<{ word: string; accuracy_score: number }>) {
  const feedback: string[] = [];

  if (resp.SuggestedScore !== undefined) {
    if (resp.SuggestedScore >= 90) {
      feedback.push('发音非常标准！');
    } else if (resp.SuggestedScore >= 70) {
      feedback.push('发音良好，继续保持。');
    } else {
      feedback.push('建议多加练习。');
    }
  }

  const errorWords = wordsResult?.filter(w => w.accuracy_score < 60).map(w => w.word);
  if (errorWords && errorWords.length > 0) {
    feedback.push(`注意以下单词发音: ${errorWords.slice(0, 5).join(', ')}`);
  }

  return feedback.join(' ');
}

// 签名辅助函数
async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(key: string | ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = typeof key === 'string' ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

async function hmacSha256Hex(key: ArrayBuffer, message: string): Promise<string> {
  const result = await hmacSha256(key, message);
  return Array.from(new Uint8Array(result))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ==================== 主调用分发 ====================
async function callAssessmentProvider(
  provider: ProviderConfig,
  audio_base64: string,
  original_text: string,
  language: string
): Promise<AssessmentResult> {
  console.log(`Using professional provider: ${provider.name} (${provider.provider_type})`);

  switch (provider.provider_type.toLowerCase()) {
    case 'azure':
      return await callAzureAssessment(provider, audio_base64, original_text, language);
    case 'tencent_soe':
      return await callTencentSOEAssessment(provider, audio_base64, original_text, language);
    case 'ifly':
      return await callIFlyAssessment(provider, audio_base64, original_text, language);
    default:
      throw new Error(`不支持的评测服务: ${provider.provider_type}`);
  }
}

// ==================== 主服务 ====================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 验证用户
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: '未授权访问' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 检查用户专业评测分钟数
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('professional_voice_minutes')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: '无法获取用户信息' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const remainingMinutes = profile.professional_voice_minutes || 0;
    console.log(`User ${user.id} has ${remainingMinutes} professional voice minutes remaining`);

    if (remainingMinutes <= 0) {
      return new Response(
        JSON.stringify({
          error: '专业评测时间已用完，请购买授权码充值',
          remaining_minutes: 0,
          billed: false,
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audio_base64, original_text, language = 'en-US' }: AssessmentRequest = await req.json();

    if (!audio_base64 || !original_text) {
      return new Response(
        JSON.stringify({ error: '缺少音频或原文本' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取默认的专业评测服务商
    const { data: provider, error: providerError } = await supabaseClient
      .from('professional_assessment_providers')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (providerError || !provider) {
      console.error('Provider error:', providerError);
      return new Response(
        JSON.stringify({
          error: '专业评测服务未配置，请联系管理员',
          billed: false,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using provider:', provider.name);

    // 使用服务角色客户端
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let assessmentResult: AssessmentResult;
    let billingError: string | null = null;
    let isBilled = false;
    const startTime = Date.now();

    try {
      // 调用专业评测服务
      assessmentResult = await callAssessmentProvider(provider, audio_base64, original_text, language);

      // 评测成功，按秒计费（更公平的计费方式）
      const durationSeconds = Math.ceil((Date.now() - startTime) / 1000) + 5; // 加上估计的音频时长
      const secondsUsed = Math.max(1, durationSeconds); // 最少计费1秒
      // 将 professional_voice_minutes 当作"秒数"来使用（字段名历史原因保留）
      const remainingSeconds = remainingMinutes * 60; // 将分钟转换为秒
      const newRemainingSeconds = Math.max(0, remainingSeconds - secondsUsed);
      const newRemainingMinutes = newRemainingSeconds / 60; // 转回分钟存储

      // 更新用户专业评测时间（存储单位仍为分钟，但按秒扣除）
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ professional_voice_minutes: newRemainingMinutes })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update professional voice minutes:', updateError);
        billingError = '扣费失败，但评测结果有效';
      } else {
        isBilled = true;
      }

      // 保存评测记录
      await supabaseAdmin
        .from('professional_assessments')
        .insert({
          user_id: user.id,
          original_text,
          provider_id: provider.id,
          provider_name: provider.name,
          pronunciation_score: assessmentResult.pronunciation_score,
          accuracy_score: assessmentResult.accuracy_score,
          fluency_score: assessmentResult.fluency_score,
          completeness_score: assessmentResult.completeness_score,
          overall_score: assessmentResult.overall_score,
          words_result: assessmentResult.words_result,
          phonemes_result: assessmentResult.phonemes_result,
          feedback: assessmentResult.feedback,
          duration_seconds: durationSeconds,
          minutes_charged: isBilled ? secondsUsed / 60 : 0, // 记录消耗的分钟数
          is_billed: isBilled,
          billing_error: billingError,
          raw_response: assessmentResult.raw_response,
        });

      return new Response(
        JSON.stringify({
          ...assessmentResult,
          remaining_minutes: newRemainingMinutes,
          remaining_seconds: Math.floor(newRemainingSeconds), // 返回剩余秒数
          seconds_used: isBilled ? secondsUsed : 0, // 返回消耗的秒数
          minutes_used: isBilled ? Math.round(secondsUsed / 60 * 100) / 100 : 0, // 保留兼容
          billed: isBilled,
          billing_error: billingError,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (assessmentError) {
      // 评测失败，不计费
      console.error('Assessment failed:', assessmentError);

      // 记录失败的评测
      await supabaseAdmin
        .from('professional_assessments')
        .insert({
          user_id: user.id,
          original_text,
          provider_id: provider.id,
          provider_name: provider.name,
          is_billed: false,
          billing_error: assessmentError instanceof Error ? assessmentError.message : '评测失败',
        });

      return new Response(
        JSON.stringify({
          error: assessmentError instanceof Error ? assessmentError.message : '专业评测失败',
          remaining_minutes: remainingMinutes,
          billed: false,
          message: '评测失败，未扣除时间',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    console.error('Professional assessment error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '评测失败',
        billed: false,
        message: '评测失败，未扣除时间',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

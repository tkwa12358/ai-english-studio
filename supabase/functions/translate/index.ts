import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode as hex } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 辅助函数：MD5 (百度翻译/腾讯翻译所需)
async function md5(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return new TextDecoder().decode(hex(new Uint8Array(hashBuffer)));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, from = 'en', to = 'zh' } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Missing text parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 初始化 Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. 获取默认翻译配置
    const { data: provider, error: providerError } = await supabase
      .from('translation_providers')
      .select('*')
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (providerError || !provider) {
      // 没有任何配置，尝试 Fallback 到环境变量或报错
      // 这里为了兼容性，如果配置表为空，尝试使用旧的 LOVABLE_API_KEY 逻辑 (Google/OpenAI)
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        // 使用原有逻辑
        return await callOpenAI(text, LOVABLE_API_KEY, from, to);
      }

      throw new Error('未配置翻译服务商');
    }

    console.log(`Using translation provider: ${provider.provider_type} (${provider.name})`);

    // 2. 尝试获取其定义和音标 (如果是单词)
    let dictData: any = null;
    const isSingleWord = text.trim().split(/\s+/).length === 1 && text.length < 50;

    if (isSingleWord && from === 'en') {
      try {
        console.log(`Fetching dictionary data for: ${text}`);
        dictData = await callFreeDictionary(text);
      } catch (e) {
        console.warn('Dictionary API failed internally:', e);
      }
    }

    // 3. 根据类型调用不同 API
    let result = {
      translation: '',
      phonetic: '',
      definitions: [] as any[],
    };

    if (provider.provider_type === 'baidu') {
      result = await callBaiduTranslate(text, from, to, provider.app_id, provider.api_key);
    } else if (provider.provider_type === 'tencent') {
      result.translation = '腾讯翻译暂未实现，请切换到百度';
    } else if (provider.provider_type === 'google' || provider.provider_type === 'microsoft' || provider.provider_type === 'openai') {
      if (provider.api_key) {
        // OpenAI logic handles its own dictionary lookups usually, but we can still merge if needed
        // For now, let's trust OpenAI return if it works
        const openAiRes = await callOpenAI(text, provider.api_key, from, to);
        // Convert Response to object if we wanna merge? 
        // callOpenAI returns a Response object.
        // Returning directly for OpenAI is fine as it's smart.
        return openAiRes;
      }
    } else {
      throw new Error(`Unsupported provider type: ${provider.provider_type}`);
    }

    // 4. Merge Dictionary Data (for non-smart providers like Baidu/Tencent)
    if (dictData) {
      if (!result.phonetic && dictData.phonetic) {
        result.phonetic = dictData.phonetic;
      }
      // Merge definitions: Dictionary (English) + Translation (Chinese)
      // Usually Baidu just gives one 'unknown' meaning which is the translation.
      if (dictData.definitions && dictData.definitions.length > 0) {
        // Keep Chinese translation at top or separate?
        // Let's append Dictionary definitions
        result.definitions = [...(result.definitions || []), ...dictData.definitions];
      }
    }

    // 返回结果
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Translation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Dictionary API Helper
async function callFreeDictionary(word: string) {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!res.ok) throw new Error('Dict API invalid');
  const data = await res.json();
  const entry = data[0];

  return {
    phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
    definitions: entry.meanings?.slice(0, 3).map((m: any) => ({
      partOfSpeech: m.partOfSpeech,
      definition: m.definitions?.[0]?.definition || '',
      example: m.definitions?.[0]?.example || ''
    })) || []
  };
}

// 百度翻译实现
async function callBaiduTranslate(q: string, from: string, to: string, appId: string, secretKey: string) {
  const salt = Date.now().toString();
  const sign = await md5(appId + q + salt + secretKey); // appid+q+salt+密钥

  // 百度语言代码转换
  const baiduFrom = from === 'en' ? 'en' : 'auto';
  const baiduTo = to === 'zh' ? 'zh' : to;

  const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(q)}&from=${baiduFrom}&to=${baiduTo}&appid=${appId}&salt=${salt}&sign=${sign}`;

  console.log('Calling Baidu API...');
  const res = await fetch(url);
  const data = await res.json();

  if (data.error_code) {
    throw new Error(`Baidu API Error: ${data.error_msg} (Code: ${data.error_code})`);
  }

  const translation = data.trans_result?.[0]?.dst || '';

  return {
    translation,
    phonetic: '',
    definitions: [] // Empty by default, let main handler fill from Dict API
  };
}

// OpenAI (原有逻辑集成)
async function callOpenAI(text: string, apiKey: string, from: string, to: string) {
  const systemPrompt = `You are a professional translator. Translate the given text from ${from} to ${to}.
If the text is a single word, also provide:
1. Phonetic transcription (IPA format for English)
2. Part of speech
3. Multiple meanings/definitions

Return JSON format:
{
  "translation": "翻译结果",
  "phonetic": "/fəˈnetɪk/",
  "partOfSpeech": "noun/verb/adj...",
  "definitions": ["定义1", "定义2"],
  "examples": ["例句1", "例句2"]
}

For sentences, just return:
{
  "translation": "翻译结果"
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  // 解析 JSON
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return new Response(
        jsonMatch[0],
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // 非 JSON 格式
    return new Response(
      JSON.stringify({ translation: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ translation: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

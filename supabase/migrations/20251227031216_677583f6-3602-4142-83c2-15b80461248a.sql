-- 创建专业评测配置表
CREATE TABLE public.professional_assessment_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- azure, tencent_soe, ifly
  api_endpoint TEXT NOT NULL,
  api_key_secret_name TEXT, -- 存储在环境变量中的密钥名称
  api_secret_key_name TEXT, -- 第二个密钥（如有需要）
  region TEXT, -- 区域配置
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- 是否为默认服务商
  priority INTEGER DEFAULT 0, -- 优先级
  config_json JSONB DEFAULT '{}', -- 额外配置
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.professional_assessment_providers ENABLE ROW LEVEL SECURITY;

-- 只有管理员可以管理
CREATE POLICY "Admins can manage professional providers"
ON public.professional_assessment_providers
FOR ALL
USING (public.is_admin());

-- 所有登录用户可以查看活动的服务商
CREATE POLICY "Users can view active providers"
ON public.professional_assessment_providers
FOR SELECT
USING (is_active = true);

-- 创建专业评测记录表
CREATE TABLE public.professional_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID REFERENCES public.videos(id),
  original_text TEXT NOT NULL,
  provider_id UUID REFERENCES public.professional_assessment_providers(id),
  provider_name TEXT NOT NULL,
  -- 评分字段
  pronunciation_score NUMERIC(5,2),
  accuracy_score NUMERIC(5,2),
  fluency_score NUMERIC(5,2),
  completeness_score NUMERIC(5,2),
  overall_score NUMERIC(5,2),
  -- 详细结果
  words_result JSONB, -- 单词级评分
  phonemes_result JSONB, -- 音素级评分（专业评测特有）
  feedback TEXT,
  -- 计费相关
  duration_seconds INTEGER,
  minutes_charged INTEGER DEFAULT 0,
  is_billed BOOLEAN DEFAULT false, -- 是否计费
  billing_error TEXT, -- 如果计费失败的原因
  -- 元数据
  raw_response JSONB, -- 原始响应
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.professional_assessments ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的评测记录
CREATE POLICY "Users can view own assessments"
ON public.professional_assessments
FOR SELECT
USING (auth.uid() = user_id);

-- 系统可以插入评测记录（通过 service role）
CREATE POLICY "System can insert assessments"
ON public.professional_assessments
FOR INSERT
WITH CHECK (true);

-- 在 profiles 表添加专业评测时间字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS professional_voice_minutes INTEGER DEFAULT 0;

-- 添加更新时间触发器
CREATE TRIGGER update_professional_providers_updated_at
BEFORE UPDATE ON public.professional_assessment_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 插入默认配置（微软 Azure）
INSERT INTO public.professional_assessment_providers (name, provider_type, api_endpoint, api_key_secret_name, region, is_active, is_default, priority)
VALUES 
  ('微软 Azure 语音评测', 'azure', 'https://{region}.stt.speech.microsoft.com', 'AZURE_SPEECH_KEY', 'eastasia', true, true, 100),
  ('腾讯 SOE 智能评测', 'tencent_soe', 'https://soe.tencentcloudapi.com', 'TENCENT_SOE_SECRET_ID', 'ap-guangzhou', false, false, 50),
  ('讯飞语音评测', 'ifly', 'https://api.xfyun.cn', 'IFLY_APP_ID', null, false, false, 30);
-- 修改 profiles 表，将 voice_credits 改为 voice_minutes（语音评测剩余分钟数）
ALTER TABLE public.profiles 
RENAME COLUMN voice_credits TO voice_minutes;

-- 添加语音评测使用记录表
CREATE TABLE public.voice_usage_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.voice_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can view their own usage logs"
ON public.voice_usage_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage logs"
ON public.voice_usage_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage logs"
ON public.voice_usage_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- 修改 auth_codes 表，添加分钟数字段
ALTER TABLE public.auth_codes 
ADD COLUMN minutes_amount INTEGER DEFAULT 10;

-- 更新 code_type 的含义：10min, 60min
COMMENT ON COLUMN public.auth_codes.code_type IS '授权码类型: 10min(10分钟), 60min(60分钟)';

-- 创建语音评测模型配置表（管理员配置）
CREATE TABLE public.voice_assessment_models (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_endpoint TEXT NOT NULL,
    api_key_secret_name TEXT,
    model_identifier TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    supports_realtime BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.voice_assessment_models ENABLE ROW LEVEL SECURITY;

-- 只有管理员可以管理模型配置
CREATE POLICY "Admins can manage voice assessment models"
ON public.voice_assessment_models
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 所有认证用户可以查看激活的模型列表（不含敏感信息）
CREATE POLICY "Users can view active models"
ON public.voice_assessment_models
FOR SELECT
USING (is_active = true);

-- 添加更新时间触发器
CREATE TRIGGER update_voice_assessment_models_updated_at
BEFORE UPDATE ON public.voice_assessment_models
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- =====================================================
-- Translation Providers Configuration Table
-- =====================================================

-- 创建翻译服务商配置表
CREATE TABLE IF NOT EXISTS public.translation_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('baidu', 'tencent', 'google', 'microsoft')),
  app_id TEXT,  -- 如百度的 appid
  api_key TEXT NOT NULL,  -- 密钥
  api_secret TEXT,  -- 部分服务需要 secret
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 添加注释
COMMENT ON TABLE public.translation_providers IS '翻译服务商配置表，存储百度、腾讯、谷歌等翻译API的密钥';
COMMENT ON COLUMN public.translation_providers.provider_type IS '服务商类型: baidu, tencent, google, microsoft';
COMMENT ON COLUMN public.translation_providers.app_id IS '应用ID，如百度的appid';
COMMENT ON COLUMN public.translation_providers.api_key IS 'API密钥';
COMMENT ON COLUMN public.translation_providers.api_secret IS 'API密钥的secret部分（部分服务需要）';

-- 添加 RLS
ALTER TABLE public.translation_providers ENABLE ROW LEVEL SECURITY;

-- 管理员可以完全管理
CREATE POLICY "Admin can manage translation providers" ON public.translation_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 服务角色可以读取（用于 Edge Function）
CREATE POLICY "Service role can read translation providers" ON public.translation_providers
  FOR SELECT USING (true);

-- 插入默认百度翻译配置
INSERT INTO public.translation_providers (name, provider_type, app_id, api_key, is_active, is_default)
VALUES ('百度翻译', 'baidu', '20251229002529211', 'c5F_xOYCss7rDGPOWjOz', true, true);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_translation_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_translation_providers_updated_at
  BEFORE UPDATE ON public.translation_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_translation_providers_updated_at();

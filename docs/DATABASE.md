# 数据库部署指南

本文档详细说明如何在新环境中部署 AI English Club 的数据库。

## 目录

- [云端 Supabase 部署](#云端-supabase-部署)
- [本地 Supabase 部署](#本地-supabase-部署)
- [数据库表结构](#数据库表结构)
- [完整 SQL 脚本](#完整-sql-脚本)

## 云端 Supabase 部署

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 记录以下信息：
   - Project URL
   - anon/public key
   - service_role key

### 2. 执行数据库迁移

在 Supabase SQL Editor 中按顺序执行 `supabase/migrations/` 目录下的所有 SQL 文件。

### 3. 配置认证

在 Authentication > Settings 中：
- 启用 Email 登录
- 启用 "Confirm email" 自动确认（开发环境）

## 本地 Supabase 部署

### 前置要求

- Docker Desktop
- Supabase CLI

### 部署步骤

```bash
# 1. 启动本地 Supabase
supabase start

# 2. 应用迁移
supabase db push

# 3. 部署 Edge Functions
supabase functions deploy

# 4. 查看连接信息
supabase status
```

## 数据库表结构

### 核心表

#### profiles - 用户资料
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  phone TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  voice_minutes INTEGER NOT NULL DEFAULT 0,
  professional_voice_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### user_roles - 用户角色
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
```

#### videos - 视频
```sql
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES video_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  subtitles_en TEXT,
  subtitles_cn TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### video_categories - 视频分类
```sql
CREATE TABLE public.video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 学习相关表

#### word_book - 单词本
```sql
CREATE TABLE public.word_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  word TEXT NOT NULL,
  phonetic TEXT,
  translation TEXT,
  context TEXT,
  mastery_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
```

#### word_cache - 单词缓存
```sql
CREATE TABLE public.word_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  phonetic TEXT,
  translation TEXT,
  definitions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### learning_progress - 学习进度
```sql
CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id),
  last_position INTEGER NOT NULL DEFAULT 0,
  completed_sentences INTEGER[] DEFAULT '{}',
  total_practice_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);
```

### 评测相关表

#### voice_assessments - 语音评测
```sql
CREATE TABLE public.voice_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id),
  original_text TEXT NOT NULL,
  user_audio_url TEXT,
  accuracy_score NUMERIC,
  fluency_score NUMERIC,
  completeness_score NUMERIC,
  overall_score NUMERIC,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### professional_assessments - 专业评测
```sql
CREATE TABLE public.professional_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id),
  provider_id UUID REFERENCES professional_assessment_providers(id),
  provider_name TEXT NOT NULL,
  original_text TEXT NOT NULL,
  pronunciation_score NUMERIC,
  accuracy_score NUMERIC,
  fluency_score NUMERIC,
  completeness_score NUMERIC,
  overall_score NUMERIC,
  words_result JSONB,
  phonemes_result JSONB,
  duration_seconds INTEGER,
  minutes_charged INTEGER DEFAULT 0,
  is_billed BOOLEAN DEFAULT false,
  billing_error TEXT,
  feedback TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 管理相关表

#### auth_codes - 授权码
```sql
CREATE TABLE public.auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  code_type TEXT NOT NULL,
  credits_amount INTEGER,
  minutes_amount INTEGER DEFAULT 10,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 完整 SQL 脚本

以下是完整的数据库初始化脚本，可在新的 Supabase 项目中直接执行：

```sql
-- ============================================
-- AI English Club 数据库初始化脚本
-- ============================================

-- 1. 创建角色枚举
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. 创建用户资料表
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  phone TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  voice_minutes INTEGER NOT NULL DEFAULT 0,
  professional_voice_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 创建用户角色表
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. 创建视频分类表
CREATE TABLE public.video_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. 创建视频表
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES video_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  subtitles_en TEXT,
  subtitles_cn TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. 创建单词本
CREATE TABLE public.word_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  word TEXT NOT NULL,
  phonetic TEXT,
  translation TEXT,
  context TEXT,
  mastery_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- 7. 创建单词缓存
CREATE TABLE public.word_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  phonetic TEXT,
  translation TEXT,
  definitions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. 创建学习进度表
CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  last_position INTEGER NOT NULL DEFAULT 0,
  completed_sentences INTEGER[] DEFAULT '{}',
  total_practice_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- 9. 创建语音评测表
CREATE TABLE public.voice_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  original_text TEXT NOT NULL,
  user_audio_url TEXT,
  accuracy_score NUMERIC,
  fluency_score NUMERIC,
  completeness_score NUMERIC,
  overall_score NUMERIC,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. 创建专业评测供应商表
CREATE TABLE public.professional_assessment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  api_key_secret_name TEXT,
  api_secret_key_name TEXT,
  region TEXT,
  config_json JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. 创建专业评测记录表
CREATE TABLE public.professional_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES professional_assessment_providers(id),
  provider_name TEXT NOT NULL,
  original_text TEXT NOT NULL,
  pronunciation_score NUMERIC,
  accuracy_score NUMERIC,
  fluency_score NUMERIC,
  completeness_score NUMERIC,
  overall_score NUMERIC,
  words_result JSONB,
  phonemes_result JSONB,
  duration_seconds INTEGER,
  minutes_charged INTEGER DEFAULT 0,
  is_billed BOOLEAN DEFAULT false,
  billing_error TEXT,
  feedback TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. 创建授权码表
CREATE TABLE public.auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  code_type TEXT NOT NULL,
  credits_amount INTEGER,
  minutes_amount INTEGER DEFAULT 10,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. 创建语音使用日志表
CREATE TABLE public.voice_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. 创建语音评测模型表
CREATE TABLE public.voice_assessment_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  api_key_secret_name TEXT,
  model_identifier TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  supports_realtime BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 启用 RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_assessment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_assessment_models ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 创建辅助函数
-- ============================================

-- 更新时间戳函数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 检查角色函数
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 检查管理员函数
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- 新用户处理函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 创建触发器
-- ============================================

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at 
  BEFORE UPDATE ON public.videos 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_progress_updated_at 
  BEFORE UPDATE ON public.learning_progress 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 创建 RLS 策略
-- ============================================

-- profiles 策略
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- user_roles 策略
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'));

-- video_categories 策略
CREATE POLICY "Everyone can view categories" ON public.video_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.video_categories FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- videos 策略
CREATE POLICY "Everyone can view published videos" ON public.videos FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can view all videos" ON public.videos FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage videos" ON public.videos FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- word_book 策略
CREATE POLICY "Users can manage their own words" ON public.word_book FOR ALL USING (auth.uid() = user_id);

-- word_cache 策略
CREATE POLICY "Anyone can view cached words" ON public.word_cache FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert words" ON public.word_cache FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- learning_progress 策略
CREATE POLICY "Users can manage their own progress" ON public.learning_progress FOR ALL USING (auth.uid() = user_id);

-- voice_assessments 策略
CREATE POLICY "Users can manage their own assessments" ON public.voice_assessments FOR ALL USING (auth.uid() = user_id);

-- professional_assessment_providers 策略
CREATE POLICY "Users can view active providers" ON public.professional_assessment_providers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage professional providers" ON public.professional_assessment_providers FOR ALL USING (is_admin());

-- professional_assessments 策略
CREATE POLICY "Users can view own assessments" ON public.professional_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert assessments" ON public.professional_assessments FOR INSERT WITH CHECK (true);

-- auth_codes 策略
CREATE POLICY "Users can view codes they used" ON public.auth_codes FOR SELECT USING (used_by = auth.uid());
CREATE POLICY "Admins can manage auth codes" ON public.auth_codes FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- voice_usage_logs 策略
CREATE POLICY "Users can view their own usage logs" ON public.voice_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage logs" ON public.voice_usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own usage logs" ON public.voice_usage_logs FOR UPDATE USING (auth.uid() = user_id);

-- voice_assessment_models 策略
CREATE POLICY "Users can view active models" ON public.voice_assessment_models FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage voice assessment models" ON public.voice_assessment_models FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- 创建存储桶
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', false) ON CONFLICT DO NOTHING;

-- 存储策略
CREATE POLICY "Anyone can view video files" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Admins can upload video files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'videos' AND has_role(auth.uid(), 'admin')
);
CREATE POLICY "Users can upload their own audio" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view their own audio" ON storage.objects FOR SELECT USING (
  bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 初始化管理员

执行完上述 SQL 后，调用 `init-admin` Edge Function 初始化管理员账号：

```bash
curl -X POST https://your-project.supabase.co/functions/v1/init-admin
```

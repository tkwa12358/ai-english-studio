-- 创建全局单词缓存表
CREATE TABLE public.word_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  phonetic TEXT,
  translation TEXT,
  definitions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建单词索引以提高查询性能
CREATE INDEX idx_word_cache_word ON public.word_cache(word);
CREATE INDEX idx_word_cache_word_lower ON public.word_cache(LOWER(word));

-- 启用 RLS
ALTER TABLE public.word_cache ENABLE ROW LEVEL SECURITY;

-- 任何人都可以查看缓存的单词
CREATE POLICY "Anyone can view cached words" 
ON public.word_cache 
FOR SELECT 
USING (true);

-- 任何认证用户可以插入新单词
CREATE POLICY "Authenticated users can insert words" 
ON public.word_cache 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- 更新时间戳触发器
CREATE TRIGGER update_word_cache_updated_at
BEFORE UPDATE ON public.word_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
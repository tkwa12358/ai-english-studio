-- 用户统计汇总表
CREATE TABLE public.user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 时长统计（单位：秒）
  total_watch_time INTEGER NOT NULL DEFAULT 0,      -- 总观看时长
  total_practice_time INTEGER NOT NULL DEFAULT 0,   -- 总跟读练习时长
  today_watch_time INTEGER NOT NULL DEFAULT 0,      -- 今日观看时长
  today_practice_time INTEGER NOT NULL DEFAULT 0,   -- 今日跟读时长

  -- 数量统计
  total_videos_watched INTEGER NOT NULL DEFAULT 0,  -- 观看过的视频数
  total_sentences_completed INTEGER NOT NULL DEFAULT 0, -- 完成句子数
  total_words_learned INTEGER NOT NULL DEFAULT 0,   -- 学习单词数（加入单词本）
  total_assessments INTEGER NOT NULL DEFAULT 0,     -- 总评测次数

  -- 连续学习
  current_streak INTEGER NOT NULL DEFAULT 0,        -- 当前连续天数
  longest_streak INTEGER NOT NULL DEFAULT 0,        -- 最长连续天数
  last_study_date DATE,                              -- 最后学习日期

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 每日学习记录表
CREATE TABLE public.daily_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,

  watch_time INTEGER NOT NULL DEFAULT 0,            -- 当日观看时长（秒）
  practice_time INTEGER NOT NULL DEFAULT 0,         -- 当日跟读时长（秒）
  sentences_completed INTEGER NOT NULL DEFAULT 0,   -- 当日完成句子
  words_learned INTEGER NOT NULL DEFAULT 0,         -- 当日学习单词
  videos_watched INTEGER NOT NULL DEFAULT 0,        -- 当日观看视频数

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, study_date)
);

-- 启用 RLS
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_statistics ENABLE ROW LEVEL SECURITY;

-- user_statistics 策略
CREATE POLICY "Users can view their own statistics"
  ON public.user_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statistics"
  ON public.user_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statistics"
  ON public.user_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- daily_statistics 策略
CREATE POLICY "Users can view their own daily statistics"
  ON public.daily_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily statistics"
  ON public.daily_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily statistics"
  ON public.daily_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- 管理员可以查看所有统计
CREATE POLICY "Admins can view all user statistics"
  ON public.user_statistics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view all daily statistics"
  ON public.daily_statistics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- 自动更新 updated_at 触发器
CREATE TRIGGER update_user_statistics_updated_at
  BEFORE UPDATE ON public.user_statistics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 创建索引
CREATE INDEX idx_user_statistics_user_id ON public.user_statistics(user_id);
CREATE INDEX idx_daily_statistics_user_id_date ON public.daily_statistics(user_id, study_date);

-- 更新统计数据的函数
CREATE OR REPLACE FUNCTION public.update_user_statistics(
  p_user_id UUID,
  p_watch_time INTEGER DEFAULT 0,
  p_practice_time INTEGER DEFAULT 0,
  p_sentences_completed INTEGER DEFAULT 0,
  p_words_learned INTEGER DEFAULT 0,
  p_videos_watched INTEGER DEFAULT 0,
  p_assessments INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_study_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- 获取当前统计数据
  SELECT last_study_date, current_streak, longest_streak
  INTO v_last_study_date, v_current_streak, v_longest_streak
  FROM public.user_statistics
  WHERE user_id = p_user_id;

  -- 计算连续天数
  IF v_last_study_date IS NULL THEN
    v_current_streak := 1;
  ELSIF v_last_study_date = v_today THEN
    -- 同一天，保持不变
    NULL;
  ELSIF v_last_study_date = v_today - INTERVAL '1 day' THEN
    -- 连续学习
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSE
    -- 中断，重新开始
    v_current_streak := 1;
  END IF;

  -- 更新最长连续天数
  v_longest_streak := GREATEST(COALESCE(v_longest_streak, 0), v_current_streak);

  -- 更新或插入用户统计
  INSERT INTO public.user_statistics (
    user_id,
    total_watch_time,
    total_practice_time,
    today_watch_time,
    today_practice_time,
    total_videos_watched,
    total_sentences_completed,
    total_words_learned,
    total_assessments,
    current_streak,
    longest_streak,
    last_study_date
  ) VALUES (
    p_user_id,
    p_watch_time,
    p_practice_time,
    p_watch_time,
    p_practice_time,
    p_videos_watched,
    p_sentences_completed,
    p_words_learned,
    p_assessments,
    v_current_streak,
    v_longest_streak,
    v_today
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_watch_time = user_statistics.total_watch_time + EXCLUDED.total_watch_time,
    total_practice_time = user_statistics.total_practice_time + EXCLUDED.total_practice_time,
    today_watch_time = CASE
      WHEN user_statistics.last_study_date = v_today THEN user_statistics.today_watch_time + p_watch_time
      ELSE p_watch_time
    END,
    today_practice_time = CASE
      WHEN user_statistics.last_study_date = v_today THEN user_statistics.today_practice_time + p_practice_time
      ELSE p_practice_time
    END,
    total_videos_watched = user_statistics.total_videos_watched + EXCLUDED.total_videos_watched,
    total_sentences_completed = user_statistics.total_sentences_completed + EXCLUDED.total_sentences_completed,
    total_words_learned = user_statistics.total_words_learned + EXCLUDED.total_words_learned,
    total_assessments = user_statistics.total_assessments + EXCLUDED.total_assessments,
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_study_date = v_today,
    updated_at = now();

  -- 更新或插入每日统计
  INSERT INTO public.daily_statistics (
    user_id,
    study_date,
    watch_time,
    practice_time,
    sentences_completed,
    words_learned,
    videos_watched
  ) VALUES (
    p_user_id,
    v_today,
    p_watch_time,
    p_practice_time,
    p_sentences_completed,
    p_words_learned,
    p_videos_watched
  )
  ON CONFLICT (user_id, study_date) DO UPDATE SET
    watch_time = daily_statistics.watch_time + EXCLUDED.watch_time,
    practice_time = daily_statistics.practice_time + EXCLUDED.practice_time,
    sentences_completed = daily_statistics.sentences_completed + EXCLUDED.sentences_completed,
    words_learned = daily_statistics.words_learned + EXCLUDED.words_learned,
    videos_watched = daily_statistics.videos_watched + EXCLUDED.videos_watched;
END;
$$;

-- 授权 authenticated 用户调用函数
GRANT EXECUTE ON FUNCTION public.update_user_statistics TO authenticated;

-- 为现有用户初始化统计数据（基于 learning_progress 表）
INSERT INTO public.user_statistics (
  user_id,
  total_watch_time,
  total_practice_time,
  total_videos_watched,
  total_sentences_completed,
  last_study_date
)
SELECT
  lp.user_id,
  COALESCE(SUM(lp.total_practice_time), 0) as total_watch_time,
  0 as total_practice_time,
  COUNT(DISTINCT lp.video_id) as total_videos_watched,
  COALESCE(SUM(array_length(lp.completed_sentences, 1)), 0) as total_sentences_completed,
  MAX(lp.updated_at::date) as last_study_date
FROM public.learning_progress lp
GROUP BY lp.user_id
ON CONFLICT (user_id) DO NOTHING;

-- 初始化单词统计
UPDATE public.user_statistics us
SET total_words_learned = (
  SELECT COUNT(*) FROM public.word_book wb WHERE wb.user_id = us.user_id
);

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LearningProgress {
  id: string;
  video_id: string | null;
  last_position: number;
  completed_sentences: number[];
  total_practice_time: number;
  updated_at: string;
}

export const useLearningProgress = (videoId: string | null) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef<number>(0);
  const lastSaveTimeRef = useRef<number>(0);
  const isNewVideoRef = useRef<boolean>(false);

  // 获取学习进度
  const fetchProgress = useCallback(async () => {
    if (!user || !videoId) {
      setLoading(false);
      return;
    }

    // 重置计时器状态
    startTimeRef.current = null;

    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .maybeSingle();

    if (!error && data) {
      setProgress(data as LearningProgress);
      accumulatedTimeRef.current = data.total_practice_time || 0;
      isNewVideoRef.current = false;
    } else {
      // 新视频
      isNewVideoRef.current = true;
      accumulatedTimeRef.current = 0;
    }
    setLoading(false);
  }, [user, videoId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // 开始计时（观看视频时调用）
  const startTracking = useCallback(() => {
    // 只有在没有计时时才开始新的计时
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      console.log('[LearningProgress] startTracking:', startTimeRef.current);
    }
  }, []);

  // 暂停计时并累加时间
  const pauseTracking = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      accumulatedTimeRef.current += elapsed;
      console.log('[LearningProgress] pauseTracking: elapsed=', elapsed, 'accumulated=', accumulatedTimeRef.current);
      startTimeRef.current = null;
    }
  }, []);

  // 获取当前累计观看时长（包括正在计时的时间）
  const getCurrentWatchTime = useCallback(() => {
    let total = accumulatedTimeRef.current;
    if (startTimeRef.current) {
      total += Math.floor((Date.now() - startTimeRef.current) / 1000);
    }
    return total;
  }, []);

  // 保存播放位置和观看时长
  const savePosition = useCallback(async (position: number) => {
    if (!user || !videoId) return;

    // 计算本次新增的观看时长
    const currentTime = getCurrentWatchTime();
    const previousTime = progress?.total_practice_time || 0;
    const newWatchTime = Math.max(0, currentTime - previousTime);

    console.log('[LearningProgress] savePosition: position=', position, 'currentTime=', currentTime, 'previousTime=', previousTime, 'newWatchTime=', newWatchTime);

    const updateData = {
      last_position: Math.floor(position),
      total_practice_time: currentTime,
      updated_at: new Date().toISOString(),
    };

    // 保存到 learning_progress 表
    if (progress) {
      await supabase
        .from('learning_progress')
        .update(updateData)
        .eq('id', progress.id);
    } else {
      const { data } = await supabase
        .from('learning_progress')
        .insert({
          user_id: user.id,
          video_id: videoId,
          ...updateData,
          completed_sentences: [],
        })
        .select()
        .single();

      if (data) {
        setProgress(data as LearningProgress);
      }
    }

    // 更新用户统计（有新增时长或是新视频时更新）
    const isNewVideo = isNewVideoRef.current;
    if (newWatchTime > 0 || isNewVideo) {
      try {
        await supabase.rpc('update_user_statistics', {
          p_user_id: user.id,
          p_watch_time: newWatchTime,
          p_practice_time: 0,
          p_sentences_completed: 0,
          p_words_learned: 0,
          p_videos_watched: isNewVideo ? 1 : 0,
          p_assessments: 0,
        });
        isNewVideoRef.current = false;
      } catch (error) {
        console.error('Failed to update user statistics:', error);
      }
    }

    lastSaveTimeRef.current = Date.now();
  }, [user, videoId, progress, getCurrentWatchTime]);

  // 标记句子为已完成
  const markSentenceCompleted = useCallback(async (sentenceIndex: number) => {
    if (!user || !videoId) return;

    const currentCompleted = progress?.completed_sentences || [];
    if (currentCompleted.includes(sentenceIndex)) return;

    const newCompleted = [...currentCompleted, sentenceIndex].sort((a, b) => a - b);

    if (progress) {
      const { data } = await supabase
        .from('learning_progress')
        .update({
          completed_sentences: newCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progress.id)
        .select()
        .single();

      if (data) {
        setProgress(data as LearningProgress);
      }
    } else {
      const { data } = await supabase
        .from('learning_progress')
        .insert({
          user_id: user.id,
          video_id: videoId,
          last_position: 0,
          completed_sentences: newCompleted,
          total_practice_time: accumulatedTimeRef.current,
        })
        .select()
        .single();

      if (data) {
        setProgress(data as LearningProgress);
      }
    }

    // 更新用户统计 - 新增完成句子
    try {
      await supabase.rpc('update_user_statistics', {
        p_user_id: user.id,
        p_watch_time: 0,
        p_practice_time: 0,
        p_sentences_completed: 1,
        p_words_learned: 0,
        p_videos_watched: 0,
        p_assessments: 0,
      });
    } catch (error) {
      console.error('Failed to update sentence statistics:', error);
    }
  }, [user, videoId, progress]);

  // 记录跟读练习时长
  const recordPracticeTime = useCallback(async (practiceSeconds: number) => {
    if (!user || practiceSeconds <= 0) return;

    try {
      await supabase.rpc('update_user_statistics', {
        p_user_id: user.id,
        p_watch_time: 0,
        p_practice_time: practiceSeconds,
        p_sentences_completed: 0,
        p_words_learned: 0,
        p_videos_watched: 0,
        p_assessments: 1,
      });
    } catch (error) {
      console.error('Failed to update practice time:', error);
    }
  }, [user]);

  // 获取已完成句子数量
  const completedCount = progress?.completed_sentences?.length || 0;

  // 格式化学习时长
  const formatPracticeTime = useCallback(() => {
    const totalSeconds = getCurrentWatchTime();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`;
    }
    return `${seconds}秒`;
  }, [getCurrentWatchTime]);

  return {
    progress,
    loading,
    startTracking,
    pauseTracking,
    savePosition,
    markSentenceCompleted,
    recordPracticeTime,
    completedCount,
    totalPracticeTime: accumulatedTimeRef.current,
    formatPracticeTime,
    lastPosition: progress?.last_position || 0,
    getCurrentWatchTime,
  };
};

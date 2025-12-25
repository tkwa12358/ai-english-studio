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

  // 获取学习进度
  const fetchProgress = useCallback(async () => {
    if (!user || !videoId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single();

    if (!error && data) {
      setProgress(data as LearningProgress);
      accumulatedTimeRef.current = data.total_practice_time || 0;
    }
    setLoading(false);
  }, [user, videoId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // 开始计时
  const startTracking = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  // 暂停计时并累加时间
  const pauseTracking = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      accumulatedTimeRef.current += elapsed;
      startTimeRef.current = null;
    }
  }, []);

  // 保存播放位置
  const savePosition = useCallback(async (position: number) => {
    if (!user || !videoId) return;

    const updateData = {
      last_position: Math.floor(position),
      total_practice_time: accumulatedTimeRef.current,
      updated_at: new Date().toISOString(),
    };

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
  }, [user, videoId, progress]);

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
  }, [user, videoId, progress]);

  // 获取已完成句子数量
  const completedCount = progress?.completed_sentences?.length || 0;

  // 格式化学习时长
  const formatPracticeTime = useCallback(() => {
    const totalSeconds = accumulatedTimeRef.current;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`;
    }
    return `${seconds}秒`;
  }, []);

  return {
    progress,
    loading,
    startTracking,
    pauseTracking,
    savePosition,
    markSentenceCompleted,
    completedCount,
    totalPracticeTime: accumulatedTimeRef.current,
    formatPracticeTime,
    lastPosition: progress?.last_position || 0,
  };
};

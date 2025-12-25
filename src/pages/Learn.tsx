import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { VideoPlayer } from '@/components/VideoPlayer';
import { SubtitleList } from '@/components/SubtitleList';
import { VoiceAssessment } from '@/components/VoiceAssessment';
import { WordLookup } from '@/components/WordLookup';
import { supabase, Video, Subtitle, parseSRT } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, Clock, CheckCircle2 } from 'lucide-react';
import { useLearningProgress } from '@/hooks/useLearningProgress';

const Learn = () => {
  const { videoId } = useParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [subtitlesCn, setSubtitlesCn] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [practiceSubtitle, setPracticeSubtitle] = useState<Subtitle | null>(null);
  const [practiceSubtitleIndex, setPracticeSubtitleIndex] = useState<number | null>(null);
  const [lookupWord, setLookupWord] = useState<{ word: string; context: string } | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  // 学习进度追踪
  const {
    progress,
    startTracking,
    pauseTracking,
    savePosition,
    markSentenceCompleted,
    completedCount,
    formatPracticeTime,
    lastPosition,
  } = useLearningProgress(selectedVideo?.id || null);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (videoId && videos.length > 0) {
      const video = videos.find(v => v.id === videoId);
      if (video) selectVideo(video);
    }
  }, [videoId, videos]);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setVideos(data as Video[]);
    }
    setLoading(false);
  };

  const selectVideo = (video: Video) => {
    setSelectedVideo(video);
    if (video.subtitles_en) {
      setSubtitles(parseSRT(video.subtitles_en));
    }
    if (video.subtitles_cn) {
      setSubtitlesCn(parseSRT(video.subtitles_cn));
    }
  };

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    const current = subtitles.find(s => time >= s.start && time <= s.end);
    setCurrentSubtitle(current || null);
    
    // 每30秒自动保存进度
    const now = Date.now();
    if (now - lastSaveTimeRef.current > 30000) {
      savePosition(time);
      lastSaveTimeRef.current = now;
    }
  }, [subtitles, savePosition]);

  const handleSubtitleClick = (subtitle: Subtitle) => {
    setCurrentSubtitle(subtitle);
  };

  // 处理视频播放/暂停
  const handlePlay = useCallback(() => {
    startTracking();
  }, [startTracking]);

  const handlePause = useCallback(() => {
    pauseTracking();
    savePosition(currentTime);
  }, [pauseTracking, savePosition, currentTime]);

  // 处理跟读练习
  const handlePractice = useCallback((subtitle: Subtitle, index: number) => {
    setPracticeSubtitle(subtitle);
    setPracticeSubtitleIndex(index);
  }, []);

  // 评测成功回调
  const handleAssessmentSuccess = useCallback((score: number) => {
    if (practiceSubtitleIndex !== null && score >= 60) {
      markSentenceCompleted(practiceSubtitleIndex);
    }
  }, [practiceSubtitleIndex, markSentenceCompleted]);

  // 页面卸载时保存进度
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedVideo) {
        pauseTracking();
        savePosition(currentTime);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedVideo, currentTime, pauseTracking, savePosition]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg dark:gradient-bg-dark flex items-center justify-center">
        <div className="glass p-8 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{selectedVideo?.title || '视频学习'} - AI English Club</title>
      </Helmet>
      
      <div className="min-h-screen gradient-bg dark:gradient-bg-dark flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          {!selectedVideo ? (
            // Video List
            <div>
              <h1 className="text-2xl font-bold mb-6">选择视频</h1>
              {videos.length === 0 ? (
                <div className="glass p-12 rounded-2xl text-center">
                  <p className="text-muted-foreground">暂无可用视频</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map(video => (
                    <div
                      key={video.id}
                      className="glass rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
                      onClick={() => selectVideo(video)}
                    >
                      <div className="aspect-video bg-muted/50 flex items-center justify-center">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">🎬</span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-1">{video.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{video.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Video Player View - PC左右布局，移动端上下布局
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* 顶部导航栏 - 仅显示返回按钮 */}
              <div className="lg:hidden flex items-center justify-between mb-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    pauseTracking();
                    savePosition(currentTime);
                    setSelectedVideo(null);
                  }}
                  className="rounded-xl hover:bg-accent/50"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  返回
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatPracticeTime()}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-2" />
                  <span>{completedCount}/{subtitles.length}</span>
                </div>
              </div>

              {/* 左侧视频区域 (PC) / 上方视频区域 (移动端) */}
              <div className="w-full lg:w-3/5 xl:w-2/3">
                {/* PC端顶部控制栏 */}
                <div className="hidden lg:flex items-center justify-between gap-2 mb-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      pauseTracking();
                      savePosition(currentTime);
                      setSelectedVideo(null);
                    }}
                    className="rounded-xl hover:bg-accent/50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    返回列表
                  </Button>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{formatPracticeTime()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>{completedCount}/{subtitles.length} 句已完成</span>
                    </div>
                  </div>
                </div>
                
                <div className="glass rounded-2xl overflow-hidden">
                  <VideoPlayer
                    videoUrl={selectedVideo.video_url}
                    subtitles={subtitles}
                    subtitlesCn={subtitlesCn}
                    currentSubtitle={currentSubtitle}
                    onTimeUpdate={handleTimeUpdate}
                    onSubtitleClick={handleSubtitleClick}
                    showTranslation={showTranslation}
                    onToggleTranslation={() => setShowTranslation(!showTranslation)}
                  />
                </div>
              </div>
              
              {/* 右侧字幕列表 (PC) / 下方字幕列表 (移动端) */}
              <div className="w-full lg:w-2/5 xl:w-1/3 glass rounded-2xl h-[350px] lg:h-[calc(100vh-200px)] lg:max-h-[700px] overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border/50 flex items-center justify-between">
                  <span className="text-sm font-medium">字幕列表 Subtitles</span>
                  <span className="text-xs text-muted-foreground">{subtitles.length} 句</span>
                </div>
                <SubtitleList
                  subtitles={subtitles}
                  subtitlesCn={subtitlesCn}
                  currentSubtitle={currentSubtitle}
                  onSubtitleClick={handleSubtitleClick}
                  onPractice={(subtitle) => {
                    const index = subtitles.findIndex(s => s === subtitle);
                    handlePractice(subtitle, index);
                  }}
                  onAddWord={(word, context) => setLookupWord({ word, context })}
                  showTranslation={showTranslation}
                  completedSentences={progress?.completed_sentences || []}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {practiceSubtitle && (
        <VoiceAssessment
          originalText={practiceSubtitle.text}
          videoId={selectedVideo?.id}
          onClose={() => {
            setPracticeSubtitle(null);
            setPracticeSubtitleIndex(null);
          }}
          onSuccess={handleAssessmentSuccess}
        />
      )}

      {lookupWord && (
        <WordLookup
          word={lookupWord.word}
          context={lookupWord.context}
          onClose={() => setLookupWord(null)}
        />
      )}
    </>
  );
};

export default Learn;
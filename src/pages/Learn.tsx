import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { VideoPlayer } from '@/components/VideoPlayer';
import { SubtitleList } from '@/components/SubtitleList';
import { VoiceAssessment } from '@/components/VoiceAssessment';
import { WordLookup } from '@/components/WordLookup';
import { supabase, Video, Subtitle, parseSRT } from '@/lib/supabase';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, Eye, EyeOff } from 'lucide-react';

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
  const [lookupWord, setLookupWord] = useState<{ word: string; context: string } | null>(null);

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

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    const current = subtitles.find(s => time >= s.start && time <= s.end);
    setCurrentSubtitle(current || null);
  };

  const handleSubtitleClick = (subtitle: Subtitle) => {
    setCurrentSubtitle(subtitle);
  };

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
            // Video Player View
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-2/3">
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedVideo(null)}
                    className="rounded-xl hover:bg-accent/50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    返回
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTranslation(!showTranslation)}
                    className="rounded-xl hover:bg-accent/50"
                  >
                    {showTranslation ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showTranslation ? '隐藏翻译' : '显示翻译'}
                  </Button>
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
                  />
                </div>
              </div>
              
              <div className="lg:w-1/3 glass rounded-2xl h-[400px] lg:h-[600px] overflow-hidden">
                <SubtitleList
                  subtitles={subtitles}
                  subtitlesCn={subtitlesCn}
                  currentSubtitle={currentSubtitle}
                  onSubtitleClick={handleSubtitleClick}
                  onPractice={setPracticeSubtitle}
                  onAddWord={(word, context) => setLookupWord({ word, context })}
                  showTranslation={showTranslation}
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
          onClose={() => setPracticeSubtitle(null)}
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
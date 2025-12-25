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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{selectedVideo?.title || '视频学习'} - AI English Club</title>
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-4">
          {!selectedVideo ? (
            // Video List
            <div>
              <h1 className="text-2xl font-bold mb-6">选择视频</h1>
              {videos.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">暂无可用视频</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map(video => (
                    <div
                      key={video.id}
                      className="border-4 border-foreground bg-card cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => selectVideo(video)}
                    >
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">🎬</span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold">{video.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{video.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Video Player View
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="lg:w-2/3">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(null)}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    返回
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTranslation(!showTranslation)}
                  >
                    {showTranslation ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {showTranslation ? '隐藏翻译' : '显示翻译'}
                  </Button>
                </div>
                
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
              
              <div className="lg:w-1/3 border-2 border-foreground h-[400px] lg:h-[600px]">
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

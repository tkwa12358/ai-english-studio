import React, { useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileVideo, FileText, Play, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { parseSRT, Subtitle } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { VideoPlayer } from '@/components/VideoPlayer';
import { SubtitleList } from '@/components/SubtitleList';
import { VoiceAssessment } from '@/components/VoiceAssessment';
import { WordLookup } from '@/components/WordLookup';

const LocalLearn: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [subtitlesEn, setSubtitlesEn] = useState<Subtitle[]>([]);
  const [subtitlesCn, setSubtitlesCn] = useState<Subtitle[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentText, setAssessmentText] = useState('');
  const [showWordLookup, setShowWordLookup] = useState(false);
  const [lookupWord, setLookupWord] = useState('');
  const [lookupContext, setLookupContext] = useState('');
  const [isLearning, setIsLearning] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const srtEnInputRef = useRef<HTMLInputElement>(null);
  const srtCnInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({
          title: '文件格式错误',
          description: '请选择视频文件',
          variant: 'destructive',
        });
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      toast({
        title: '视频已加载',
        description: file.name,
      });
    }
  }, [toast]);

  const handleSrtEnUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsed = parseSRT(content);
        setSubtitlesEn(parsed);
        toast({
          title: '英文字幕已加载',
          description: `共 ${parsed.length} 条字幕`,
        });
      };
      reader.readAsText(file);
    }
  }, [toast]);

  const handleSrtCnUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const parsed = parseSRT(content);
        setSubtitlesCn(parsed);
        toast({
          title: '中文字幕已加载',
          description: `共 ${parsed.length} 条字幕`,
        });
      };
      reader.readAsText(file);
    }
  }, [toast]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    const current = subtitlesEn.find(s => time >= s.start && time <= s.end);
    if (current) {
      const translation = subtitlesCn.find(s => 
        Math.abs(s.start - current.start) < 1
      )?.text;
      setCurrentSubtitle({ ...current, translation });
    } else {
      setCurrentSubtitle(null);
    }
  }, [subtitlesEn, subtitlesCn]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const handlePractice = useCallback((subtitle: Subtitle) => {
    setAssessmentText(subtitle.text);
    setShowAssessment(true);
  }, []);

  const handleWordClick = useCallback((word: string, context: string) => {
    setLookupWord(word);
    setLookupContext(context);
    setShowWordLookup(true);
  }, []);

  const startLearning = useCallback(() => {
    if (!videoUrl) {
      toast({
        title: '请先上传视频',
        variant: 'destructive',
      });
      return;
    }
    if (subtitlesEn.length === 0) {
      toast({
        title: '请上传英文字幕',
        description: '需要英文字幕才能进行学习',
        variant: 'destructive',
      });
      return;
    }
    setIsLearning(true);
  }, [videoUrl, subtitlesEn.length, toast]);

  const combinedSubtitles = subtitlesEn.map(sub => ({
    ...sub,
    translation: subtitlesCn.find(s => Math.abs(s.start - sub.start) < 1)?.text,
  }));

  if (isLearning) {
    return (
      <>
        <Helmet>
          <title>本地学习 - AI English Club</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-6">
            <Button
              variant="ghost"
              onClick={() => setIsLearning(false)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回上传
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <VideoPlayer
                  videoUrl={videoUrl}
                  subtitles={subtitlesEn}
                  subtitlesCn={subtitlesCn}
                  currentSubtitle={currentSubtitle}
                  onTimeUpdate={handleTimeUpdate}
                  onSubtitleClick={(subtitle) => handleSeek(subtitle.start)}
                />
              </div>
              <div className="lg:col-span-1 border-2 border-foreground h-[500px]">
                <SubtitleList
                  subtitles={subtitlesEn}
                  subtitlesCn={subtitlesCn}
                  currentSubtitle={currentSubtitle}
                  onSubtitleClick={(subtitle) => handleSeek(subtitle.start)}
                  onPractice={handlePractice}
                  onAddWord={handleWordClick}
                />
              </div>
            </div>
          </main>

          {showAssessment && (
            <VoiceAssessment
              originalText={assessmentText}
              onClose={() => setShowAssessment(false)}
            />
          )}

          {showWordLookup && (
            <WordLookup
              word={lookupWord}
              context={lookupContext}
              onClose={() => setShowWordLookup(false)}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>本地学习 - AI English Club</title>
        <meta name="description" content="上传本地视频和字幕文件进行英语学习" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate('/learn')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回在线学习
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  本地视频学习
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video Upload */}
                <div className="space-y-2">
                  <Label htmlFor="video">视频文件</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      ref={videoInputRef}
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full"
                    >
                      <FileVideo className="h-4 w-4 mr-2" />
                      {videoFile ? videoFile.name : '选择视频文件'}
                    </Button>
                  </div>
                  {videoUrl && (
                    <video
                      src={videoUrl}
                      className="w-full rounded-lg mt-2"
                      style={{ maxHeight: '200px' }}
                      controls
                    />
                  )}
                </div>

                {/* English SRT Upload */}
                <div className="space-y-2">
                  <Label htmlFor="srt-en">英文字幕 (SRT) *必需</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      ref={srtEnInputRef}
                      id="srt-en"
                      type="file"
                      accept=".srt"
                      onChange={handleSrtEnUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => srtEnInputRef.current?.click()}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {subtitlesEn.length > 0
                        ? `已加载 ${subtitlesEn.length} 条字幕`
                        : '选择英文字幕文件'}
                    </Button>
                  </div>
                </div>

                {/* Chinese SRT Upload */}
                <div className="space-y-2">
                  <Label htmlFor="srt-cn">中文字幕 (SRT) 可选</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      ref={srtCnInputRef}
                      id="srt-cn"
                      type="file"
                      accept=".srt"
                      onChange={handleSrtCnUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => srtCnInputRef.current?.click()}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {subtitlesCn.length > 0
                        ? `已加载 ${subtitlesCn.length} 条字幕`
                        : '选择中文字幕文件'}
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={startLearning}
                  disabled={!videoUrl || subtitlesEn.length === 0}
                >
                  <Play className="h-4 w-4 mr-2" />
                  开始学习
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default LocalLearn;

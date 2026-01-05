import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileVideo, FileText, Play, ArrowLeft, CheckCircle, Eye, EyeOff, Clock, CheckCircle2, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { parseSRT, parseBilingualSRT, Subtitle } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { VideoPlayer, VideoPlayerRef } from '@/components/VideoPlayer';
import { SubtitleList } from '@/components/SubtitleList';
import { ProfessionalAssessment } from '@/components/ProfessionalAssessment';
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
  const [showTranslation, setShowTranslation] = useState(true);
  const [practiceSubtitle, setPracticeSubtitle] = useState<Subtitle | null>(null);
  const [practiceSubtitleIndex, setPracticeSubtitleIndex] = useState<number | null>(null);
  const [showWordLookup, setShowWordLookup] = useState(false);
  const [lookupWord, setLookupWord] = useState('');
  const [lookupContext, setLookupContext] = useState('');
  const [isLearning, setIsLearning] = useState(false);
  const [completedSentences, setCompletedSentences] = useState<number[]>([]);
  const [practiceTime, setPracticeTime] = useState(0);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const practiceStartRef = useRef<number | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<VideoPlayerRef>(null);

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

  // 处理双语 SRT 上传 - 使用和管理后台一致的解析逻辑
  const handleSrtUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const srtContent = event.target?.result as string;

        // 使用和管理后台一致的解析逻辑
        const lines = srtContent.trim().split(/\r?\n/);
        let enSRT = '';
        let cnSRT = '';

        let i = 0;
        let counter = 1;

        while (i < lines.length) {
          const indexLine = lines[i].trim();
          if (!indexLine) {
            i++;
            continue;
          }

          // Expecting index number
          if (!/^\d+$/.test(indexLine)) {
            i++; continue;
          }

          // Time line
          const timeLine = lines[i + 1]?.trim();

          // Content lines
          const contentLines: string[] = [];
          let j = i + 2;
          while (j < lines.length && lines[j].trim() !== '') {
            contentLines.push(lines[j].trim());
            j++;
          }

          let enLine = '';
          let cnLine = '';

          if (contentLines.length > 0) {
            if (contentLines.length === 1) {
              // Check if contains Chinese
              if (/[\u4e00-\u9fa5]/.test(contentLines[0])) {
                cnLine = contentLines[0];
              } else {
                enLine = contentLines[0];
              }
            } else {
              // First line is English, rest is Chinese
              enLine = contentLines[0];
              cnLine = contentLines.slice(1).join('\n');
            }
          }

          if (enLine) {
            enSRT += `${counter}\n${timeLine}\n${enLine}\n\n`;
          }
          if (cnLine) {
            cnSRT += `${counter}\n${timeLine}\n${cnLine}\n\n`;
          }

          if (enLine || cnLine) counter++;
          i = j;
        }

        // 使用 parseSRT 解析分离后的字幕
        const enSubtitles = parseSRT(enSRT);
        const cnSubtitles = parseSRT(cnSRT);

        setSubtitlesEn(enSubtitles);
        setSubtitlesCn(cnSubtitles);
        setSrtFile(file);

        if (enSubtitles.length > 0 && cnSubtitles.length > 0) {
          toast({
            title: '双语字幕已加载',
            description: `共 ${enSubtitles.length} 条英文字幕，${cnSubtitles.length} 条中文字幕`,
          });
        } else if (enSubtitles.length > 0) {
          toast({
            title: '英文字幕已加载',
            description: `共 ${enSubtitles.length} 条字幕（未检测到中文翻译）`,
          });
        } else {
          toast({
            title: '字幕解析错误',
            description: '未能识别有效的英文字幕内容',
            variant: 'destructive',
          });
        }
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
    if (playerRef.current) {
      playerRef.current.seek(time);
      playerRef.current.play();
    }
  }, []);

  const handlePractice = useCallback((subtitle: Subtitle, index: number) => {
    // 跟读时暂停视频
    if (playerRef.current) {
      playerRef.current.pause();
    }
    setPracticeSubtitle(subtitle);
    setPracticeSubtitleIndex(index);
    if (!practiceStartRef.current) {
      practiceStartRef.current = Date.now();
    }
  }, []);

  const handleAssessmentSuccess = useCallback((score: number) => {
    if (practiceSubtitleIndex !== null && score >= 60) {
      setCompletedSentences(prev => {
        if (prev.includes(practiceSubtitleIndex)) return prev;
        return [...prev, practiceSubtitleIndex].sort((a, b) => a - b);
      });
    }
    // Update practice time
    if (practiceStartRef.current) {
      const elapsed = Math.floor((Date.now() - practiceStartRef.current) / 1000);
      setPracticeTime(prev => prev + elapsed);
      practiceStartRef.current = Date.now();
    }
  }, [practiceSubtitleIndex]);

  const handleWordClick = useCallback((word: string, context: string) => {
    setLookupWord(word);
    setLookupContext(context);
    setShowWordLookup(true);
  }, []);

  const formatPracticeTime = useCallback(() => {
    const totalSeconds = practiceTime;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`;
    }
    return `${seconds}秒`;
  }, [practiceTime]);

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
    practiceStartRef.current = Date.now();
  }, [videoUrl, subtitlesEn.length, toast]);

  if (isLearning) {
    return (
      <>
        <Helmet>
          <title>本地学习 - AI English Club</title>
        </Helmet>
        <div className="min-h-screen gradient-bg dark:gradient-bg-dark">
          <Header />
          <main className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsLearning(false)}
                  className="rounded-xl hover:bg-accent/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回上传
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

              {/* 学习进度指示器 */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatPracticeTime()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>{completedSentences.length}/{subtitlesEn.length} 句</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="glass rounded-2xl overflow-hidden">
                  <VideoPlayer
                    ref={playerRef}
                    videoUrl={videoUrl}
                    subtitles={subtitlesEn}
                    subtitlesCn={subtitlesCn}
                    currentSubtitle={currentSubtitle}
                    onTimeUpdate={handleTimeUpdate}
                    onSubtitleClick={(subtitle) => handleSeek(subtitle.start)}
                    showTranslation={showTranslation}
                    onToggleTranslation={() => setShowTranslation(!showTranslation)}
                  />
                </div>
              </div>
              <div className="lg:col-span-1 glass rounded-2xl h-[500px] overflow-hidden">
                <SubtitleList
                  subtitles={subtitlesEn}
                  subtitlesCn={subtitlesCn}
                  currentSubtitle={currentSubtitle}
                  onSubtitleClick={(subtitle) => handleSeek(subtitle.start)}
                  onPractice={(subtitle) => {
                    const index = subtitlesEn.findIndex(s => s === subtitle);
                    handlePractice(subtitle, index);
                  }}
                  onAddWord={handleWordClick}
                  showTranslation={showTranslation}
                  completedSentences={completedSentences}
                />
              </div>
            </div>
          </main>

          {practiceSubtitle && (
            <ProfessionalAssessment
              originalText={practiceSubtitle.text}
              onClose={() => {
                setPracticeSubtitle(null);
                setPracticeSubtitleIndex(null);
                // 关闭后恢复播放
                playerRef.current?.play();
              }}
              onSuccess={handleAssessmentSuccess}
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
      <div className="min-h-screen gradient-bg dark:gradient-bg-dark">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate('/learn')}
              className="mb-6 rounded-xl hover:bg-accent/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回在线学习
            </Button>

            <div className="glass rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">本地视频学习</h1>
                  <p className="text-sm text-muted-foreground">上传视频和字幕开始学习</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Video Upload */}
                <div className="space-y-2">
                  <Label htmlFor="video" className="text-sm font-medium">视频文件</Label>
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
                    className={`w-full h-auto py-4 rounded-xl border-dashed border-2 hover:bg-accent/30 ${videoFile ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {videoFile ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <FileVideo className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={videoFile ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        {videoFile ? videoFile.name : '点击选择视频文件'}
                      </span>
                    </div>
                  </Button>
                  {videoUrl && (
                    <video
                      src={videoUrl}
                      className="w-full rounded-xl mt-3 shadow-md"
                      style={{ maxHeight: '200px' }}
                      controls
                    />
                  )}
                </div>

                {/* Bilingual SRT Upload */}
                <div className="space-y-2">
                  <Label htmlFor="srt" className="text-sm font-medium">
                    字幕文件 (SRT) <span className="text-destructive">*必需</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    支持双语字幕（第一行英文，第二行中文）或纯英文字幕
                  </p>
                  <Input
                    ref={srtInputRef}
                    id="srt"
                    type="file"
                    accept=".srt"
                    onChange={handleSrtUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => srtInputRef.current?.click()}
                    className={`w-full h-auto py-4 rounded-xl border-dashed border-2 hover:bg-accent/30 ${srtFile ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {srtFile ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={srtFile ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        {srtFile
                          ? `${srtFile.name} (${subtitlesEn.length} 条英文${subtitlesCn.length > 0 ? ` + ${subtitlesCn.length} 条中文` : ''})`
                          : '点击选择字幕文件'}
                      </span>
                    </div>
                  </Button>
                </div>

                <Button
                  className="w-full py-6 text-lg rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
                  size="lg"
                  onClick={startLearning}
                  disabled={!videoUrl || subtitlesEn.length === 0}
                >
                  <Play className="h-5 w-5 mr-2" />
                  开始学习
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default LocalLearn;
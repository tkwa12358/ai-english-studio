import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceAssessmentProps {
  originalText: string;
  onClose: () => void;
  videoId?: string;
}

interface AssessmentResult {
  accuracy_score: number;
  fluency_score: number;
  completeness_score: number;
  overall_score: number;
  feedback: string;
  word_scores?: { word: string; score: number; correct: boolean }[];
}

export const VoiceAssessment = ({ originalText, onClose, videoId }: VoiceAssessmentProps) => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if ((profile?.voice_minutes || 0) <= 0) {
      toast({
        variant: 'destructive',
        title: '语音评测时间不足',
        description: '请使用授权码充值',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: 'destructive',
        title: '无法启动录音',
        description: '请确保已授权麦克风权限',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitForAssessment = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('voice-assessment', {
          body: {
            audio: base64Audio.split(',')[1],
            originalText,
            videoId,
          },
        });

        if (error) throw error;

        setResult(data);
        await refreshProfile();
        
        toast({
          title: '评测完成',
          description: `总分: ${data.overall_score}分`,
        });
      };
    } catch (error) {
      console.error('Assessment error:', error);
      toast({
        variant: 'destructive',
        title: '评测失败',
        description: '请稍后重试',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg border-4 border-foreground bg-card p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">语音评测</h2>
        
        {/* Original Text */}
        <div className="border-2 border-foreground p-4 mb-6 bg-muted">
          <p className="text-sm text-muted-foreground mb-1">请朗读以下内容：</p>
          <p className="text-lg font-medium">{originalText}</p>
        </div>

        {/* Recording Controls */}
        {!result && (
          <div className="text-center mb-6">
            {!audioBlob ? (
              <Button
                size="lg"
                className={cn(
                  "w-24 h-24 rounded-full",
                  isRecording && "bg-destructive hover:bg-destructive animate-pulse"
                )}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Square className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={playRecording}>
                    <Volume2 className="w-4 h-4 mr-2" />
                    播放录音
                  </Button>
                  <Button variant="outline" onClick={() => setAudioBlob(null)}>
                    重新录制
                  </Button>
                </div>
                <Button 
                  size="lg" 
                  onClick={submitForAssessment}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      评测中...
                    </>
                  ) : (
                    '提交评测'
                  )}
                </Button>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-4">
              {isRecording ? '点击停止录音' : audioBlob ? '' : '点击开始录音'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              剩余评测时间: {profile?.voice_minutes || 0}分钟
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-foreground p-4 text-center">
                <p className="text-sm text-muted-foreground">准确度</p>
                <p className={cn("text-3xl font-bold", getScoreColor(result.accuracy_score))}>
                  {result.accuracy_score}
                </p>
                <Progress value={result.accuracy_score} className="mt-2" />
              </div>
              <div className="border-2 border-foreground p-4 text-center">
                <p className="text-sm text-muted-foreground">流利度</p>
                <p className={cn("text-3xl font-bold", getScoreColor(result.fluency_score))}>
                  {result.fluency_score}
                </p>
                <Progress value={result.fluency_score} className="mt-2" />
              </div>
              <div className="border-2 border-foreground p-4 text-center">
                <p className="text-sm text-muted-foreground">完整度</p>
                <p className={cn("text-3xl font-bold", getScoreColor(result.completeness_score))}>
                  {result.completeness_score}
                </p>
                <Progress value={result.completeness_score} className="mt-2" />
              </div>
              <div className="border-2 border-foreground p-4 text-center bg-primary text-primary-foreground">
                <p className="text-sm opacity-80">总分</p>
                <p className="text-3xl font-bold">
                  {result.overall_score}
                </p>
                <Progress value={result.overall_score} className="mt-2" />
              </div>
            </div>

            {result.feedback && (
              <div className="border-2 border-foreground p-4">
                <p className="text-sm text-muted-foreground mb-1">AI反馈：</p>
                <p className="text-sm">{result.feedback}</p>
              </div>
            )}

            {result.word_scores && (
              <div className="border-2 border-foreground p-4">
                <p className="text-sm text-muted-foreground mb-2">单词评分：</p>
                <div className="flex flex-wrap gap-2">
                  {result.word_scores.map((ws, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "px-2 py-1 text-sm border-2",
                        ws.correct 
                          ? "border-green-500 text-green-700 bg-green-50" 
                          : "border-red-500 text-red-700 bg-red-50"
                      )}
                    >
                      {ws.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {result && (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                setResult(null);
                setAudioBlob(null);
              }}
            >
              再练一次
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="flex-1">
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
};

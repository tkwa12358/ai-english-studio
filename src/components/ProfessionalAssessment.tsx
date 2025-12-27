import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Loader2, Volume2, Crown, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProfessionalAssessmentProps {
  originalText: string;
  onClose: () => void;
  videoId?: string;
  onSuccess?: (score: number) => void;
}

interface WordScore {
  word: string;
  accuracy_score: number;
  error_type?: string;
  phonemes?: Array<{
    phoneme: string;
    score: number;
  }>;
}

interface AssessmentResult {
  overall_score: number;
  pronunciation_score: number;
  accuracy_score: number;
  fluency_score: number;
  completeness_score: number;
  feedback: string;
  words_result?: WordScore[];
  remaining_minutes: number;
  minutes_used: number;
  billed: boolean;
  billing_error?: string;
}

export const ProfessionalAssessment = ({ 
  originalText, 
  onClose, 
  videoId, 
  onSuccess 
}: ProfessionalAssessmentProps) => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 获取专业评测剩余时间
  const professionalMinutes = (profile as { professional_voice_minutes?: number })?.professional_voice_minutes || 0;

  const startRecording = async () => {
    if (professionalMinutes <= 0) {
      toast({
        variant: 'destructive',
        title: '专业评测时间不足',
        description: '请使用授权码充值专业评测时间',
      });
      return;
    }

    try {
      setError(null);
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
    } catch (err) {
      console.error('Error starting recording:', err);
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
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        const { data, error: funcError } = await supabase.functions.invoke('professional-assessment', {
          body: {
            audio_base64: base64Audio.split(',')[1],
            original_text: originalText,
          },
        });

        if (funcError) throw funcError;

        // 检查是否计费成功
        if (data.billed === false && data.error) {
          // 评测失败，未计费
          setError(data.message || data.error);
          toast({
            variant: 'destructive',
            title: '评测失败',
            description: `${data.message || data.error}`,
          });
        } else {
          // 评测成功
          setResult(data);
          await refreshProfile();
          
          if (data.billing_error) {
            toast({
              variant: 'default',
              title: '评测完成',
              description: data.billing_error,
            });
          } else {
            toast({
              title: '专业评测完成',
              description: `总分: ${data.overall_score}分，已扣除${data.minutes_used}分钟`,
            });
          }
          
          if (onSuccess && data.overall_score) {
            onSuccess(data.overall_score);
          }
        }
      };
    } catch (err) {
      console.error('Assessment error:', err);
      setError('评测服务暂时不可用，未扣除时间');
      toast({
        variant: 'destructive',
        title: '评测失败',
        description: '服务暂时不可用，未扣除时间',
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

  const getWordBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-500 text-green-800';
    if (score >= 60) return 'bg-yellow-100 border-yellow-500 text-yellow-800';
    return 'bg-red-100 border-red-500 text-red-800';
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg border-4 border-primary bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">专业语音评测</h2>
          <Badge variant="secondary" className="ml-auto">音素级评分</Badge>
        </div>
        
        {/* Original Text */}
        <div className="border-2 border-primary p-4 mb-6 bg-primary/5">
          <p className="text-sm text-muted-foreground mb-1">请朗读以下内容：</p>
          <p className="text-lg font-medium">{originalText}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 bg-destructive/10 border-2 border-destructive text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

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
                  <Button variant="outline" onClick={() => { setAudioBlob(null); setError(null); }}>
                    重新录制
                  </Button>
                </div>
                <Button 
                  size="lg" 
                  onClick={submitForAssessment}
                  disabled={isProcessing}
                  className="w-full bg-primary"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      专业评测中...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      提交专业评测
                    </>
                  )}
                </Button>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-4">
              {isRecording ? '点击停止录音' : audioBlob ? '' : '点击开始录音'}
            </p>
            <p className="text-xs text-primary mt-2 font-medium">
              专业评测剩余: {professionalMinutes}分钟
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 mb-6">
            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-primary p-4 text-center bg-primary text-primary-foreground">
                <p className="text-sm opacity-80">总分</p>
                <p className="text-4xl font-bold">
                  {result.overall_score}
                </p>
                <Progress value={result.overall_score} className="mt-2" />
              </div>
              <div className="border-2 border-foreground p-4 text-center">
                <p className="text-sm text-muted-foreground">发音准确</p>
                <p className={cn("text-3xl font-bold", getScoreColor(result.pronunciation_score))}>
                  {result.pronunciation_score}
                </p>
                <Progress value={result.pronunciation_score} className="mt-2" />
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
            </div>

            {/* Feedback */}
            {result.feedback && (
              <div className="border-2 border-foreground p-4">
                <p className="text-sm text-muted-foreground mb-1">专业反馈：</p>
                <p className="text-sm">{result.feedback}</p>
              </div>
            )}

            {/* Word-level scores */}
            {result.words_result && result.words_result.length > 0 && (
              <div className="border-2 border-foreground p-4">
                <p className="text-sm text-muted-foreground mb-2">单词评分：</p>
                <div className="flex flex-wrap gap-2">
                  {result.words_result.map((ws, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "px-3 py-2 text-sm border-2 rounded",
                        getWordBgColor(ws.accuracy_score)
                      )}
                    >
                      <div className="font-medium">{ws.word}</div>
                      <div className="text-xs opacity-80">{ws.accuracy_score}分</div>
                      {ws.error_type && ws.error_type !== 'None' && (
                        <div className="text-xs">{ws.error_type}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing info */}
            {result.billed && (
              <p className="text-xs text-muted-foreground text-center">
                已扣除 {result.minutes_used} 分钟，剩余 {result.remaining_minutes} 分钟
              </p>
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
                setError(null);
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

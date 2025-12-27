import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AssessmentSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNormal: () => void;
  onSelectProfessional: () => void;
}

export const AssessmentSelector = ({
  open,
  onOpenChange,
  onSelectNormal,
  onSelectProfessional,
}: AssessmentSelectorProps) => {
  const { profile } = useAuth();
  
  // 获取评测时间
  const normalMinutes = profile?.voice_minutes || 0;
  const professionalMinutes = (profile as { professional_voice_minutes?: number })?.professional_voice_minutes || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">选择评测模式</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* 普通评测 */}
          <button
            onClick={() => {
              onOpenChange(false);
              onSelectNormal();
            }}
            className={cn(
              "border-2 border-border p-4 rounded-lg text-left transition-all hover:border-primary hover:bg-accent/50",
              normalMinutes <= 0 && "opacity-50"
            )}
            disabled={normalMinutes <= 0}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Mic className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">普通评测</h3>
                  <span className="text-xs text-muted-foreground">{normalMinutes} 分钟</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  AI 智能语音识别 + 评分
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <li>• 语音转文字识别</li>
                  <li>• AI 智能评分</li>
                  <li>• 基础反馈建议</li>
                </ul>
              </div>
            </div>
          </button>

          {/* 专业评测 */}
          <button
            onClick={() => {
              onOpenChange(false);
              onSelectProfessional();
            }}
            className={cn(
              "border-2 border-primary p-4 rounded-lg text-left transition-all hover:bg-primary/5 relative overflow-hidden",
              professionalMinutes <= 0 && "opacity-50"
            )}
            disabled={professionalMinutes <= 0}
          >
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-bl">
              推荐
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-primary">专业评测</h3>
                  <span className="text-xs text-primary">{professionalMinutes} 分钟</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  微软/腾讯 专业发音评测
                </p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <li className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>音素级精准评分</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>单词级发音纠错</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>专业发音指导</span>
                  </li>
                </ul>
              </div>
            </div>
          </button>

          {/* 时间不足提示 */}
          {(normalMinutes <= 0 || professionalMinutes <= 0) && (
            <p className="text-xs text-center text-muted-foreground">
              评测时间不足？使用授权码充值
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

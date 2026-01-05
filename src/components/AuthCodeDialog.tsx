import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Ticket, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthCodeDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AuthCodeDialog = ({ trigger, open, onOpenChange }: AuthCodeDialogProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const { user, refreshProfile, profile } = useAuth();
  const { toast } = useToast();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const professionalSeconds = (profile as { professional_voice_minutes?: number })?.professional_voice_minutes || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast({
        variant: 'destructive',
        title: '请输入授权码',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: '请先登录',
      });
      return;
    }

    setLoading(true);

    try {
      // 查询授权码
      const { data: codeData, error: codeError } = await supabase
        .from('auth_codes')
        .select('*')
        .eq('code', code.trim())
        .eq('is_used', false)
        .single();

      if (codeError || !codeData) {
        toast({
          variant: 'destructive',
          title: '授权码无效',
          description: '授权码不存在或已被使用',
        });
        setLoading(false);
        return;
      }

      // 检查是否过期
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast({
          variant: 'destructive',
          title: '授权码已过期',
        });
        setLoading(false);
        return;
      }

      // 检查授权码类型，计算秒数
      const codeType = codeData.code_type;
      let secondsToAdd = 0;

      if (codeType === 'pro_10min') {
        secondsToAdd = 10 * 60; // 600秒
      } else if (codeType === 'pro_30min') {
        secondsToAdd = 30 * 60; // 1800秒
      } else if (codeType === 'pro_60min') {
        secondsToAdd = 60 * 60; // 3600秒
      } else if (codeData.minutes_amount) {
        secondsToAdd = codeData.minutes_amount * 60; // 转换为秒
      } else {
        toast({
          variant: 'destructive',
          title: '授权码类型不支持',
          description: '此授权码不能用于充值语音评测时间',
        });
        setLoading(false);
        return;
      }

      // 更新用户的专业评测时间（直接存储秒数）
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          professional_voice_minutes: professionalSeconds + secondsToAdd,
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // 标记授权码已使用
      await supabase
        .from('auth_codes')
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString(),
        })
        .eq('code', code.trim());

      // 刷新用户信息
      await refreshProfile();

      toast({
        title: '充值成功',
        description: `已添加 ${secondsToAdd} 秒专业评测时间`,
      });

      setCode('');
      setIsOpen(false);
    } catch (err) {
      console.error('Auth code error:', err);
      toast({
        variant: 'destructive',
        title: '操作失败',
        description: '请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="rounded-xl gap-2">
      <Ticket className="w-4 h-4" />
      <span className="hidden sm:inline">授权码</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            使用授权码
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 当前时间显示 */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm">
              当前专业评测时间: <span className="font-bold text-primary">{professionalSeconds} 秒</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authCode">授权码</Label>
              <Input
                id="authCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入授权码"
                autoComplete="off"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                输入授权码可充值专业语音评测时间
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                '确认使用'
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

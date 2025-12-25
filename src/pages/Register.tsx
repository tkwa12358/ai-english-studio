import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

const Register = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: '密码不匹配',
        description: '请确保两次输入的密码一致',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: '密码太短',
        description: '密码至少需要6个字符',
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(phone, password, authCode || undefined);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: '注册失败',
        description: error.message,
      });
    } else {
      toast({
        title: '注册成功',
        description: '欢迎加入AI English Club！',
      });
      navigate('/learn');
    }
    
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>注册 - AI English Club</title>
        <meta name="description" content="注册AI English Club账号，开始您的英语口语学习之旅" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md border-4 border-foreground bg-card p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary mx-auto mb-4 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">AI</span>
            </div>
            <h1 className="text-3xl font-bold">加入我们</h1>
            <p className="text-muted-foreground mt-2">创建您的学习账号</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="border-2 border-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请设置密码"
                className="border-2 border-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                className="border-2 border-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authCode">授权码 (可选)</Label>
              <Input
                id="authCode"
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="如有授权码请输入"
                className="border-2 border-foreground"
              />
              <p className="text-xs text-muted-foreground">授权码可获得额外语音评测次数</p>
            </div>

            <Button 
              type="submit" 
              className="w-full text-lg py-6 shadow-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              已有账号？
              <Link to="/login" className="text-foreground font-bold underline ml-1">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;

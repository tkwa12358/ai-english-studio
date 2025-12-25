import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Settings, LogOut, Menu, X, Mic, Key } from 'lucide-react';
import { useState } from 'react';
import RedeemCode from './RedeemCode';

export const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="glass sticky top-0 z-50 border-b border-border/30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-bold text-xl">AI</span>
          </div>
          <span className="font-semibold text-xl hidden sm:block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            English Club
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link to="/learn">
                <Button variant="ghost" className="rounded-xl hover:bg-accent/50">视频学习</Button>
              </Link>
              <Link to="/wordbook">
                <Button variant="ghost" className="rounded-xl hover:bg-accent/50">
                  <BookOpen className="w-4 h-4 mr-2" />
                  单词本
                </Button>
              </Link>
              <Link to="/local-learn">
                <Button variant="ghost" className="rounded-xl hover:bg-accent/50">本地学习</Button>
              </Link>
              <RedeemCode
                trigger={
                  <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                    <Mic className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">{profile?.voice_minutes || 0}分钟</span>
                    <Key className="w-3 h-3 text-muted-foreground" />
                  </div>
                }
              />
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" className="rounded-xl border-primary/30">
                    <Settings className="w-4 h-4 mr-2" />
                    管理后台
                  </Button>
                </Link>
              )}
              <Button variant="ghost" onClick={handleSignOut} className="rounded-xl hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md">
                登录
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden rounded-xl"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden glass-strong border-t border-border/30">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/learn" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">视频学习</Button>
                </Link>
                <Link to="/wordbook" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">
                    <BookOpen className="w-4 h-4 mr-2" />
                    单词本
                  </Button>
                </Link>
                <Link to="/local-learn" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start rounded-xl">本地学习</Button>
                </Link>
                <RedeemCode
                  trigger={
                    <div className="flex items-center gap-2 px-3 py-2 glass rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                      <Mic className="w-4 h-4 text-primary" />
                      <span>语音评测: {profile?.voice_minutes || 0}分钟</span>
                      <Key className="w-3 h-3 text-muted-foreground" />
                    </div>
                  }
                />
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start rounded-xl">
                      <Settings className="w-4 h-4 mr-2" />
                      管理后台
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" className="w-full justify-start rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  退出
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-accent">登录</Button>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};
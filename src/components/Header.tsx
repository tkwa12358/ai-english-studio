import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Settings, LogOut, Menu, X, Mic } from 'lucide-react';
import { useState } from 'react';

export const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b-2 border-foreground bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">AI</span>
          </div>
          <span className="font-bold text-xl hidden sm:block">English Club</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link to="/learn">
                <Button variant="ghost">视频学习</Button>
              </Link>
              <Link to="/wordbook">
                <Button variant="ghost">
                  <BookOpen className="w-4 h-4 mr-2" />
                  单词本
                </Button>
              </Link>
              <Link to="/local-learn">
                <Button variant="ghost">本地学习</Button>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1 border-2 border-foreground">
                <Mic className="w-4 h-4" />
                <span className="font-mono">{profile?.voice_minutes || 0}分钟</span>
              </div>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    管理后台
                  </Button>
                </Link>
              )}
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button>登录</Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t-2 border-foreground bg-background">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/learn" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">视频学习</Button>
                </Link>
                <Link to="/wordbook" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    单词本
                  </Button>
                </Link>
                <Link to="/local-learn" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">本地学习</Button>
                </Link>
                <div className="flex items-center gap-2 px-3 py-2 border-2 border-foreground">
                  <Mic className="w-4 h-4" />
                  <span>语音评测: {profile?.voice_minutes || 0}分钟</span>
                </div>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      管理后台
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  退出
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">登录</Button>
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

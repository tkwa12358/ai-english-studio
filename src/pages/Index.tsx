import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { Play, BookOpen, Mic, Upload } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>AI English Club - 专为油管英语口语设计的学习网站</title>
        <meta name="description" content="AI驱动的英语口语学习平台，支持视频跟读、语音评测、单词本等功能" />
      </Helmet>
      
      <div className="min-h-screen gradient-bg dark:gradient-bg-dark">
        {/* Hero Section */}
        <section className="pt-8 pb-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent mx-auto mb-8 flex items-center justify-center shadow-xl rounded-3xl">
                <span className="text-primary-foreground font-bold text-4xl">AI</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Let's speak now!
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10">
                专为油管英语口语设计的学习网站
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link to="/learn">
                    <Button size="lg" className="text-lg px-8 py-6 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-xl transition-all">
                      <Play className="w-5 h-5 mr-2" />
                      开始学习
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button size="lg" className="text-lg px-8 py-6 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-xl transition-all">
                        登录
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-2xl glass border-primary/30 hover:bg-accent/50">
                        注册账号
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">核心功能</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass p-6 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Play className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">视频学习</h3>
                <p className="text-muted-foreground">支持逐句复读、变速播放、AB循环等功能</p>
              </div>
              <div className="glass p-6 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-accent/40 to-accent/20 rounded-2xl flex items-center justify-center mb-4">
                  <Mic className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">语音评测</h3>
                <p className="text-muted-foreground">AI智能评分，从准确度、流利度、完整度多维度评测</p>
              </div>
              <div className="glass p-6 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">单词本</h3>
                <p className="text-muted-foreground">点击即查，一键收藏，自动音标翻译</p>
              </div>
              <div className="glass p-6 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-accent/40 to-primary/20 rounded-2xl flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">本地学习</h3>
                <p className="text-muted-foreground">支持导入本地视频和SRT字幕文件</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
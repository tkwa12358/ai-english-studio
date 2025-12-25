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
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="border-b-4 border-foreground">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-24 h-24 bg-primary mx-auto mb-8 flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-4xl">AI</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Let's speak now!</h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                专为油管英语口语设计的学习网站
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link to="/learn">
                    <Button size="lg" className="text-lg px-8 py-6 shadow-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                      <Play className="w-5 h-5 mr-2" />
                      开始学习
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <Button size="lg" className="text-lg px-8 py-6 shadow-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                        登录
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button size="lg" variant="outline" className="text-lg px-8 py-6">
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
              <div className="border-4 border-foreground p-6 bg-card shadow-md hover:shadow-lg transition-shadow">
                <Play className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">视频学习</h3>
                <p className="text-muted-foreground">支持逐句复读、变速播放、AB循环等功能</p>
              </div>
              <div className="border-4 border-foreground p-6 bg-card shadow-md hover:shadow-lg transition-shadow">
                <Mic className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">语音评测</h3>
                <p className="text-muted-foreground">AI智能评分，从准确度、流利度、完整度多维度评测</p>
              </div>
              <div className="border-4 border-foreground p-6 bg-card shadow-md hover:shadow-lg transition-shadow">
                <BookOpen className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">单词本</h3>
                <p className="text-muted-foreground">点击即查，一键收藏，自动音标翻译</p>
              </div>
              <div className="border-4 border-foreground p-6 bg-card shadow-md hover:shadow-lg transition-shadow">
                <Upload className="w-12 h-12 mb-4" />
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

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { Play, BookOpen, Mic, Upload, CheckCircle, Key, Shield, Database, Zap, Users } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { user } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);

  const testCode = 'AUTO-TEST-2025';
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(testCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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

        {/* Test Accounts Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Test Code */}
              <Card className="glass border-primary/30">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-xl">
                    <Key className="w-5 h-5 text-primary" />
                    自动化测试授权码
                  </CardTitle>
                  <CardDescription>
                    注册后使用，可获得120分钟语音评测时间
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground font-mono text-lg rounded-xl hover:opacity-90 transition-all shadow-lg"
                  >
                    {testCode}
                    {copiedCode ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-sans">复制</span>
                    )}
                  </button>
                  {copiedCode && (
                    <p className="mt-2 text-sm text-primary">已复制到剪贴板！</p>
                  )}
                </CardContent>
              </Card>

              {/* Testing Guide */}
              <Card className="glass border-accent/30">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2 text-xl">
                    <Users className="w-5 h-5 text-accent" />
                    测试指南
                  </CardTitle>
                  <CardDescription>
                    快速开始测试的步骤
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <span>点击"注册账号"，用任意手机号注册</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <span>登录后在个人中心兑换测试授权码</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <span>测试后台需先通过数据库添加admin角色</span>
                    </li>
                  </ol>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs">
                    <p className="font-medium mb-1">数据库添加管理员：</p>
                    <code className="text-primary break-all">
                      INSERT INTO user_roles (user_id, role) VALUES ('用户UUID', 'admin');
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
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

        {/* Implemented Features Section */}
        <section className="py-16 md:py-24 bg-background/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">已实现功能清单</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              以下功能已完成开发，可用于自动化测试和功能验证
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Admin Backend */}
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    管理后台
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      视频管理（CRUD）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      分类管理
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      用户管理
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      授权码管理
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      语音评测模型配置
                    </li>
                  </ul>
                  <Link to="/admin" className="block mt-4">
                    <Button variant="outline" size="sm" className="w-full rounded-xl">
                      访问后台 →
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Voice Assessment API */}
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-primary" />
                    语音评测API
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      灵活的模型转发系统
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      默认Lovable AI模拟评测
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      支持Azure/OpenAI接入
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      用量统计与扣费
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      多维度评分（准确/流利/完整）
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Authorization Code System */}
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    授权码系统
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      注册授权码（10分钟）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      充值授权码（60分钟）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      授权码兑换Edge Function
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      自动更新用户时长
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs">
                    <p className="font-medium mb-1">测试授权码：</p>
                    <code className="text-primary">TEST-10MIN-001</code> (10分钟)<br/>
                    <code className="text-primary">TEST-60MIN-001</code> (60分钟)
                  </div>
                </CardContent>
              </Card>

              {/* Database */}
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    数据库设计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      profiles（用户档案）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      user_roles（角色权限）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      videos（视频资源）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      learning_progress（学习进度）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      voice_assessments（评测记录）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      word_book（单词本）
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Edge Functions */}
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Edge Functions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      voice-assessment（语音评测）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      redeem-code（授权码兑换）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      translate（翻译API）
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* User Features */}
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    用户功能
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      手机号注册/登录
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      视频播放器（变速/循环）
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      字幕显示/隐藏
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      单词点击查询
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      学习进度追踪
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      本地视频+字幕导入
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">快速访问</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/login">
                <Button variant="outline" className="rounded-xl glass">
                  登录页面
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="rounded-xl glass">
                  注册页面
                </Button>
              </Link>
              <Link to="/learn">
                <Button variant="outline" className="rounded-xl glass">
                  在线学习
                </Button>
              </Link>
              <Link to="/local-learn">
                <Button variant="outline" className="rounded-xl glass">
                  本地学习
                </Button>
              </Link>
              <Link to="/wordbook">
                <Button variant="outline" className="rounded-xl glass">
                  单词本
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline" className="rounded-xl glass">
                  管理后台
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Index;
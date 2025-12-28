import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, CheckCircle2, BookOpen, TrendingUp, Award, ChevronLeft } from 'lucide-react';
import { LearningCalendar } from '@/components/LearningCalendar';

interface DayActivity {
  date: string;
  practiceTime: number;
  completedSentences: number;
}

interface LearningStats {
  totalPracticeTime: number;
  totalCompletedSentences: number;
  totalWords: number;
  masteredWords: number;
  videosWatched: number;
  recentActivity: DayActivity[];
  allActivity: DayActivity[];
  currentStreak: number;
  longestStreak: number;
}

const Statistics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // 获取学习进度数据
      const { data: progressData } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id);

      // 获取单词本数据
      const { data: wordData } = await supabase
        .from('word_book')
        .select('*')
        .eq('user_id', user.id);

      // 计算统计数据
      const totalPracticeTime = progressData?.reduce((sum, p) => sum + (p.total_practice_time || 0), 0) || 0;
      const totalCompletedSentences = progressData?.reduce((sum, p) => sum + (p.completed_sentences?.length || 0), 0) || 0;
      const videosWatched = progressData?.length || 0;
      const totalWords = wordData?.length || 0;
      const masteredWords = wordData?.filter(w => w.mastery_level >= 3).length || 0;

      // 生成活动数据
      const { recentActivity, allActivity } = generateActivityData(progressData || []);

      // 计算连续学习天数
      const { currentStreak, longestStreak } = calculateStreaks(allActivity);

      setStats({
        totalPracticeTime,
        totalCompletedSentences,
        totalWords,
        masteredWords,
        videosWatched,
        recentActivity,
        allActivity,
        currentStreak,
        longestStreak,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateActivityData = (progressData: any[]) => {
    const activityMap = new Map<string, DayActivity>();
    const today = new Date();

    // 收集所有有学习记录的日期
    progressData.forEach(p => {
      const updateDate = new Date(p.updated_at).toISOString().split('T')[0];
      const existing = activityMap.get(updateDate) || { date: updateDate, practiceTime: 0, completedSentences: 0 };
      existing.practiceTime += p.total_practice_time || 0;
      existing.completedSentences += p.completed_sentences?.length || 0;
      activityMap.set(updateDate, existing);
    });

    // 生成最近7天活动数据
    const recentActivity: DayActivity[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      recentActivity.push(activityMap.get(dateStr) || { date: dateStr, practiceTime: 0, completedSentences: 0 });
    }

    // 生成过去90天活动数据用于日历
    const allActivity: DayActivity[] = [];
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      allActivity.push(activityMap.get(dateStr) || { date: dateStr, practiceTime: 0, completedSentences: 0 });
    }

    return { recentActivity, allActivity };
  };

  const calculateStreaks = (activity: DayActivity[]) => {
    // 按日期排序（从最近到最远）
    const sortedActivity = [...activity].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 计算当前连续天数（从今天或昨天开始）
    let checkDate = new Date(today);
    let foundTodayOrYesterday = false;

    for (const day of sortedActivity) {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));

      if (day.practiceTime > 0) {
        // 如果是今天或昨天有学习记录，开始计算连续天数
        if (!foundTodayOrYesterday && diffDays <= 1) {
          foundTodayOrYesterday = true;
          currentStreak = 1;
          checkDate = new Date(dayDate);
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (foundTodayOrYesterday) {
          // 检查是否连续
          const expectedDate = checkDate.toISOString().split('T')[0];
          if (day.date === expectedDate) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    // 计算最长连续天数
    let streak = 0;
    let prevDate: Date | null = null;

    for (const day of sortedActivity.reverse()) {
      if (day.practiceTime > 0) {
        const dayDate = new Date(day.date);

        if (prevDate === null) {
          streak = 1;
        } else {
          const diffDays = Math.floor((dayDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
          } else {
            longestStreak = Math.max(longestStreak, streak);
            streak = 1;
          }
        }
        prevDate = dayDate;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 0;
        prevDate = null;
      }
    }
    longestStreak = Math.max(longestStreak, streak, currentStreak);

    return { currentStreak, longestStreak };
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg dark:gradient-bg-dark flex items-center justify-center">
        <div className="glass p-8 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const masteryProgress = stats?.totalWords ? (stats.masteredWords / stats.totalWords) * 100 : 0;

  return (
    <>
      <Helmet>
        <title>学习统计 - AI English Club</title>
        <meta name="description" content="查看您的英语学习进度和统计数据" />
      </Helmet>

      <div className="min-h-screen gradient-bg dark:gradient-bg-dark flex flex-col">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-6">
          {/* 返回按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/learn')}
            className="mb-4 rounded-xl hover:bg-accent/50 gap-2 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            返回列表
          </Button>

          <h1 className="text-2xl font-bold mb-6">学习统计 Statistics</h1>

          {/* 概览卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="glass border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  总学习时长
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatTime(stats?.totalPracticeTime || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total Practice Time</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  完成句数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats?.totalCompletedSentences || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completed Sentences</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  词汇量
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats?.totalWords || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Words in Book</p>
              </CardContent>
            </Card>

            <Card className="glass border-border/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  学习视频
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {stats?.videosWatched || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Videos Studied</p>
              </CardContent>
            </Card>
          </div>

          {/* 学习日历和详细统计 */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* 学习日历 */}
            <Card className="glass border-border/30">
              <CardHeader>
                <CardTitle>学习日历 Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <LearningCalendar
                  activityData={stats?.allActivity || []}
                  currentStreak={stats?.currentStreak || 0}
                  longestStreak={stats?.longestStreak || 0}
                />
              </CardContent>
            </Card>

            {/* 单词掌握度 */}
            <Card className="glass border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  单词掌握度 Mastery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>已掌握 Mastered</span>
                      <span className="font-medium">{stats?.masteredWords || 0} / {stats?.totalWords || 0}</span>
                    </div>
                    <Progress value={masteryProgress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/30">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{stats?.masteredWords || 0}</div>
                      <div className="text-xs text-muted-foreground">掌握</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-accent">{(stats?.totalWords || 0) - (stats?.masteredWords || 0)}</div>
                      <div className="text-xs text-muted-foreground">学习中</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{Math.round(masteryProgress)}%</div>
                      <div className="text-xs text-muted-foreground">掌握率</div>
                    </div>
                  </div>

                  {/* 近7天活动 */}
                  <div className="pt-4 border-t border-border/30">
                    <h4 className="text-sm font-medium mb-3">近7天学习 Weekly</h4>
                    <div className="space-y-2">
                      {stats?.recentActivity.map((day, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-10 text-xs text-muted-foreground">
                            {formatDate(day.date)}
                          </div>
                          <div className="flex-1">
                            <div
                              className="h-4 bg-primary/30 rounded-sm"
                              style={{
                                width: `${Math.min(100, (day.practiceTime / 1800) * 100)}%`,
                                minWidth: day.practiceTime > 0 ? '8px' : '2px'
                              }}
                            />
                          </div>
                          <div className="w-12 text-right text-xs text-muted-foreground">
                            {Math.floor(day.practiceTime / 60)}分
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 学习建议 */}
          <Card className="glass border-border/30">
            <CardHeader>
              <CardTitle>学习建议 Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <h4 className="font-medium mb-1">🎯 保持连续性</h4>
                  <p className="text-sm text-muted-foreground">每天学习15-30分钟，比偶尔长时间学习更有效</p>
                </div>
                <div className="p-4 bg-accent/5 rounded-xl border border-accent/20">
                  <h4 className="font-medium mb-1">🔄 复习单词</h4>
                  <p className="text-sm text-muted-foreground">定期复习单词本中的词汇，提高掌握率</p>
                </div>
                <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20">
                  <h4 className="font-medium mb-1">🎤 多练跟读</h4>
                  <p className="text-sm text-muted-foreground">跟读练习能有效提升口语和听力水平</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default Statistics;
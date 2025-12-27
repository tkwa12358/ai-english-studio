import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Download, RefreshCw, Database, CheckCircle, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DictionaryInfo {
  id: string;
  name: string;
  description: string;
  wordCount: number;
}

interface ImportStatus {
  isImporting: boolean;
  currentDict: string;
  progress: number;
  message: string;
}

const DICTIONARIES: DictionaryInfo[] = [
  { id: 'cet4', name: 'CET-4 四级词汇', description: '大学英语四级核心词汇', wordCount: 4500 },
  { id: 'cet6', name: 'CET-6 六级词汇', description: '大学英语六级核心词汇', wordCount: 5500 },
  { id: 'junior', name: '初中词汇', description: '初中阶段必备词汇', wordCount: 1600 },
  { id: 'senior', name: '高中词汇', description: '高中阶段必备词汇', wordCount: 3500 },
  { id: 'toefl', name: '托福词汇', description: 'TOEFL考试核心词汇', wordCount: 8000 },
];

const AdminDictionary: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalWords: 0,
    withPhonetic: 0,
    withTranslation: 0,
    withDefinitions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isImporting: false,
    currentDict: '',
    progress: 0,
    message: '',
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get total count
      const { count: totalWords } = await supabase
        .from('word_cache')
        .select('*', { count: 'exact', head: true });

      // Get words with phonetic
      const { count: withPhonetic } = await supabase
        .from('word_cache')
        .select('*', { count: 'exact', head: true })
        .not('phonetic', 'is', null);

      // Get words with translation
      const { count: withTranslation } = await supabase
        .from('word_cache')
        .select('*', { count: 'exact', head: true })
        .not('translation', 'is', null);

      // Get words with definitions
      const { count: withDefinitions } = await supabase
        .from('word_cache')
        .select('*', { count: 'exact', head: true })
        .not('definitions', 'eq', '[]');

      setStats({
        totalWords: totalWords || 0,
        withPhonetic: withPhonetic || 0,
        withTranslation: withTranslation || 0,
        withDefinitions: withDefinitions || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast({
        title: '获取统计失败',
        description: '无法获取词库统计信息',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const importDictionary = async (dictId: string) => {
    setImportStatus({
      isImporting: true,
      currentDict: dictId,
      progress: 0,
      message: `正在导入 ${dictId} 词库...`,
    });

    try {
      const { data, error } = await supabase.functions.invoke('import-dictionary', {
        body: { action: 'import', dictionary: dictId },
      });

      if (error) throw error;

      setImportStatus(prev => ({ ...prev, progress: 100, message: '导入完成!' }));
      
      toast({
        title: '导入成功',
        description: `${dictId} 词库已成功导入`,
      });

      // Refresh stats
      await fetchStats();
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '导入词库时出错',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setImportStatus({
          isImporting: false,
          currentDict: '',
          progress: 0,
          message: '',
        });
      }, 1000);
    }
  };

  const importAllDictionaries = async () => {
    setImportStatus({
      isImporting: true,
      currentDict: 'all',
      progress: 0,
      message: '正在导入所有词库...',
    });

    try {
      const { data, error } = await supabase.functions.invoke('import-dictionary', {
        body: { action: 'import-all' },
      });

      if (error) throw error;

      setImportStatus(prev => ({ ...prev, progress: 100, message: '所有词库导入完成!' }));
      
      toast({
        title: '导入成功',
        description: '所有词库已成功导入',
      });

      await fetchStats();
    } catch (error) {
      console.error('Import all failed:', error);
      toast({
        title: '导入失败',
        description: error instanceof Error ? error.message : '导入词库时出错',
        variant: 'destructive',
      });
    } finally {
      setTimeout(() => {
        setImportStatus({
          isImporting: false,
          currentDict: '',
          progress: 0,
          message: '',
        });
      }, 1000);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">词库管理</h1>
            <p className="text-muted-foreground">管理和导入词库数据</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新统计
            </Button>
            <Button onClick={importAllDictionaries} disabled={importStatus.isImporting}>
              {importStatus.isImporting && importStatus.currentDict === 'all' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              一键导入全部
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>总单词数</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Database className="h-6 w-6 text-primary" />
                {loading ? '...' : stats.totalWords.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>含音标</CardDescription>
              <CardTitle className="text-3xl">
                {loading ? '...' : stats.withPhonetic.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={stats.totalWords ? (stats.withPhonetic / stats.totalWords) * 100 : 0} 
                className="h-2"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>含中文释义</CardDescription>
              <CardTitle className="text-3xl">
                {loading ? '...' : stats.withTranslation.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={stats.totalWords ? (stats.withTranslation / stats.totalWords) * 100 : 0} 
                className="h-2"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>含英文定义</CardDescription>
              <CardTitle className="text-3xl">
                {loading ? '...' : stats.withDefinitions.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={stats.totalWords ? (stats.withDefinitions / stats.totalWords) * 100 : 0} 
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Import Progress */}
        {importStatus.isImporting && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{importStatus.message}</span>
                  <span className="text-sm text-muted-foreground">{importStatus.progress}%</span>
                </div>
                <Progress value={importStatus.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dictionary List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              可用词库
            </CardTitle>
            <CardDescription>
              选择需要导入的词库，点击导入按钮开始导入
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>词库名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="text-right">预计词汇量</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DICTIONARIES.map((dict) => (
                  <TableRow key={dict.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {dict.name}
                        <Badge variant="outline">{dict.id}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{dict.description}</TableCell>
                    <TableCell className="text-right">
                      {dict.wordCount.toLocaleString()} 词
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => importDictionary(dict.id)}
                        disabled={importStatus.isImporting}
                      >
                        {importStatus.isImporting && importStatus.currentDict === dict.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        导入
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Help Info */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• 点击"一键导入全部"可以导入所有预置词库</p>
            <p>• 也可以单独导入某个词库，已存在的单词会自动跳过</p>
            <p>• 导入过程中请勿关闭页面</p>
            <p>• 词库数据来源：CET-4/6、中高考词汇表、托福词汇表</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDictionary;

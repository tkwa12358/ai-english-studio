import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Crown, Key, Users, Activity } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { format } from 'date-fns';

interface ExtendedProfile {
  id: string;
  user_id: string;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  professional_voice_minutes: number;
  created_at: string;
  updated_at: string;
}

const AdminUsers: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedProfile | null>(null);
  const [userToReset, setUserToReset] = useState<ExtendedProfile | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    role: 'user',
    professional_voice_minutes: 0,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      return data as ExtendedProfile[];
    },
  });

  // 查询用户统计数据
  const { data: statsData } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      // 查询总用户数
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 查询今日活跃用户（今日有学习记录的用户去重）
      const today = new Date().toISOString().split('T')[0];
      const { data: activeData } = await supabase
        .from('learning_progress')
        .select('user_id')
        .gte('updated_at', today);

      const todayActive = activeData ? new Set(activeData.map(d => d.user_id)).size : 0;

      return {
        totalUsers: totalUsers || 0,
        todayActive
      };
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('profiles').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: '用户更新成功' });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({ title: '更新失败', description: error.message, variant: 'destructive' });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-action', {
        body: { action: 'reset_password', userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({
        title: '密码已重置',
        description: '密码已重置为: SpeakAI@123',
        duration: 5000
      });
      setResetDialogOpen(false);
      setUserToReset(null);
    },
    onError: (error) => {
      toast({ title: '重置失败', description: error.message, variant: 'destructive' });
    }
  });

  const handleEdit = (user: ExtendedProfile) => {
    setEditingUser(user);
    setFormData({
      display_name: user.display_name || '',
      role: user.role,
      professional_voice_minutes: user.professional_voice_minutes || 0,
    });
    setIsOpen(true);
  };

  const handleResetClick = (user: ExtendedProfile) => {
    setUserToReset(user);
    setResetDialogOpen(true);
  };

  const confirmReset = () => {
    if (userToReset) {
      resetPasswordMutation.mutate(userToReset.user_id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: formData });
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>用户管理 - 管理后台</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">用户管理</h1>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">总注册人数</span>
            </div>
            <p className="text-2xl font-bold">{statsData?.totalUsers || 0}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm">今日活跃</span>
            </div>
            <p className="text-2xl font-bold">{statsData?.todayActive || 0}</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>手机号</TableHead>
              <TableHead>昵称</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>专业评测时长</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>{user.display_name || '-'}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {user.role === 'admin' ? '管理员' : '用户'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3 text-primary" />
                    {user.professional_voice_minutes || 0} 秒
                  </div>
                </TableCell>
                <TableCell>{format(new Date(user.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetClick(user)}
                      title="重置密码"
                    >
                      <Key className="h-4 w-4 text-orange-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑用户</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">昵称</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">用户</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_voice_minutes">专业评测时长(秒)</Label>
                <Input
                  id="professional_voice_minutes"
                  type="number"
                  value={formData.professional_voice_minutes}
                  onChange={(e) => setFormData({ ...formData, professional_voice_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <Button type="submit" className="w-full">
                保存
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* 密码重置确认对话框 */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认重置密码</DialogTitle>
              <DialogDescription>
                您确定要重置用户 {userToReset?.phone || userToReset?.display_name} 的密码吗？
                <br />
                重置后的密码将为：<span className="font-bold text-primary">SpeakAI@123</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetDialogOpen(false)}>取消</Button>
              <Button variant="destructive" onClick={confirmReset} disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? '重置中...' : '确认重置'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
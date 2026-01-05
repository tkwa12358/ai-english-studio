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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, AuthCode } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { format } from 'date-fns';

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const AdminAuthCodes: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code_type: 'pro_10min',
    count: 1,
    expires_days: 30,
  });

  const { data: authCodes = [] } = useQuery({
    queryKey: ['admin-auth-codes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('auth_codes')
        .select('*')
        .order('created_at', { ascending: false });
      return data as AuthCode[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const codes = [];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expires_days);
      
      // 根据类型确定秒数（只有专业评测）
      let secondsAmount = 0;
      if (data.code_type === 'pro_10min') secondsAmount = 10 * 60;
      else if (data.code_type === 'pro_30min') secondsAmount = 30 * 60;
      else if (data.code_type === 'pro_60min') secondsAmount = 60 * 60;
      
      for (let i = 0; i < data.count; i++) {
        codes.push({
          code: generateCode(),
          code_type: data.code_type,
          minutes_amount: secondsAmount, // 字段名保留，实际存储秒数
          expires_at: expiresAt.toISOString(),
        });
      }
      
      const { error } = await supabase.from('auth_codes').insert(codes);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-auth-codes'] });
      toast({ title: `成功创建 ${formData.count} 个授权码` });
      setIsOpen(false);
      setFormData({ code_type: 'pro_10min', count: 1, expires_days: 30 });
    },
    onError: (error) => {
      toast({ title: '创建失败', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('auth_codes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-auth-codes'] });
      toast({ title: '授权码删除成功' });
    },
    onError: (error) => {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' });
    },
  });

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: '已复制到剪贴板' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getCodeTypeLabel = (codeType: string) => {
    switch (codeType) {
      case 'pro_10min': return '专业评测 600秒';
      case 'pro_30min': return '专业评测 1800秒';
      case 'pro_60min': return '专业评测 3600秒';
      case 'registration': return '注册';
      // 兼容旧数据
      case '10min': return '(旧)普通 10分钟';
      case '60min': return '(旧)普通 60分钟';
      default: return codeType;
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>授权码管理 - 管理后台</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">授权码管理</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                批量生成
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>批量生成授权码</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code_type">授权码类型</Label>
                  <Select
                    value={formData.code_type}
                    onValueChange={(value) => setFormData({ ...formData, code_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro_10min">专业评测 600秒 (10分钟)</SelectItem>
                      <SelectItem value="pro_30min">专业评测 1800秒 (30分钟)</SelectItem>
                      <SelectItem value="pro_60min">专业评测 3600秒 (60分钟)</SelectItem>
                      <SelectItem value="registration">注册授权码</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="count">生成数量</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.count}
                    onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_days">有效期(天)</Label>
                  <Input
                    id="expires_days"
                    type="number"
                    min={1}
                    value={formData.expires_days}
                    onChange={(e) => setFormData({ ...formData, expires_days: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  生成
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>授权码</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>时长</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>过期时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authCodes.map((code) => (
              <TableRow key={code.id}>
                <TableCell className="font-mono">{code.code}</TableCell>
                <TableCell>{getCodeTypeLabel(code.code_type as string)}</TableCell>
                <TableCell>{code.minutes_amount || '-'} 秒</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      code.is_used
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {code.is_used ? '已使用' : '未使用'}
                  </span>
                </TableCell>
                <TableCell>
                  {code.expires_at
                    ? format(new Date(code.expires_at), 'yyyy-MM-dd')
                    : '永久'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(code.code, code.id)}
                    >
                      {copiedId === code.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {!code.is_used && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(code.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default AdminAuthCodes;
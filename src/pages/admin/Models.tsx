import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Pencil, Trash2, Cpu } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, VoiceAssessmentModel } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PROVIDERS = [
  { value: 'lovable', label: 'Lovable AI (内置)' },
  { value: 'azure', label: 'Azure Speech Services' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'openai_compatible', label: 'OpenAI兼容 (中国大陆)' },
  { value: 'speechsuper', label: 'SpeechSuper' },
];

const AdminModels: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<VoiceAssessmentModel | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'lovable',
    api_endpoint: '',
    api_key_secret_name: '',
    model_identifier: '',
    is_active: true,
    priority: 0,
    supports_realtime: true,
  });

  const { data: models = [] } = useQuery({
    queryKey: ['admin-models'],
    queryFn: async () => {
      const { data } = await supabase
        .from('voice_assessment_models')
        .select('*')
        .order('priority', { ascending: false });
      return data as VoiceAssessmentModel[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('voice_assessment_models').insert({
        ...data,
        api_key_secret_name: data.api_key_secret_name || null,
        model_identifier: data.model_identifier || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      toast({ title: '模型配置创建成功' });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: '创建失败', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('voice_assessment_models')
        .update({
          ...data,
          api_key_secret_name: data.api_key_secret_name || null,
          model_identifier: data.model_identifier || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      toast({ title: '模型配置更新成功' });
      setIsOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: '更新失败', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('voice_assessment_models').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      toast({ title: '模型配置删除成功' });
    },
    onError: (error) => {
      toast({ title: '删除失败', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'lovable',
      api_endpoint: '',
      api_key_secret_name: '',
      model_identifier: '',
      is_active: true,
      priority: 0,
      supports_realtime: true,
    });
    setEditingModel(null);
  };

  const handleEdit = (model: VoiceAssessmentModel) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      provider: model.provider,
      api_endpoint: model.api_endpoint,
      api_key_secret_name: model.api_key_secret_name || '',
      model_identifier: model.model_identifier || '',
      is_active: model.is_active,
      priority: model.priority,
      supports_realtime: model.supports_realtime,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModel) {
      updateMutation.mutate({ id: editingModel.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>评测模型管理 - 管理后台</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">语音评测模型配置</h1>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                添加模型
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingModel ? '编辑模型' : '添加模型'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">模型名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如: Azure Speech CN"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">提供商</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_endpoint">API端点</Label>
                  <Input
                    id="api_endpoint"
                    value={formData.api_endpoint}
                    onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                    placeholder="https://api.example.com/v1/chat/completions"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key_secret_name">API密钥Secret名称</Label>
                  <Input
                    id="api_key_secret_name"
                    value={formData.api_key_secret_name}
                    onChange={(e) => setFormData({ ...formData, api_key_secret_name: e.target.value })}
                    placeholder="例如: AZURE_SPEECH_KEY"
                  />
                  <p className="text-xs text-muted-foreground">
                    在边缘函数环境变量中配置的密钥名称
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model_identifier">模型标识</Label>
                  <Input
                    id="model_identifier"
                    value={formData.model_identifier}
                    onChange={(e) => setFormData({ ...formData, model_identifier: e.target.value })}
                    placeholder="例如: gpt-4o"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">优先级</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    数字越大优先级越高
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">启用</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="supports_realtime"
                    checked={formData.supports_realtime}
                    onCheckedChange={(checked) => setFormData({ ...formData, supports_realtime: checked })}
                  />
                  <Label htmlFor="supports_realtime">支持实时评测</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingModel ? '保存' : '创建'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              默认模型
            </CardTitle>
            <CardDescription>
              系统默认使用 Lovable AI 进行语音评测，无需额外配置。
              如需使用其他模型，请在下方添加配置。
            </CardDescription>
          </CardHeader>
        </Card>

        {models.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>提供商</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>实时</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>
                    {PROVIDERS.find((p) => p.value === model.provider)?.label || model.provider}
                  </TableCell>
                  <TableCell>{model.priority}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        model.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {model.is_active ? '启用' : '禁用'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {model.supports_realtime ? '是' : '否'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(model)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(model.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminModels;

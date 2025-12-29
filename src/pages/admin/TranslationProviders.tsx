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
import { Plus, Pencil, Trash2, Languages, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const PROVIDER_TYPES = [
    { value: 'baidu', label: '百度翻译', description: '虽然免费额度有限，但中文翻译质量较好' },
    { value: 'tencent', label: '腾讯翻译君', description: '翻译准确度高，适合科技类文本' },
    { value: 'google', label: 'Google 翻译', description: '支持语言最丰富，需要配置代理' },
    { value: 'microsoft', label: '微软翻译', description: 'Azure 认知服务，适合企业级应用' },
];

interface TranslationProvider {
    id: string;
    name: string;
    provider_type: 'baidu' | 'tencent' | 'google' | 'microsoft';
    app_id: string | null;
    api_key: string; // 注意：从 API 获取时可能显示为掩码或空
    api_secret: string | null;
    is_active: boolean;
    is_default: boolean;
    created_at: string;
}

const TranslationProviders: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<TranslationProvider | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        provider_type: 'baidu',
        app_id: '',
        api_key: '',
        api_secret: '',
        is_active: true,
    });

    const { data: providers = [] } = useQuery({
        queryKey: ['translation-providers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('translation_providers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as TranslationProvider[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            // 检查是否已有默认提供商
            if (providers.length === 0) {
                // 第一个自动设为默认
            }

            const { error } = await supabase.from('translation_providers').insert([{
                name: data.name,
                provider_type: data.provider_type,
                app_id: data.app_id || null,
                api_key: data.api_key,
                api_secret: data.api_secret || null,
                is_active: data.is_active,
                is_default: providers.length === 0, // 如果是第一个，设为默认
            }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['translation-providers'] });
            toast({ title: '翻译服务商创建成功' });
            setIsOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast({ title: '创建失败', description: error.message, variant: 'destructive' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
            const updateData: any = {
                name: data.name,
                provider_type: data.provider_type,
                app_id: data.app_id || null,
                is_active: data.is_active,
            };

            // 只有在输入框不为空时才更新密钥
            if (data.api_key) updateData.api_key = data.api_key;
            if (data.api_secret) updateData.api_secret = data.api_secret;

            const { error } = await supabase
                .from('translation_providers')
                .update(updateData)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['translation-providers'] });
            toast({ title: '翻译服务商更新成功' });
            setIsOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast({ title: '更新失败', description: error.message, variant: 'destructive' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('translation_providers').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['translation-providers'] });
            toast({ title: '已删除' });
        },
        onError: (error) => {
            toast({ title: '删除失败', description: error.message, variant: 'destructive' });
        },
    });

    const setDefaultMutation = useMutation({
        mutationFn: async (id: string) => {
            // 先取消所有默认
            await supabase
                .from('translation_providers')
                .update({ is_default: false })
                .neq('id', id); // 这是一个优化，但在 Supabase 中可能需要 separate query 或者不加条件更新所有

            // 这里简单处理：先全部设为 false (client side update or two queries)
            // 安全起见，先更新所有为 false
            await supabase
                .from('translation_providers')
                .update({ is_default: false })
                .gt('created_at', '1970-01-01'); // Hack to update all

            // 设置新默认
            const { error } = await supabase
                .from('translation_providers')
                .update({ is_default: true })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['translation-providers'] });
            toast({ title: '已设为默认服务商' });
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            provider_type: 'baidu',
            app_id: '',
            api_key: '',
            api_secret: '',
            is_active: true,
        });
        setEditingProvider(null);
    };

    const handleEdit = (provider: TranslationProvider) => {
        setEditingProvider(provider);
        setFormData({
            name: provider.name,
            provider_type: provider.provider_type as any,
            app_id: provider.app_id || '',
            api_key: '', // 不回显密钥
            api_secret: '', // 不回显密钥
            is_active: provider.is_active,
        });
        setIsOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProvider) {
            updateMutation.mutate({ id: editingProvider.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    return (
        <AdminLayout>
            <Helmet>
                <title>翻译配置 - 管理后台</title>
            </Helmet>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Languages className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold">翻译服务配置</h1>
                    </div>
                    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                添加服务商
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingProvider ? '编辑服务商' : '添加服务商'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">配置名称</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="例如: 百度通用翻译"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="provider_type">服务类型</Label>
                                    <Select
                                        value={formData.provider_type}
                                        onValueChange={(value) => setFormData({ ...formData, provider_type: value as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROVIDER_TYPES.map((p) => (
                                                <SelectItem key={p.value} value={p.value}>
                                                    <div>
                                                        <div>{p.label}</div>
                                                        <div className="text-xs text-muted-foreground">{p.description}</div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.provider_type === 'baidu' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="app_id">APP ID</Label>
                                        <Input
                                            id="app_id"
                                            value={formData.app_id}
                                            onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
                                            placeholder="百度翻译 APP ID"
                                            required
                                        />
                                    </div>
                                )}

                                {formData.provider_type === 'tencent' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="app_id">SecretId</Label>
                                        <Input
                                            id="app_id"
                                            value={formData.app_id}
                                            onChange={(e) => setFormData({ ...formData, app_id: e.target.value })}
                                            placeholder="腾讯云 SecretId"
                                            required
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="api_key">
                                        {formData.provider_type === 'baidu' ? '密钥 (Secret Key)' :
                                            formData.provider_type === 'tencent' ? 'SecretKey' : 'API Key'}
                                    </Label>
                                    <Input
                                        id="api_key"
                                        type="password"
                                        value={formData.api_key}
                                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                                        placeholder={editingProvider ? '留空表示不修改' : '请输入密钥'}
                                        required={!editingProvider}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label htmlFor="is_active">启用</Label>
                                </div>

                                <Button type="submit" className="w-full">
                                    {editingProvider ? '保存' : '创建'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>配置说明</CardTitle>
                        <CardDescription>
                            默认使用优先级最高（设为默认）的服务商。百度翻译需要 APP ID 和密钥。
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>名称</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>APP ID / 标识</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>默认</TableHead>
                            <TableHead>操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {providers.map((provider) => (
                            <TableRow key={provider.id}>
                                <TableCell className="font-medium">{provider.name}</TableCell>
                                <TableCell>
                                    {PROVIDER_TYPES.find((p) => p.value === provider.provider_type)?.label || provider.provider_type}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{provider.app_id || '-'}</TableCell>
                                <TableCell>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${provider.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {provider.is_active ? '启用' : '禁用'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {provider.is_default ? (
                                        <Star className="h-4 w-4 text-primary fill-primary" />
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDefaultMutation.mutate(provider.id)}
                                            disabled={!provider.is_active}
                                        >
                                            设为默认
                                        </Button>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(provider)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteMutation.mutate(provider.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
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

export default TranslationProviders;

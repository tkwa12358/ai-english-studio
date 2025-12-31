import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        // 注意：这里必须使用 Service Role Key 才能执行 admin 操作
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 1. 验证调用者身份
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            throw new Error('Unauthorized');
        }

        // 2. 验证管理员权限
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            throw new Error('Forbidden: Admin access required');
        }

        // 3. 执行操作
        const { action, userId } = await req.json();

        if (action === 'reset_password') {
            if (!userId) throw new Error('Missing userId');

            console.log(`Resetting password for user ${userId} by admin ${user.id}`);

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { password: 'SpeakAI@123' } // 硬编码的默认重置密码
            );

            if (updateError) {
                throw updateError;
            }

            return new Response(
                JSON.stringify({ success: true, message: 'Password reset successfully to SpeakAI@123' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error: any) {
        console.error('Admin Action Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

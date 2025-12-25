import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // 验证用户
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: '请输入授权码' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 使用服务角色查询授权码
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 查找授权码
    const { data: authCode, error: codeError } = await supabaseAdmin
      .from('auth_codes')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .eq('is_used', false)
      .single();

    if (codeError || !authCode) {
      console.log('Code not found or already used:', code);
      return new Response(
        JSON.stringify({ error: '授权码无效或已被使用' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 检查是否过期
    if (authCode.expires_at && new Date(authCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: '授权码已过期' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取用户当前分钟数
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('voice_minutes')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: '无法获取用户信息' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentMinutes = profile?.voice_minutes || 0;
    const minutesToAdd = authCode.minutes_amount || (authCode.code_type === '60min' ? 60 : 10);
    const newMinutes = currentMinutes + minutesToAdd;

    // 更新用户分钟数
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ voice_minutes: newMinutes })
      .eq('user_id', user.id);

    if (updateProfileError) {
      console.error('Update profile error:', updateProfileError);
      return new Response(
        JSON.stringify({ error: '充值失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 标记授权码为已使用
    const { error: updateCodeError } = await supabaseAdmin
      .from('auth_codes')
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', authCode.id);

    if (updateCodeError) {
      console.error('Update code error:', updateCodeError);
      // 回滚用户分钟数
      await supabaseAdmin
        .from('profiles')
        .update({ voice_minutes: currentMinutes })
        .eq('user_id', user.id);
      
      return new Response(
        JSON.stringify({ error: '充值失败，请重试' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        minutes_added: minutesToAdd,
        total_minutes: newMinutes,
        message: `成功充值 ${minutesToAdd} 分钟语音评测时间`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Redeem error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '兑换失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

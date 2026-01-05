-- =====================================================
-- 初始化管理员账号
-- =====================================================
-- 此脚本会将第一个注册的用户设置为管理员
-- 或者在部署后手动执行以下命令设置特定用户为管理员
-- =====================================================

-- 创建一个函数：将指定手机号的用户设置为管理员
CREATE OR REPLACE FUNCTION public.set_admin_by_phone(phone_number TEXT)
RETURNS VOID AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 查找用户
    SELECT user_id INTO target_user_id
    FROM public.profiles
    WHERE phone = phone_number;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '未找到手机号为 % 的用户', phone_number;
    END IF;

    -- 更新 profiles 表的角色
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = target_user_id;

    -- 添加到 user_roles 表
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '已将用户 % 设置为管理员', phone_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建一个函数：将第一个注册的用户设置为管理员（用于初始化）
CREATE OR REPLACE FUNCTION public.init_first_admin()
RETURNS VOID AS $$
DECLARE
    first_user_id UUID;
    first_phone TEXT;
BEGIN
    -- 检查是否已有管理员
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
        RAISE NOTICE '已存在管理员，跳过初始化';
        RETURN;
    END IF;

    -- 获取第一个注册的用户
    SELECT user_id, phone INTO first_user_id, first_phone
    FROM public.profiles
    ORDER BY created_at ASC
    LIMIT 1;

    IF first_user_id IS NULL THEN
        RAISE NOTICE '暂无用户，无法初始化管理员';
        RETURN;
    END IF;

    -- 设置为管理员
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = first_user_id;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (first_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE '已将第一个注册用户 (%) 设置为管理员', first_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授权执行权限
GRANT EXECUTE ON FUNCTION public.set_admin_by_phone(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.init_first_admin() TO service_role;

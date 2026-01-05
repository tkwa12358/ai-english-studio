-- =====================================================
-- 自动确认所有用户
-- =====================================================
-- 解决 "email not confirmed" 登录问题
-- 此迁移会自动确认所有未确认的用户
-- =====================================================

-- 确认所有现有用户
UPDATE auth.users
SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW()),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL OR confirmed_at IS NULL;

-- 创建触发器：新注册用户自动确认
CREATE OR REPLACE FUNCTION auth.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 自动设置确认时间
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
    NEW.confirmed_at := COALESCE(NEW.confirmed_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;

-- 创建触发器：在用户创建时自动确认
CREATE TRIGGER on_auth_user_created_auto_confirm
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.auto_confirm_user();

-- 输出确认信息
DO $$
DECLARE
    confirmed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO confirmed_count FROM auth.users WHERE email_confirmed_at IS NOT NULL;
    RAISE NOTICE '已确认 % 个用户账号', confirmed_count;
END $$;

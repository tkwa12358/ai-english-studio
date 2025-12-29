-- 修复 auth_codes 表的 code_type 约束
-- 添加专业评测授权码类型支持

-- 删除旧的约束
ALTER TABLE auth_codes DROP CONSTRAINT IF EXISTS auth_codes_code_type_check;

-- 添加新的约束，支持专业评测类型
ALTER TABLE auth_codes ADD CONSTRAINT auth_codes_code_type_check 
CHECK (code_type = ANY (ARRAY['registration', '10min', '60min', 'pro_10min', 'pro_30min', 'pro_60min']));

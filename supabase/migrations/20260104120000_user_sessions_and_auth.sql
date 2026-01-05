-- 用户会话表：追踪登录设备
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_info text,
  ip_address text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- 创建索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_active ON user_sessions(last_active_at);

-- RLS 策略
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 管理员可以查看所有会话
CREATE POLICY "Admins can view all sessions" ON user_sessions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 注册尝试记录表（后端防刷）
CREATE TABLE IF NOT EXISTS registration_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_registration_attempts_ip ON registration_attempts(ip_address, attempted_at);

-- 清理过期的注册尝试记录（每小时清理1小时前的记录）
CREATE OR REPLACE FUNCTION cleanup_old_registration_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM registration_attempts WHERE attempted_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查设备数量的函数
CREATE OR REPLACE FUNCTION check_device_limit(p_user_id uuid, p_device_id text, p_max_devices int DEFAULT 2)
RETURNS json AS $$
DECLARE
  v_session_count int;
  v_oldest_session_id uuid;
BEGIN
  -- 更新或插入当前设备会话
  INSERT INTO user_sessions (user_id, device_id, last_active_at)
  VALUES (p_user_id, p_device_id, now())
  ON CONFLICT (user_id, device_id)
  DO UPDATE SET last_active_at = now();

  -- 检查会话数量
  SELECT COUNT(*) INTO v_session_count
  FROM user_sessions
  WHERE user_id = p_user_id;

  -- 如果超过限制，删除最老的会话
  WHILE v_session_count > p_max_devices LOOP
    SELECT id INTO v_oldest_session_id
    FROM user_sessions
    WHERE user_id = p_user_id
    ORDER BY last_active_at ASC
    LIMIT 1;

    DELETE FROM user_sessions WHERE id = v_oldest_session_id;
    v_session_count := v_session_count - 1;
  END LOOP;

  RETURN json_build_object('allowed', true, 'session_count', v_session_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授权注册用户可以调用设备检查函数
GRANT EXECUTE ON FUNCTION check_device_limit(uuid, text, int) TO authenticated;

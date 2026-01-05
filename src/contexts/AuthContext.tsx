import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

// 生成设备ID
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (account: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (account: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  const checkAdminRole = async () => {
    const { data, error } = await supabase.rpc('is_admin');
    if (!error && data) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await checkAdminRole();
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        // 使用 setTimeout 避免死锁
        setTimeout(() => {
          checkAdminRole();
        }, 0);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setTimeout(() => {
          checkAdminRole();
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (account: string, password: string) => {
    // 支持手机号和邮箱登录
    const isEmail = account.includes('@');
    const email = isEmail ? account : `${account}@aienglish.club`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.user) {
      // 注册设备会话
      try {
        await supabase.rpc('check_device_limit', {
          p_user_id: data.user.id,
          p_device_id: getDeviceId(),
          p_max_devices: 2
        });
      } catch (e) {
        console.error('Device session error:', e);
      }
    }

    return { error: error as Error | null };
  };

  const signUp = async (account: string, password: string) => {
    // 注册不再需要授权码，30天后需要激活

    // 支持手机号和邮箱注册
    const isEmail = account.includes('@');
    const email = isEmail ? account : `${account}@aienglish.club`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { phone: isEmail ? null : account, email: isEmail ? account : null }
      }
    });

    if (!error && data.user) {
      // 注册设备会话
      try {
        await supabase.rpc('check_device_limit', {
          p_user_id: data.user.id,
          p_device_id: getDeviceId(),
          p_max_devices: 2
        });
      } catch (e) {
        console.error('Device session error:', e);
      }
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    // 清除用户相关的本地存储
    localStorage.removeItem('lastVideoId');
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email?: string, metadata?: any): Promise<Profile> => {
    const fallbackProfile: Profile = {
      id: userId,
      email: email || '',
      full_name: metadata?.full_name || email?.split('@')[0] || 'User',
      balance: 0,
      total_earned: 0,
      level: 'Beginner',
      created_at: new Date().toISOString()
    };

    const timeoutPromise = new Promise<{ data: any, error: any }>((resolve) => 
      setTimeout(() => resolve({ data: null, error: new Error('Request timeout') }), 3000)
    );

    try {
      // Query profile with race
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Auto-create
          const insertPromise = supabase
            .from('profiles')
            .upsert({ 
              id: userId, 
              email: email, 
              full_name: fallbackProfile.full_name,
              balance: 0,
              total_earned: 0,
              level: 'Beginner'
            })
            .select('*')
            .single();

          const { data: newData, error: createError } = await Promise.race([insertPromise, timeoutPromise]);

          if (!createError && newData) {
            return newData;
          }
        }
        return fallbackProfile;
      }
      
      return data || fallbackProfile;
    } catch (err) {
      console.error('[AuthContext] Profile fetch error:', err);
      return fallbackProfile; // graceful fallback
    }
  };

  useEffect(() => {
    let mounted = true;

    // Use a single initialization process
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('[AuthContext] getSession error:', error);
        }
        
        if (!mounted) return;
        
        if (currentSession?.user) {
  setSession(currentSession);
  setUser(currentSession.user);

  const p = await fetchProfile(
    currentSession.user.id,
    currentSession.user.email,
    currentSession.user.user_metadata
  );

  // Get current IP
  const ipRes = await fetch('https://api.ipify.org?format=json');
  const ipData = await ipRes.json();
  const currentIP = ipData.ip;

  let activity = 'Logged in';

  if (p?.last_ip && p.last_ip !== currentIP) {
    activity = `IP changed to ${currentIP}`;
  }

  // Update profile
  await supabase
    .from('profiles')
    .update({
      last_ip: currentIP,
      last_login: new Date(),
      recent_activity: activity,
    })
    .eq('id', currentSession.user.id);
  await supabase
  .from('login_history')
  .insert({
    user_id: currentSession.user.id,
    ip_address: currentIP,
    activity: activity,
  });
p.last_ip = currentIP;
  if (mounted) setProfile(p);
} else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('[AuthContext] init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;
      
      if (event === 'INITIAL_SESSION') {
         // handled by getSession already
         return; 
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (currentSession?.user) {
          try {
            // We load profile but do NOT set global loading to true to prevent global hangs
            // The dashboard/app will handle null profile gracefully while loading
            const p = await fetchProfile(currentSession.user.id, currentSession.user.email, currentSession.user.user_metadata);
            if (mounted) {
              setProfile(p);
            }
          } catch (err) {
            console.error('[AuthContext] onAuthStateChange error:', err);
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
         // Token refreshed, no need to cause a UI freeze
         // We can optionally refresh profile in background
         if (currentSession?.user) {
           fetchProfile(currentSession.user.id, currentSession.user.email, currentSession.user.user_metadata).then(p => {
             if (mounted) setProfile(p);
           });
         }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[AuthContext] signOut error:', e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id, user.email, user.user_metadata);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

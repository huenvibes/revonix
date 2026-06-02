import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { Hexagon, Mail, Lock, User, ShieldCheck, Zap, Star, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AuthProps {
  type: 'login' | 'register';
}

export const Auth = ({ type }: AuthProps) => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[Auth] Starting ${type} flow...`);
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (type === 'register') {
        console.log('[Auth] Attempting Supabase signUp...');
        const signUpPromise = supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });
        const timeoutPromise = new Promise<{data: any, error: any}>((resolve) => 
          setTimeout(() => resolve({data: null, error: new Error('Request timed out. Please try again.')}), 10000)
        );

        const { data, error: signUpError } = await Promise.race([signUpPromise, timeoutPromise]);

        if (signUpError) {
          setError(signUpError.message || 'Failed to sign up');
          return;
        }
        
        console.log('[Auth] signUp response received:', !!data?.user);

        if (data?.user && !data?.session) {
          console.log('[Auth] signUp requires email verification');
          setSuccess(true);
        }
      } else {
        // Login
        console.log('[Auth] Attempting Supabase signIn...');
        const loginPromise = supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        const timeoutPromise = new Promise<{data: any, error: any}>((resolve) => 
          setTimeout(() => resolve({data: null, error: new Error('Request timed out. Please try again.')}), 10000)
        );
        
        const { error: loginError } = await Promise.race([loginPromise, timeoutPromise]);

        if (loginError) {
          setError(loginError.message || 'Invalid login credentials');
          return;
        }
        console.log('[Auth] Login successful');
      }
    } catch (err: any) {
      console.error('[Auth] Unexpected error:', err);
      setError(err.message || 'An unexpected error occurred during authentication');
    } finally {
      console.log('[Auth] Flow complete, resetting loading state');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center gap-2 font-bold text-2xl text-[#0F172A] mb-4">
            <Hexagon className="w-10 h-10 text-[#2563EB] fill-[#2563EB]/10" />
            <span>Revonix</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            {type === 'login' ? 'Welcome back!' : 'Create your account'}
          </h1>
          <p className="text-[#64748B] mt-1">
            {type === 'login' ? "Elevate your earning potential today." : "Join thousands of members earning daily."}
          </p>
        </div>

        <Card className="p-8 shadow-xl border-[#E2E8F0]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Check your inbox</h3>
              <p className="text-[#64748B] text-sm mb-8 leading-relaxed">
                We've sent a verification link to <span className="font-bold text-[#0F172A]">{formData.email}</span>. Please verify your email to access your Revonix account.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
                Back to {type === 'login' ? 'Login' : 'Signup'}
              </Button>
            </div>
          ) : (
            <>
              <form className="space-y-5" onSubmit={handleAuth}>
            {type === 'register' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input 
                    type="text" 
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 transition-all text-sm"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input 
                  type="password" 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 transition-all text-sm"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 text-base font-bold shadow-lg shadow-[#2563EB]/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (type === 'login' ? 'Log In' : 'Create Account')}
            </Button>
          </form>
        </>
      )}
    </Card>

    <p className="text-center mt-8 text-sm text-[#64748B]">
          {type === 'login' ? (
            <>Don't have an account? <Link to="/register" className="font-bold text-[#2563EB] hover:underline decoration-2 underline-offset-4 transition-all">Create Account</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="font-bold text-[#2563EB] hover:underline decoration-2 underline-offset-4 transition-all">Sign In</Link></>
          )}
        </p>
      </motion.div>
    </div>
  );
};


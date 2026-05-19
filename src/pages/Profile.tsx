import React from 'react';
import { Card, Button } from '../components/ui';
import { 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck,
  TrendingUp,
  LogOut,
  Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SurveyBiodata } from '../components/profile/SurveyBiodata';

export const Profile = () => {
  const { profile, signOut } = useAuth();
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Member since 2024';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Account Profile</h1>
          <p className="text-[#64748B] text-sm font-medium">Manage your professional credentials and earnings.</p>
        </div>
        <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs uppercase tracking-widest" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Summary Card */}
        <Card className="md:col-span-1 p-8 text-center flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border border-[#E2E8F0] overflow-hidden bg-[#F8FAFC] mb-6 shadow-sm">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'user'}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-1">{profile?.full_name || 'Verified User'}</h2>
          <p className="text-sm text-[#64748B] font-medium mb-6">{profile?.email}</p>
          
          <div className="w-full pt-6 border-t border-[#F1F5F9] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Status</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#10B981] text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Earnings</span>
              <span className="text-sm font-bold text-[#0F172A]">${profile?.total_earned.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </Card>

        {/* Detailed Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-8">
            <h3 className="font-bold text-[#0F172A] mb-8 text-sm flex items-center gap-2 border-b border-[#F1F5F9] pb-4">
              <User className="w-4 h-4 text-[#2563EB]" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Full Name</p>
                <div className="flex items-center gap-2.5 font-semibold text-[#1E293B]">
                  <User className="w-4 h-4 text-[#CBD5E1]" />
                  <span>{profile?.full_name}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Email Identity</p>
                <div className="flex items-center gap-2.5 font-semibold text-[#1E293B]">
                  <Mail className="w-4 h-4 text-[#CBD5E1]" />
                  <span>{profile?.email}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Registration Date</p>
                <div className="flex items-center gap-2.5 font-semibold text-[#1E293B]">
                  <Calendar className="w-4 h-4 text-[#CBD5E1]" />
                  <span>{formatDate(profile?.created_at)}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Account Type</p>
                <div className="flex items-center gap-2.5 font-semibold text-[#1E293B]">
                  <ShieldCheck className="w-4 h-4 text-[#CBD5E1]" />
                  <span>Professional Member</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-6 bg-[#F8FAFC] border-[#E2E8F0]">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#E2E8F0]">
                  <Wallet className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Current Balance</p>
                  <p className="text-xl font-bold text-[#0F172A]">${profile?.balance.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-[#F8FAFC] border-[#E2E8F0]">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#E2E8F0]">
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Lifetime Total</p>
                  <p className="text-xl font-bold text-[#0F172A]">${profile?.total_earned.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <div className="pt-2">
        <SurveyBiodata />
      </div>
    </div>
  );
};

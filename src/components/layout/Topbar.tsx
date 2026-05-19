import React from 'react';
import { LogOut, Wallet, Menu } from 'lucide-react';
import { Button } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-[#64748B] hover:text-[#2563EB] transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={() => navigate('/transactions?tab=payouts')}
          className="flex items-center gap-2 bg-[#F0F9FF] border border-[#B9E6FE] px-2 md:px-3 py-1.5 rounded-full hover:bg-[#E0F2FE] transition-colors cursor-pointer"
        >
          <Wallet className="w-4 h-4 text-[#0284C7]" />
          <span className="text-xs md:text-sm font-semibold text-[#0369A1]">${profile?.balance.toFixed(2) || '0.00'}</span>
        </button>

        <div className="h-8 w-px bg-[#E2E8F0] mx-1 md:mx-2 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="text-right lg:block hidden">
            <p className="text-sm font-semibold text-[#0F172A]">{profile?.full_name || profile?.email || 'User'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 border border-[#E2E8F0] flex items-center justify-center overflow-hidden">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'user'}`} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <Button variant="ghost" size="sm" className="p-2" onClick={signOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

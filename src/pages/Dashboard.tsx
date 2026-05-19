import React from 'react';
import { Card } from '../components/ui';
import { 
  Star,
  ArrowRight,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const stats = [
    { label: 'Available Balance', value: profile ? `$${profile.balance.toFixed(2)}` : '$0.00', icon: Wallet, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]' },
    { label: 'Total Earnings', value: profile ? `$${profile.total_earned.toFixed(2)}` : '$0.00', icon: Star, color: 'text-[#F59E0B]', bg: 'bg-[#FFFBEB]' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Overview</h1>
          <p className="text-[#64748B] text-sm font-medium">Hello, {profile?.full_name?.split(' ')[0] || 'Member'}. Welcome back.</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="flex items-center gap-6 p-6">
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#64748B] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-[#0F172A]">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Offerwalls */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0F172A]">Popular Offerwalls</h2>
          <Link to="/offerwalls" className="text-sm font-semibold text-[#2563EB] hover:underline flex items-center gap-1">
            Browse All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Revtoo', tag: 'High Paying Surveys', color: 'text-blue-500', bg: 'bg-blue-50' },
            { name: 'AdGem', tag: 'Mobile Tasks & Games', color: 'text-orange-500', bg: 'bg-orange-50' },
            { name: 'CPX Research', tag: 'Market Research', color: 'text-green-500', bg: 'bg-green-50' },
            { name: 'Monlix', tag: 'Daily Quick Offers', color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map((wall, i) => (
            <Card 
              key={i} 
              className="group hover:border-[#2563EB] transition-all cursor-pointer p-4 flex items-center justify-between border-[#E2E8F0]"
              onClick={() => {
                if (wall.name === 'Revtoo') {
                  navigate('/offerwalls/revtoo');
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 ${wall.bg} rounded-lg flex items-center justify-center font-bold ${wall.color} text-xs shrink-0`}>
                  {wall.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-[#0F172A] text-sm truncate">{wall.name}</h4>
                  <p className="text-[10px] text-[#64748B] font-medium truncate">{wall.tag}</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors shrink-0 ml-2" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

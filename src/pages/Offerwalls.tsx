import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/ui';
import { 
  Zap, 
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Info
} from 'lucide-react';

const offerwalls = [
  { 
    id: 1, 
    name: 'Revtoo', 
    description: 'High-quality market research surveys with high payout rates.', 
    payout: 'Immediate',
    category: 'Surveys',
    rating: 4.8,
    color: 'text-blue-500',
    bg: 'bg-blue-50'
  },
  { 
    id: 2, 
    name: 'Spades', 
    description: 'Earn by playing mobile games', 
    payout: 'Up to 24H',
    category: 'Mobile Games',
    rating: 4.6,
    color: 'text-orange-500',
    bg: 'bg-orange-50'
  },
  { 
    id: 3, 
    name: 'Monlix', 
    description: 'Multi-category offerwall featuring ads, tasks, and daily offers.', 
    payout: 'Immediate',
    category: 'Mixed Tasks',
    rating: 4.7,
    color: 'text-purple-500',
    bg: 'bg-purple-50'
  },
  { 
    id: 4, 
    name: 'CPX Research', 
    description: 'Premium international surveys from global brands and retailers.', 
    payout: 'Immediate',
    category: 'Surveys',
    rating: 4.9,
    color: 'text-green-500',
    bg: 'bg-green-50'
  },
  { 
    id: 5, 
    name: 'Lootably', 
    description: 'Consistently provides high-paying video and app installation tasks.', 
    payout: '24 Hours',
    category: 'Videos & Tasks',
    rating: 4.5,
    color: 'text-red-500',
    bg: 'bg-red-50'
  },
  { 
    id: 6, 
    name: 'Timewall', 
    description: 'Quick micro-tasks including clicks, signups, and simple views.', 
    payout: 'Immediate',
    category: 'Micro Tasks',
    rating: 4.4,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50'
  }
];

export const Offerwalls = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Available Providers</h1>
          <p className="text-[#64748B] text-sm font-medium">Complete tasks from our verified partners to earn rewards.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#F1F5F9] px-4 py-2 rounded-lg text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
          Verified Secure Tracking
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {offerwalls.map((wall) => (
          <Card key={wall.id} className="flex flex-col h-full hover:border-[#2563EB] transition-all group border-[#E2E8F0] shadow-sm hover:shadow-md">
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${wall.bg} ${wall.color} rounded-2xl flex items-center justify-center font-bold text-xl`}>
                  {wall.name.substring(0, 1)}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="info" className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5">
                    {wall.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-[#F59E0B]">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">High Earnings</span>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">{wall.name}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed line-clamp-2 font-medium mb-4">
                {wall.description}
              </p>
            </div>

            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.1em]">{wall.payout} Payout</span>
              </div>
              <Button 
                size="sm" 
                className="h-9 px-4 text-xs font-bold shadow-sm"
                onClick={() => {
                  if (wall.name === 'Revtoo') {
                    navigate('/offerwalls/revtoo');
                  }
                }}
              >
                Open <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="bg-[#EFF6FF] border-[#BFDBFE] p-4 flex items-start gap-4">
        <span className="mt-0.5 shrink-0">
          <Info className="w-5 h-5 text-[#2563EB]" />
        </span>
        <p className="text-[11px] text-[#1D4ED8] leading-relaxed font-semibold">
          Most offerwalls confirm completions within minutes. Some specialized high-reward tasks may require manual advertiser verification, taking up to 48 hours. Ensure task tracking by disabling VPNs.
        </p>
      </Card>
    </div>
  );
};

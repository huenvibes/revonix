import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { 
  CircleDollarSign,
  Clock,
  Inbox,
  Bitcoin,
  CreditCard,
  Apple,
  Landmark,
  ArrowRight,
  AlertCircle,
  X,
  PlayCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isDemoMode } from '../lib/supabase';

const PAYOUT_METHODS = [
  { id: 'crypto', name: 'Crypto Withdraw', icon: Bitcoin, color: 'text-[#F7931A]', bg: 'bg-[#FFFBEB]' },
  { id: 'visa', name: 'Visa Gift Card', icon: CreditCard, color: 'text-[#1A1F71]', bg: 'bg-[#F0F5FF]' },
  { id: 'apple', name: 'Apple Gift Card', icon: Apple, color: 'text-[#000000]', bg: 'bg-[#F8FAFC]' },
  { id: 'ach', name: 'ACH Transfer', icon: Landmark, color: 'text-[#047857]', bg: 'bg-[#ECFDF5]' },
];

export const Transactions = () => {
  const { profile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'payouts' ? 'payouts' : 'history';

  const [rewards, setRewards] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  // Payout State
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [payoutError, setPayoutError] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [simulatingOffer, setSimulatingOffer] = useState(false);

  useEffect(() => {
    if (profile?.id && currentTab === 'history') {
      fetchRewards();
    }
  }, [profile?.id, currentTab]);

  const fetchRewards = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('reward_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code !== '42P01') {
          console.error('Error fetching rewards:', error);
        }
      } else if (data) {
        const formattedRewards = data.map((reward: any) => ({
          id: reward.id,
          provider: reward.provider || 'Revtoo',
          offerName: reward.offer_name || 'Offerwall Survey',
          status: reward.status || 'completed',
          date: new Date(reward.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: new Date(reward.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          amount: typeof reward.amount === 'number' ? reward.amount : (typeof reward.payout === 'number' ? reward.payout : 0)
        }));
        setRewards(formattedRewards);
        
        // Also update activities with the rewards
        if (profile.created_at) {
          const newActivities = [
            ...data.map((r: any) => ({
              id: `act_${r.id}`,
              type: `Completed ${r.provider} Task`,
              date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            })),
            {
              id: 'joined',
              type: 'Joined Revonix',
              date: new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              time: new Date(profile.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            }
          ];
          setActivities(newActivities);
        }
      }
    } catch (err) {
      console.error('Error fetching rewards exception:', err);
    }
  };

  useEffect(() => {
    if (profile?.id && currentTab === 'payouts') {
      fetchPayouts();
    }
  }, [profile?.id, currentTab]);

  const fetchPayouts = async () => {
    if (!profile?.id) return;
    setLoadingPayouts(true);
    try {
      // Simulate payout history fetch or try fetching from real table if it exists
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // Table missing
          console.warn('payout_requests table not found');
          setPayouts([]);
        } else {
          console.error('Error fetching payouts', error);
        }
      } else {
        setPayouts(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const hasPendingPayout = payouts.some(p => p.status === 'pending');

  const handleSimulateOffer = async () => {
    if (!profile) return;
    setSimulatingOffer(true);
    try {
      const providers = ['Revtoo', 'Spades', 'Monlix', 'CPX Research'];
      const offerNames = ['Survey: Shopping Habits', 'Play Game: Reach Level 5', 'Watch Video Ad', 'Install Mobile App'];
      
      const randomProvider = providers[Math.floor(Math.random() * providers.length)];
      const randomOffer = offerNames[Math.floor(Math.random() * offerNames.length)];
      const randomAmount = parseFloat((Math.random() * (5 - 0.5) + 0.5).toFixed(2));

      const newBalance = profile.balance + randomAmount;
      const newTotal = profile.total_earned + randomAmount;

      // Update balance
      await supabase.from('profiles').update({ 
        balance: newBalance,
        total_earned: newTotal
      }).eq('id', profile.id);

      // Add transaction
      await supabase.from('reward_transactions').insert({
        user_id: profile.id,
        trans_id: `mock_tx_${Date.now()}`,
        provider: randomProvider,
        offer_name: randomOffer,
        payout: randomAmount,
        status: 'completed'
      });

      await fetchRewards();
      await refreshProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingOffer(false);
    }
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError('');
    
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum < 5) {
      setPayoutError('Minimum withdrawal amount is $5.00');
      return;
    }
    
    if (!profile) {
      setPayoutError('Profile not found');
      return;
    }

    if (amountNum > profile.balance) {
      setPayoutError('Insufficient balance');
      return;
    }

    if (hasPendingPayout) {
      setPayoutError('You already have a pending payout request.');
      return;
    }

    setSubmittingPayout(true);
    try {
      const newBalance = profile.balance - amountNum;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', profile.id);

      if (profileError) {
        throw new Error('Failed to deduct balance.');
      }

      const { error: requestError } = await supabase.from('payout_requests').insert({
        user_id: profile.id,
        method: selectedMethod.id,
        amount: amountNum,
        status: 'pending'
      });

      if (requestError) {
        // Rollback attempt if request fails
        await supabase.from('profiles').update({ balance: profile.balance }).eq('id', profile.id);
        throw requestError;
      }

      setSelectedMethod(null);
      setWithdrawAmount('');
      fetchPayouts(); // Refresh payouts
      await refreshProfile(); // Refresh balance UI instantly
    } catch (err: any) {
      setPayoutError(err.message || 'An error occurred processing the request');
    } finally {
      setSubmittingPayout(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Transactions & Payouts</h1>
          <p className="text-[#64748B] text-sm font-medium">Review your earnings, activity, and cash out.</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl w-max">
          <button
            onClick={() => setSearchParams({ tab: 'history' })}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              currentTab === 'history' 
                ? 'bg-white text-[#0F172A] shadow-sm' 
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'payouts' })}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              currentTab === 'payouts' 
                ? 'bg-white text-[#0F172A] shadow-sm' 
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Payouts
          </button>
        </div>
      </div>

      {currentTab === 'history' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rewards Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A]">Rewards</h2>
              {isDemoMode && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-3 text-xs font-bold border-[#2563EB] text-[#2563EB] hover:bg-[#EFF6FF] gap-1"
                  onClick={handleSimulateOffer}
                  disabled={simulatingOffer}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  {simulatingOffer ? 'Simulating...' : 'Simulate Earning'}
                </Button>
              )}
            </div>
            <Card className="p-0 border-[#E2E8F0] overflow-hidden shadow-sm">
              {rewards.length > 0 ? (
                <div className="divide-y divide-[#E2E8F0]">
                  {rewards.map((reward: any) => (
                    <div key={reward.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center shrink-0">
                          <CircleDollarSign className="w-5 h-5 text-[#10B981]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0F172A]">
                            {reward.provider} <span className="text-[#64748B] font-medium ml-1">· {reward.offerName}</span>
                          </p>
                          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{reward.date} • {reward.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#10B981]">+{reward.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${
                            reward.status === 'completed' ? 'text-[#10B981]' : (reward.status === 'pending' ? 'text-[#F59E0B]' : 'text-[#EF4444]')
                          }`}>
                            {reward.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4">
                    <Inbox className="w-6 h-6 text-[#CBD5E1]" />
                  </div>
                  <p className="text-sm font-bold text-[#0F172A]">No rewards yet</p>
                  <p className="text-xs text-[#64748B] mt-1 font-medium">Complete offers to start earning.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Activities Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Activities</h2>
            <Card className="p-0 border-[#E2E8F0] overflow-hidden shadow-sm">
              {activities.length > 0 ? (
                <div className="divide-y divide-[#E2E8F0]">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-[#F8FAFC] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-[#64748B]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">{activity.type}</p>
                        <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{activity.date} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4">
                    <Inbox className="w-6 h-6 text-[#CBD5E1]" />
                  </div>
                  <p className="text-sm font-bold text-[#0F172A]">No activities found</p>
                  <p className="text-xs text-[#64748B] mt-1 font-medium">Your account history will appear here.</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {currentTab === 'payouts' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-[#0F172A]">Select Payout Method</h2>
              
              {hasPendingPayout && (
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex gap-3 text-[#B45309]">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold">Pending Withdrawal</h3>
                    <p className="text-sm">You already have a pending payout request. Please wait for it to be processed before requesting another.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYOUT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      disabled={hasPendingPayout}
                      onClick={() => setSelectedMethod(method)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        hasPendingPayout 
                          ? 'opacity-50 cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC]'
                          : 'bg-white hover:border-[#2563EB] hover:shadow-md border-[#E2E8F0] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${method.bg}`}>
                          <Icon className={`w-6 h-6 ${method.color}`} />
                        </div>
                        <div>
                          <p className="font-bold text-[#0F172A]">{method.name}</p>
                          <p className="text-xs text-[#64748B] font-medium min-w-0">Min. $5.00</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-bold text-[#0F172A]">Payout History</h2>
              <Card className="p-0 border-[#E2E8F0] overflow-hidden shadow-sm">
                 {loadingPayouts ? (
                   <div className="p-8 text-center text-sm font-medium text-[#64748B]">Loading history...</div>
                 ) : payouts.length > 0 ? (
                  <div className="divide-y divide-[#E2E8F0]">
                    {payouts.map((p) => (
                      <div key={p.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#0F172A] capitalize">
                            {PAYOUT_METHODS.find(m => m.id === p.method)?.name || p.method}
                          </p>
                          <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">
                            {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#0F172A]">${p.amount.toFixed(2)}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${
                            p.status === 'completed' || p.status === 'approved' ? 'text-[#10B981]' : (p.status === 'pending' || p.status === 'processing' || p.status === 'hold' ? 'text-[#F59E0B]' : 'text-[#EF4444]')
                          }`}>
                            {p.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                 ) : (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4">
                      <Inbox className="w-6 h-6 text-[#CBD5E1]" />
                    </div>
                    <p className="text-sm font-bold text-[#0F172A]">No history yet</p>
                  </div>
                 )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {selectedMethod && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 shadow-2xl relative">
            <button 
              onClick={() => setSelectedMethod(null)}
              className="absolute top-4 right-4 p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMethod.bg}`}>
                <selectedMethod.icon className={`w-6 h-6 ${selectedMethod.color}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#0F172A]">{selectedMethod.name} Withdrawal</h3>
                <p className="text-sm text-[#64748B] font-medium">Available Balance: ${profile?.balance.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            <form onSubmit={handleWithdrawRequest} className="space-y-4">
              {payoutError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
                  {payoutError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1">
                  Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[#64748B] font-medium">$</span>
                  </div>
                  <input 
                    type="number"
                    step="0.01"
                    min="5"
                    className="w-full flex h-10 rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50 pl-8 !text-lg"
                    placeholder="5.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-[#94A3B8] font-medium mt-2 flex justify-between">
                  <span>Minimum $5.00</span>
                  <button type="button" onClick={() => setWithdrawAmount(String(profile?.balance || 0))} className="text-[#2563EB] hover:underline">Max</button>
                </p>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0]">
                <Button 
                  type="submit"
                  className="w-full font-bold text-base h-12"
                  disabled={submittingPayout}
                >
                  {submittingPayout ? 'Processing...' : 'Request Payout'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

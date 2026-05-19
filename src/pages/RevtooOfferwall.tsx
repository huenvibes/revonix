import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const RevtooOfferwall = () => {
  const navigate = useNavigate();
  
  const { user, profile } = useAuth();

  // User অথবা Profile ডাটা না থাকা অবস্থায় Iframe লোড হবে না
  if (!user || !profile) {
    return null; 
  }

  // এখানে Numeric user_code ব্যবহার করা হয়েছে
  const iframeUrl = `https://revtoo.com/offerwall/tqn4bgj90i24acqrj36n39bp3l40g2/${profile.user_code}`;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -mx-6 -mt-6">
      {/* Top Header */}
      <div className="bg-white px-6 py-4 border-b border-[#E2E8F0] flex items-center shrink-0">
        <button 
          onClick={() => navigate('/offerwalls')}
          className="flex items-center gap-2 text-sm font-bold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Offerwalls
        </button>
      </div>
      
      {/* Offerwall Iframe */}
      <div className="flex-1 w-full bg-[#F8FAFC]">
        <iframe
          title="Revtoo Offerwall"
          src={iframeUrl}
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
};

// Vercel Import Error দূর করার জন্য Default Export-ও দিয়ে দিলাম
export default RevtooOfferwall;

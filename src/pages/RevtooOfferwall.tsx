import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const RevtooOfferwall = () => {
  const navigate = useNavigate();
  
  // ১. useAuth থেকে user এর পাশাপাশি profile ডেটাও কল করুন
  const { user, profile } = useAuth();

  // ২. user অথবা profile লোড না হলে null রিটার্ন করবে
  if (!user || !profile) {
    return null; // Will be handled by ProtectedRoute
  }

  // ৩. এখন profile.user_code কোনো এরর ছাড়াই কাজ করবে
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

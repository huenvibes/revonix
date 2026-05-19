import React, { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { 
  Hexagon, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  Users, 
  Zap, 
  Smartphone,
  ShieldCheck,
  Bitcoin,
  CreditCard,
  Apple,
  Banknote,
  BarChart3,
  HelpCircle,
  Plus,
  Minus,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';

export const Landing = () => {
  const { session, loading } = useAuth();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-[#F1F5F9] sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2 font-bold text-xl text-[#0F172A] cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Hexagon className="w-8 h-8 text-[#2563EB] fill-[#2563EB]/10" />
          <span>Revonix</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-[#64748B] hover:text-[#2563EB] transition-colors">Features</button>
          <button onClick={() => scrollToSection('rewards')} className="text-sm font-medium text-[#64748B] hover:text-[#2563EB] transition-colors">Rewards</button>
          <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-[#64748B] hover:text-[#2563EB] transition-colors">FAQ</button>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="bg-[#EFF6FF] text-[#2563EB] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-6"
        >
          Premium Rewards Platform
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-[#0F172A] tracking-tight mb-8 max-w-4xl"
        >
          Turn your spare time into <span className="text-[#2563EB]">real rewards.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-[#64748B] max-w-2xl mb-10"
        >
          Join 500,000+ members earning daily with high-paying surveys, offerwalls, and tasks. Simple, fast, and secure.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg">
              Start Earning Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto h-14 px-8 text-lg"
            onClick={() => scrollToSection('rewards')}
          >
            View Rewards
          </Button>
        </motion.div>
      </header>

      {/* 2. Features Grid */}
      <section id="features" className="bg-[#F8FAFC] py-32 border-y border-[#F1F5F9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">Why choose Revonix?</h2>
            <p className="text-[#64748B]">We offer the best payout rates and the most reliable experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Instant Payouts", desc: "Withdraw your earnings instantly via PayPal, Crypto, or Gift Cards." },
              { icon: Star, title: "High Rates", desc: "We partner with top providers to give you the highest reward rates." },
              { icon: Users, title: "Referral Bonus", desc: "Invite friends and earn 15% of their lifetime earnings forever." },
              { icon: ShieldCheck, title: "Secure Payouts", desc: "Multiple layers of encryption to keep your data and earnings safe." },
              { icon: Smartphone, title: "Mobile Optimized", desc: "Earn on the go with our fully responsive mobile interface." },
              { icon: CheckCircle2, title: "Daily Bonuses", desc: "Log in every day to claim your streak rewards and level up." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm"
              >
                <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-[#2563EB]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-3">{feature.title}</h3>
                <p className="text-[#64748B] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Rewards & Payouts */}
      <section id="rewards" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">Payout Methods</h2>
            <p className="text-[#64748B]">Flexible options to get your earnings how you want them.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bitcoin, name: "Crypto Withdraw", min: "$5.00", processing: "Instant payouts", color: "text-orange-500", bg: "bg-orange-50" },
              { icon: CreditCard, name: "Visa Gift Cards", min: "$5.00", processing: "Instant payouts", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: Apple, name: "Apple Gift Cards", min: "$5.00", processing: "Instant payouts", color: "text-gray-900", bg: "bg-gray-50" },
              { icon: Banknote, name: "ACH Transfer", min: "$10.00", processing: "1-2 business days", color: "text-green-500", bg: "bg-green-50" },
            ].map((payout, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col items-center text-center"
              >
                <div className={`w-14 h-14 ${payout.bg} rounded-2xl flex items-center justify-center mb-6`}>
                  <payout.icon className={`w-7 h-7 ${payout.color}`} />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-1">{payout.name}</h3>
                <p className="text-[#2563EB] font-bold text-sm mb-4">Starting from {payout.min}</p>
                <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">{payout.processing}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Offerwalls */}
      <section className="bg-[#F8FAFC] py-32 border-y border-[#F1F5F9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-6 tracking-tight">Access the world's best <span className="text-[#2563EB]">Offerwalls.</span></h2>
              <p className="text-[#64748B] text-lg mb-8 leading-relaxed">
                We've partnered with industry leaders like Revtoo, AdGem, and CPX Research to ensure you always have high-paying tasks available.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Exclusive high-paying surveys",
                  "Mobile game tasks with milestone rewards",
                  "Instant tracking and verification",
                  "New offers added every 15 minutes"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#0F172A] font-medium">
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button size="lg">Explore Offerwalls</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Revtoo', tag: 'Surveys' },
                { name: 'AdGem', tag: 'Tasks' },
                { name: 'Monlix', tag: 'Ads' },
                { name: 'Offertoro', tag: 'Apps' },
              ].map((wall, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm group hover:border-[#2563EB] transition-colors">
                  <div className="w-10 h-10 bg-[#F1F5F9] rounded-lg mb-4 group-hover:bg-[#EFF6FF] transition-colors"></div>
                  <h4 className="font-bold text-[#0F172A]">{wall.name}</h4>
                  <p className="text-xs text-[#64748B]">{wall.tag}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Stats Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-[#0F172A] rounded-[2.5rem] p-12 md:p-20 text-white flex flex-col md:flex-row justify-between items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#2563EB] opacity-10 blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="z-10 group">
              <div className="flex items-center gap-4 mb-4">
                <BarChart3 className="w-8 h-8 text-[#2563EB]" />
                <h2 className="text-3xl font-bold">Revonix in numbers</h2>
              </div>
              <p className="text-[#94A3B8] max-w-sm">Built for scale, trusted by users everywhere. Our performance speaks for itself.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 md:gap-20 z-10">
              <div className="text-center md:text-left">
                <p className="text-4xl md:text-5xl font-bold mb-2">$2.4M+</p>
                <p className="text-[#64748B] font-medium uppercase tracking-widest text-xs">Total Paid Out</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-4xl md:text-5xl font-bold mb-2">520k+</p>
                <p className="text-[#64748B] font-medium uppercase tracking-widest text-xs">Active Users</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-4xl md:text-5xl font-bold mb-2">15M+</p>
                <p className="text-[#64748B] font-medium uppercase tracking-widest text-xs">Offers Done</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-4xl md:text-5xl font-bold mb-2">4.9/5</p>
                <p className="text-[#64748B] font-medium uppercase tracking-widest text-xs">User Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-32 bg-[#F8FAFC]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">Common Questions</h2>
            <p className="text-[#64748B]">Everything you need to know about getting started.</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "Is Revonix free to join?", a: "Yes, Revonix is 100% free. We will never ask you for membership fees or payments." },
              { q: "How long does it take to get paid?", a: "Most payouts are processed instantly. For certain methods like ACH, it can take 1-2 business days." },
              { q: "What is the minimum withdrawal?", a: "You can withdraw your earnings starting from just $5.00." },
              { q: "Can I use a VPN?", a: "No, using a VPN, Proxy, or Virtual Machine is strictly prohibited to ensure high-quality data for our partners." },
            ].map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                <button className="w-full p-6 text-left flex items-center justify-between group">
                  <span className="font-bold text-[#0F172A]">{faq.q}</span>
                  <ChevronDown className="w-5 h-5 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" />
                </button>
                <div className="px-6 pb-6 text-[#64748B] text-sm leading-relaxed border-t border-transparent">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-[#EFF6FF] rounded-2xl p-8 flex items-center justify-between border border-[#DBEAFE]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center text-white">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-[#0F172A]">Still have questions?</p>
                <p className="text-sm text-[#64748B]">Our support team is here to help 24/7.</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Contact Support</Button>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-[#0F172A] py-24 text-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div>
            <div className="flex items-center gap-2 font-bold text-2xl mb-4">
              <Hexagon className="w-8 h-8 text-[#2563EB] fill-[#2563EB]" />
              <span>Revonix</span>
            </div>
            <p className="text-[#94A3B8] max-w-sm">
              The premium destination for online rewards and surveys. Built for the modern earner.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <h4 className="text-xl font-bold mb-6 text-center md:text-right">Ready to start earning?</h4>
            <div className="flex gap-4">
              <Link to="/register">
                <Button size="lg" className="shadow-xl shadow-blue-500/10">Create Account</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/10 text-[#64748B] text-sm flex justify-between">
          <p>© {new Date().getFullYear()} Revonix. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};


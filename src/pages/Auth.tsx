import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { motion } from 'motion/react';
import { ... } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col transition-all duration-300 lg:pl-64">
        {isDemoMode && (
          <div className="bg-[#EFF6FF] border-b border-[#DBEAFE] px-4 py-2 flex items-center justify-between text-xs text-[#1D4ED8] font-semibold shrink-0">
            <span className="flex items-center gap-2">
              <span className="inline-flex w-2 h-2 rounded-full bg-[#2563EB] animate-pulse shrink-0" />
              <span>
                Sandbox Mode Active: Playing games and surveys simulated locally. Add your real Supabase keys in Secrets to connect.
              </span>
            </span>
          </div>
        )}
        <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers, 
  ClipboardList, 
  History, 
  ArrowLeftRight, 
  Wallet, 
  User, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLocation } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Layers, label: 'Offerwalls', path: '/offerwalls' },
  { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Close sidebar on mobile when navigating
  React.useEffect(() => {
    onClose();
  }, [location.pathname]);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-[#E2E8F0] transition-all duration-300 z-50 flex flex-col",
        collapsed ? "w-20" : "w-64",
        "transform lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 font-bold text-xl text-[#0F172A] cursor-pointer" onClick={() => window.location.href = '/'}>
            <Hexagon className="w-8 h-8 text-[#2563EB] fill-[#2563EB]/10" />
            <span>Revonix</span>
          </div>
        )}
        {collapsed && (
          <Hexagon className="w-8 h-8 text-[#2563EB] fill-[#2563EB]/10 mx-auto" />
        )}
        
        {/* Toggle button for desktop */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="lg:flex hidden absolute -right-3 top-10 bg-white border border-[#E2E8F0] rounded-full p-1 text-[#64748B] hover:text-[#2563EB] shadow-sm z-10"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Close button for mobile */}
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-[#64748B] hover:text-[#2563EB]"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
              isActive 
                ? "bg-[#2563EB]/5 text-[#2563EB] font-medium" 
                : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              collapsed ? "mx-auto" : ""
            )} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-[#E2E8F0]">
        {!collapsed ? (
          <p className="text-[10px] text-center font-bold text-[#94A3B8] uppercase tracking-widest">© 2024 Revonix</p>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-[#E2E8F0] mx-auto" />
        )}
      </div>
    </aside>
  );
};

import React from 'react';
import { Home, Users, MessageCircle, User as UserIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/group', icon: Users, label: '그룹' },
    { path: '/community', icon: MessageCircle, label: '커뮤니티' },
    { path: '/profile', icon: UserIcon, label: '내 정보' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 py-3 px-6 flex justify-between items-center z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] max-w-md mx-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center space-y-1.5 transition-colors duration-200 w-16 ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'scale-110 transition-transform' : ''} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
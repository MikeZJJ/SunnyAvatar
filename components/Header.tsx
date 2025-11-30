
import React, { useState, useRef, useEffect } from 'react';
import { Sun, LogOut, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
      setIsMenuOpen(false);
      logout();
  }

  return (
    <header className="px-5 py-3 bg-white sticky top-0 z-30 shadow-sm border-b border-slate-50">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Branding */}
        <div className="flex items-center gap-2 shrink-0">
            <div className="bg-sun-50 p-1.5 rounded-full">
                <Sun className="text-sun-500 animate-spin-slow" size={20} style={{ animationDuration: '10s' }} />
            </div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 leading-none">
            Sunny<span className="text-sun-500">Avatar</span>
            </h1>
        </div>
        
        {/* Right: User Menu */}
        {user && (
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border transition-all active:scale-95 ${isMenuOpen ? 'bg-sun-50 border-sun-200 ring-2 ring-sun-100' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                    <img 
                        src={user.picture} 
                        alt={user.name} 
                        className="w-7 h-7 rounded-full border border-slate-100 shrink-0 bg-slate-200 object-cover" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Fallback' }}
                    />
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[80px] sm:max-w-[120px] hidden xs:block">{user.name}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-slide-up flex flex-col gap-1 z-50">
                        
                        {/* Language Switcher Section */}
                        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Language / 语言
                        </div>
                        <button 
                            onClick={() => { setLanguage('en'); setIsMenuOpen(false); }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors ${language === 'en' ? 'bg-sun-50 text-sun-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span>English</span>
                            {language === 'en' && <Check size={16} />}
                        </button>
                        <button 
                            onClick={() => { setLanguage('zh'); setIsMenuOpen(false); }}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-colors ${language === 'zh' ? 'bg-sun-50 text-sun-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span>中文</span>
                            {language === 'zh' && <Check size={16} />}
                        </button>

                        <div className="h-px bg-slate-100 my-1" />

                        {/* Logout */}
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                        >
                            <LogOut size={16} />
                            <span>{t('logout')}</span>
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </header>
  );
};

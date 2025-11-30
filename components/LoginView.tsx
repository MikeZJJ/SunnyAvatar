
import React, { useEffect, useRef } from 'react';
import { Sun, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export const LoginView: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { loginAsGuest } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((window as any).google && googleBtnRef.current) {
        try {
            (window as any).google.accounts.id.renderButton(
                googleBtnRef.current,
                { theme: 'outline', size: 'large', width: 280, shape: 'pill' }
            );
        } catch (e) {
            console.error("Error rendering Google button", e);
        }
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-sun-50 animate-fade-in relative">
        {/* Language Switcher */}
        <button 
          onClick={toggleLanguage}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-600 hover:bg-white hover:text-sun-600 transition-all shadow-sm border border-white/50"
        >
          <Globe size={18} />
          <span className="text-sm font-bold">{language === 'en' ? 'EN' : '中文'}</span>
        </button>

        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm flex flex-col items-center gap-6 border border-sun-100">
            <div className="bg-sun-100 p-6 rounded-full animate-bounce-slow">
                <Sun size={64} className="text-sun-500 animate-spin-slow" style={{ animationDuration: '10s' }} />
            </div>
            
            <div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{t('login_title')}</h2>
                <p className="text-slate-500">{t('login_subtitle')}</p>
            </div>

            <div className="w-full flex flex-col gap-4 items-center">
                {/* Google Button Container */}
                <div className="h-[40px] w-[280px] flex justify-center" ref={googleBtnRef}></div>
                
                <div className="relative w-full py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-400">Or</span>
                    </div>
                </div>

                <button 
                    onClick={loginAsGuest}
                    className="w-[280px] py-2.5 px-4 rounded-full border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-sun-300 transition-colors"
                >
                    {t('btn_login_guest')}
                </button>
            </div>
        </div>
    </div>
  );
};

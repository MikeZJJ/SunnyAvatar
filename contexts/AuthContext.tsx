
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loginAsGuest: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT payload (without external libs for simplicity in this demo)
const decodeJwt = (token: string): any => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT", e);
        return null;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from session storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('sunny_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Initialize Google Sign-In
  useEffect(() => {
    if ((window as any).google && !user) {
        // ============================================================
        // 🔴在此处填入你刚才复制的 Client ID (替换引号内的内容)🔴
        // ============================================================
        const HARDCODED_CLIENT_ID = '569539063926-27tgeamiqrgk7d4tlnqujuv9p8a6hrh8.apps.googleusercontent.com';
        
        // 优先使用环境变量，如果环境变量没设置（比如在本地），则使用上面填写的 ID
        const clientId = process.env.GOOGLE_CLIENT_ID || HARDCODED_CLIENT_ID;
        
        console.log("[Auth] Initializing Google Sign-In with Client ID:", clientId);
        
        // 检查是否还在使用默认的占位符
        if (clientId === 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER') {
             console.warn("⚠️ Google Client ID 尚未配置！请在 contexts/AuthContext.tsx 中填入。");
        }

        try {
            (window as any).google.accounts.id.initialize({
                client_id: clientId,
                callback: (response: any) => {
                    const payload = decodeJwt(response.credential);
                    if (payload) {
                        console.log("[Auth] Login successful for:", payload.email);
                        const newUser: User = {
                            id: payload.sub,
                            name: payload.name,
                            email: payload.email,
                            picture: payload.picture
                        };
                        handleLogin(newUser);
                    }
                }
            });
            // We render the button in the LoginView component, not here globally
        } catch (e) {
            console.warn("Google Sign-In initialization failed (likely missing valid Client ID)", e);
        }
    }
  }, [user]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('sunny_user', JSON.stringify(newUser));
  };

  const loginAsGuest = () => {
    const guestUser: User = {
      id: 'guest-' + Date.now(),
      name: 'Sunny Guest',
      email: 'guest@example.com',
      picture: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Guest&backgroundColor=fcd34d'
    };
    handleLogin(guestUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sunny_user');
    if ((window as any).google) {
        try {
            (window as any).google.accounts.id.disableAutoSelect();
        } catch(e) {
            console.warn("Could not disable auto select", e);
        }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginAsGuest, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

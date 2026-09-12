import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getAuthToken, setAuthToken, type AuthUser } from '../api/client';

const USER_KEY = 'dyp_web_user';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: 'farmer' | 'roaster' | 'tourist') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const token = getAuthToken();
      const storedUser = localStorage.getItem(USER_KEY);
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // corrupt/blocked storage — just start logged out
    } finally {
      setIsLoading(false);
    }
  }, []);

  function persist(response: { accessToken: string; user: AuthUser }) {
    setAuthToken(response.accessToken);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch {
      // ignore
    }
    setUser(response.user);
  }

  async function login(email: string, password: string) {
    const response = await api.auth.login(email, password);
    persist(response);
  }

  async function signup(
    email: string,
    password: string,
    name: string,
    role?: 'farmer' | 'roaster' | 'tourist',
  ) {
    const response = await api.auth.signup({ email, password, name, role });
    persist(response);
  }

  function logout() {
    setAuthToken(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

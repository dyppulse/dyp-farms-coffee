import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, clearLegacySession, setUnauthorizedHandler, type AuthUser } from '../api/client';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  /** True when the session was dropped because the API rejected it. */
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role?: 'farmer' | 'roaster' | 'tourist') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // The session is an httpOnly cookie, so ask the API who we are instead of reading storage.
  useEffect(() => {
    let alive = true;
    clearLegacySession();
    api.auth
      .me()
      .then((r) => alive && setUser(r.user))
      .catch(() => {
        // 401 (not signed in) or the API is unreachable: start signed out.
      })
      .finally(() => alive && setIsLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const response = await api.auth.login(email, password);
    setSessionExpired(false);
    setUser(response.user);
  }

  async function signup(
    email: string,
    password: string,
    name: string,
    role?: 'farmer' | 'roaster' | 'tourist',
  ) {
    const response = await api.auth.signup({ email, password, name, role });
    setSessionExpired(false);
    setUser(response.user);
  }

  function logout() {
    setUser(null);
    // Ask the API to clear the cookie; the UI is already signed out either way.
    api.auth.logout().catch(() => {});
  }

  // The API said our session is no longer valid (expired, or the user vanished). Drop it;
  // <Protected> then redirects to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setSessionExpired(true);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionExpired, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

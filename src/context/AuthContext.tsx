import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { AuthService } from "@/services/auth-service";
import type { Usuario } from "@/types";

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  markPasswordUpdated: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const currentUser = await AuthService.getCurrentUser();
          if (currentUser && mounted) {
            setUsuario(currentUser);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state change:", event);

      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            try {
              const currentUser = await AuthService.getCurrentUser();
              if (currentUser && mounted) {
                setUsuario(currentUser);
              }
            } catch (error) {
              console.error("Error getting user after sign in:", error);
              if (mounted) {
                setUsuario(null);
              }
            }
          }
          break;

        case "SIGNED_OUT":
          if (mounted) {
            setUsuario(null);
            setIsLoggingOut(false);
          }
          break;

        case "TOKEN_REFRESHED":
          if (session?.user && mounted) {
            try {
              const currentUser = await AuthService.getCurrentUser();
              if (currentUser && mounted) {
                setUsuario(currentUser);
              }
            } catch (error) {
              console.error("Error refreshing user:", error);
            }
          }
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<Usuario> => {
    const user = await AuthService.signIn(email, password);
    setUsuario(user);
    return user;
  };

  const logout = async (): Promise<void> => {
    setIsLoggingOut(true);

    try {
      // Set user to null immediately for instant UI feedback
      setUsuario(null);

      // Do the actual logout in the background
      await AuthService.signOut();
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if logout fails, keep user logged out in UI
    } finally {
      setIsLoggingOut(false);
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    await AuthService.updatePassword(newPassword);
    if (usuario) {
      setUsuario({ ...usuario, firstLogin: false });
    }
  };

  const markPasswordUpdated = (): void => {
    if (usuario) {
      setUsuario({ ...usuario, firstLogin: false });
    }
  };

  const value: AuthContextType = {
    usuario,
    isLoading,
    isLoggingOut,
    isAuthenticated: !!usuario,
    login,
    logout,
    updatePassword,
    markPasswordUpdated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

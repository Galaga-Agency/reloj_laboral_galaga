import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { AuthService } from "@/services/auth-service";
import { useMonthlyReports } from "@/hooks/useMonthlyReports";
import { MonthlyReportModal } from "@/components/modals/MonthlyReportModal";
import type { Usuario } from "@/types";

interface GDPRConsentData {
  dataProcessingConsent: boolean;
  emailNotificationsConsent: boolean;
  geolocationConsent: boolean;
  privacyPolicyAcceptedAt: string;
  consentVersion: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  markPasswordUpdated: () => void;
  updateUserGDPRConsent: (
    userId: string,
    consentData: GDPRConsentData
  ) => Promise<void>;
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

  const {
    reportStatus,
    showModal: showMonthlyModal,
    handleAcceptReport,
    handleCloseModal,
  } = useMonthlyReports(usuario);

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
        } else {
          console.log("No session, skipping user fetch");
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
      if (!mounted) {
        return;
      }

      switch (event) {
        case "SIGNED_OUT":
          if (mounted) {
            setUsuario(null);
            setIsLoggingOut(false);
            setIsLoading(false);
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
              console.error("TOKEN_REFRESHED error:", error);
            }
          }
          break;

        default:
          console.log("Ignoring auth event:", event);
      }
    });

    return () => {
      console.log("AuthProvider cleanup");
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<Usuario> => {
    const user = await AuthService.signIn(email, password);
    setUsuario(user);
    setIsLoading(false);
    return user;
  };

  const logout = async (): Promise<void> => {
    setIsLoggingOut(true);

    try {
      setUsuario(null);
      await AuthService.signOut();
    } catch (error) {
      console.error("logout() error:", error);
    } finally {
      setIsLoggingOut(false);
      setIsLoading(false);
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

  const updateUserGDPRConsent = async (
    userId: string,
    consentData: GDPRConsentData
  ): Promise<void> => {
    const { error } = await supabase
      .from("usuarios")
      .update({
        gdpr_consent_given: consentData.dataProcessingConsent,
        gdpr_consent_date: consentData.privacyPolicyAcceptedAt,
        email_notifications_consent: consentData.emailNotificationsConsent,
        geolocation_consent: consentData.geolocationConsent,
        consent_version: consentData.consentVersion,
      })
      .eq("id", userId);

    if (error) {
      throw new Error(`Error updating GDPR consent: ${error.message}`);
    }

    if (usuario && usuario.id === userId) {
      setUsuario({
        ...usuario,
        gdprConsentGiven: consentData.dataProcessingConsent,
        gdprConsentDate: consentData.privacyPolicyAcceptedAt,
        emailNotificationsConsent: consentData.emailNotificationsConsent,
        geolocationConsent: consentData.geolocationConsent,
        consentVersion: consentData.consentVersion,
      });
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
    updateUserGDPRConsent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {showMonthlyModal && reportStatus?.report && usuario && (
        <MonthlyReportModal
          report={reportStatus.report}
          onAccept={handleAcceptReport}
          onClose={handleCloseModal}
        />
      )}
    </AuthContext.Provider>
  );
}
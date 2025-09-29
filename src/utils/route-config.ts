import type { Usuario } from "@/types";

export interface RouteConfig {
  path: string;
  isPublic?: boolean;
  requiresAuth?: boolean;
  requiresNoAuth?: boolean;
  requiresPasswordUpdate?: boolean;
  requiresGDPRConsent?: boolean;
  redirectConditions?: {
    authenticated?: string;
    unauthenticated?: string;
    needsPasswordUpdate?: string;
    needsGDPRConsent?: string;
    passwordUpdateComplete?: string;
    gdprConsentComplete?: string;
  };
}

export const ROUTES = {
  LOGIN: "/iniciar-sesion",
  DASHBOARD: "/panel",
  PORTAL_OFICIAL: "/portal-oficial",
  PASSWORD_UPDATE: "/actualizar-contrasena",
  PASSWORD_RESET: "/restablecer-contrasena",
  GDPR_CONSENT: "/consentimiento-gdpr",
  HOME: "/",
} as const;

export const routeConfig: RouteConfig[] = [
  {
    path: ROUTES.LOGIN,
    isPublic: true,
    requiresNoAuth: true,
    redirectConditions: {
      authenticated: ROUTES.DASHBOARD, // This will be handled by getRedirectPath with role logic
    },
  },
  {
    path: ROUTES.PASSWORD_RESET,
    isPublic: true,
  },
  {
    path: ROUTES.PASSWORD_UPDATE,
    requiresAuth: true,
    requiresPasswordUpdate: true,
    redirectConditions: {
      unauthenticated: ROUTES.LOGIN,
      passwordUpdateComplete: ROUTES.GDPR_CONSENT, // After password update, check GDPR consent
    },
  },
  {
    path: ROUTES.GDPR_CONSENT,
    requiresAuth: true,
    requiresGDPRConsent: true,
    redirectConditions: {
      unauthenticated: ROUTES.LOGIN,
      needsPasswordUpdate: ROUTES.PASSWORD_UPDATE,
      gdprConsentComplete: ROUTES.DASHBOARD, // This will be handled by getRedirectPath with role logic
    },
  },
  {
    path: ROUTES.DASHBOARD,
    requiresAuth: true,
    redirectConditions: {
      unauthenticated: ROUTES.LOGIN,
      needsPasswordUpdate: ROUTES.PASSWORD_UPDATE,
      needsGDPRConsent: ROUTES.GDPR_CONSENT,
    },
  },
  {
    path: ROUTES.PORTAL_OFICIAL,
    requiresAuth: true,
    redirectConditions: {
      unauthenticated: ROUTES.LOGIN,
      needsPasswordUpdate: ROUTES.PASSWORD_UPDATE,
      needsGDPRConsent: ROUTES.GDPR_CONSENT,
    },
  },
  {
    path: ROUTES.HOME,
    redirectConditions: {
      authenticated: ROUTES.DASHBOARD, // This will be handled by getRedirectPath with role logic
      unauthenticated: ROUTES.LOGIN,
      needsPasswordUpdate: ROUTES.PASSWORD_UPDATE,
      needsGDPRConsent: ROUTES.GDPR_CONSENT,
    },
  },
];

export function getRedirectPath(
  routePath: string,
  usuario: Usuario | null,
  userRole?: "employee" | "official" | null
): string | null {
  const route = routeConfig.find((r) => r.path === routePath);
  if (!route?.redirectConditions) return null;

  const isAuthenticated = !!usuario;
  const needsPasswordUpdate = usuario?.firstLogin;
  const needsGDPRConsent = usuario && !usuario.gdprConsentGiven;

  // Priority order: authentication > password update > GDPR consent > role-based routing

  if (!isAuthenticated && route.redirectConditions.unauthenticated) {
    return route.redirectConditions.unauthenticated;
  }

  if (
    isAuthenticated &&
    needsPasswordUpdate &&
    route.redirectConditions.needsPasswordUpdate
  ) {
    return route.redirectConditions.needsPasswordUpdate;
  }

  if (
    isAuthenticated &&
    !needsPasswordUpdate &&
    needsGDPRConsent &&
    route.redirectConditions.needsGDPRConsent
  ) {
    return route.redirectConditions.needsGDPRConsent;
  }

  if (
    isAuthenticated &&
    !needsPasswordUpdate &&
    route.redirectConditions.passwordUpdateComplete
  ) {
    // After password update, check if GDPR consent is needed
    if (needsGDPRConsent) {
      return ROUTES.GDPR_CONSENT;
    }
    // Use role to determine the right dashboard after password update
    if (userRole === "official") {
      return ROUTES.PORTAL_OFICIAL;
    } else {
      return ROUTES.DASHBOARD;
    }
  }

  if (
    isAuthenticated &&
    !needsPasswordUpdate &&
    !needsGDPRConsent &&
    route.redirectConditions.gdprConsentComplete
  ) {
    // Use role to determine the right dashboard after GDPR consent
    if (userRole === "official") {
      return ROUTES.PORTAL_OFICIAL;
    } else {
      return ROUTES.DASHBOARD;
    }
  }

  if (
    isAuthenticated &&
    !needsPasswordUpdate &&
    !needsGDPRConsent &&
    route.redirectConditions.authenticated
  ) {
    // Use role to determine the right dashboard
    if (userRole === "official") {
      return ROUTES.PORTAL_OFICIAL;
    } else {
      return ROUTES.DASHBOARD;
    }
  }

  return null;
}
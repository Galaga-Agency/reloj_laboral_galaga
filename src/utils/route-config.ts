import type { Usuario } from "@/types";

export interface RouteConfig {
  path: string;
  isPublic?: boolean;
  requiresAuth?: boolean;
  requiresNoAuth?: boolean;
  requiresPasswordUpdate?: boolean;
  redirectConditions?: {
    authenticated?: string;
    unauthenticated?: string;
    needsPasswordUpdate?: string;
    passwordUpdateComplete?: string;
  };
}

export const ROUTES = {
  LOGIN: "/iniciar-sesion",
  DASHBOARD: "/panel",
  PORTAL_OFICIAL: "/portal-oficial",
  PASSWORD_UPDATE: "/actualizar-contrasena",
  PASSWORD_RESET: "/restablecer-contrasena",
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
      passwordUpdateComplete: ROUTES.DASHBOARD, // This will be handled by getRedirectPath with role logic
    },
  },
  {
    path: ROUTES.DASHBOARD,
    requiresAuth: true,
    redirectConditions: {
      unauthenticated: ROUTES.LOGIN,
      needsPasswordUpdate: ROUTES.PASSWORD_UPDATE,
    },
  },
  {
    path: ROUTES.PORTAL_OFICIAL,
    requiresAuth: true,
    redirectConditions: {
      unauthenticated: ROUTES.LOGIN,
      needsPasswordUpdate: ROUTES.PASSWORD_UPDATE,
    },
  },
  {
    path: ROUTES.HOME,
    redirectConditions: {
      authenticated: ROUTES.DASHBOARD, // This will be handled by getRedirectPath with role logic
      unauthenticated: ROUTES.LOGIN,
      needsPasswordUpdate: ROUTES.PASSWORD_UPDATE,
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
    route.redirectConditions.authenticated
  ) {
    // Use role to determine the right dashboard
    if (userRole === "official") {
      return ROUTES.PORTAL_OFICIAL;
    } else {
      return ROUTES.DASHBOARD;
    }
  }

  if (
    isAuthenticated &&
    !needsPasswordUpdate &&
    route.redirectConditions.passwordUpdateComplete
  ) {
    // Use role to determine the right dashboard after password update
    if (userRole === "official") {
      return ROUTES.PORTAL_OFICIAL;
    } else {
      return ROUTES.DASHBOARD;
    }
  }

  if (!isAuthenticated && route.redirectConditions.unauthenticated) {
    return route.redirectConditions.unauthenticated;
  }

  return null;
}

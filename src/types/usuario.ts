export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  firstLogin?: boolean;
  isAdmin: boolean;
  isActive: boolean;
}

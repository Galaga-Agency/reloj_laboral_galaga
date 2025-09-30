declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      nombre: string;
      role: string;
      isAdmin: boolean;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};

import type { AuthUser } from "./user";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** raw bearer token, forwarded when this service needs to call the auth service as the user */
      accessToken?: string;
    }
  }
}

export {};

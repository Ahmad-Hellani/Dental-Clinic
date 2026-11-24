import bcrypt from "bcryptjs";
import { env } from "../../config/env";
import { BCRYPT_ROUNDS } from "../../config/constants";
import { AppError, Errors } from "../../shared/app-error";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessJwt,
  verifyRefreshJwt,
} from "../../shared/tokens";
import { toPublicUser, type AuthUser, type PublicUser, type UserRow } from "../../shared/types/user";
import { authRepository } from "./auth.repository";
import type { LoginInput, RegisterInput } from "./auth.schema";

const REFRESH_TTL_MS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

// compared against when the email is unknown, so response time does not reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const invalidRefresh = () =>
  new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid, revoked, or expired refresh token");

export type Session = { accessToken: string; refreshToken: string; user: PublicUser };

class AuthService {
  private async issueSession(user: UserRow): Promise<Session> {
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);
    await authRepository.insertRefreshToken(user.id, hashToken(refreshToken), new Date(Date.now() + REFRESH_TTL_MS));
    return { accessToken, refreshToken, user: toPublicUser(user) };
  }

  async register(input: RegisterInput): Promise<Session> {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    // public registration ALWAYS creates a PATIENT, roles can only be changed by an admin
    const user = await authRepository.create({
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      phone: input.phone,
      role: "PATIENT",
    });
    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<Session> {
    const user = await authRepository.findByEmail(input.email);
    const passwordOk = await bcrypt.compare(input.password, user?.password_hash ?? DUMMY_HASH);

    if (!user || !passwordOk) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }
    if (!user.is_active) {
      throw new AppError(403, "ACCOUNT_DISABLED", "This account has been deactivated.");
    }
    return this.issueSession(user);
  }

  /** Validates the refresh cookie and rotates it. */
  async refresh(refreshToken: string | undefined): Promise<Session> {
    if (!refreshToken) throw new AppError(401, "REFRESH_TOKEN_REQUIRED", "Refresh token is required");

    let userId: string;
    try {
      userId = verifyRefreshJwt(refreshToken);
    } catch {
      throw invalidRefresh();
    }

    const stored = await authRepository.findActiveRefreshToken(hashToken(refreshToken));
    if (!stored || stored.user_id !== userId) throw invalidRefresh();

    const user = await authRepository.findById(userId);
    if (!user || !user.is_active) throw invalidRefresh();

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user.id);
    await authRepository.rotateRefreshToken(
      stored.id,
      user.id,
      hashToken(newRefreshToken),
      new Date(Date.now() + REFRESH_TTL_MS),
    );
    return { accessToken, refreshToken: newRefreshToken, user: toPublicUser(user) };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    await authRepository.revokeByHash(hashToken(refreshToken));
  }

  /** Used by the `authenticate` middleware and GET /verify (role/active state is read fresh from the DB). */
  async verifyAccessToken(token: string): Promise<AuthUser> {
    let userId: string;
    try {
      userId = verifyAccessJwt(token).sub;
    } catch {
      throw Errors.unauthorized("Invalid or expired token");
    }
    const user = await authRepository.findById(userId);
    if (!user || !user.is_active) throw Errors.unauthorized("Account not found or deactivated");
    return { id: user.id, email: user.email, role: user.role, fullName: user.full_name };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await authRepository.findById(userId);
    if (!user) throw Errors.notFound("User not found");
    return toPublicUser(user);
  }
}

export const authService = new AuthService();

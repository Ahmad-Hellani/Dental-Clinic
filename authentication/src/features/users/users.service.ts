import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "../../config/constants";
import { Errors } from "../../shared/app-error";
import { toPublicUser } from "../../shared/types/user";
import { authRepository } from "../auth/auth.repository";
import { usersRepository } from "./users.repository";
import type { CreateUserBody, ListUsersQuery, UpdateUserBody } from "./users.schema";

export const usersService = {
  async list(q: ListUsersQuery) {
    const { rows, total } = await usersRepository.list(q);
    return {
      items: rows.map(toPublicUser),
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
    };
  },

  async create(body: CreateUserBody) {
    const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
    const user = await authRepository.create({
      fullName: body.fullName,
      email: body.email,
      passwordHash,
      phone: body.phone,
      role: body.role,
    });
    return toPublicUser(user);
  },

  async update(actorId: string, targetId: string, body: UpdateUserBody) {
    // prevent an admin from locking themselves out
    if (actorId === targetId && ((body.role && body.role !== "ADMIN") || body.isActive === false)) {
      throw Errors.badRequest("You cannot demote or deactivate your own account");
    }

    const user = await usersRepository.update(targetId, body);
    if (!user) throw Errors.notFound("User not found");

    // deactivated users lose their sessions immediately
    if (body.isActive === false) await authRepository.revokeAllForUser(targetId);
    return toPublicUser(user);
  },
};

import { asyncHandler } from "../../shared/async-handler";
import { Errors } from "../../shared/app-error";
import { usersService } from "./users.service";
import type { ListUsersQuery } from "./users.schema";

export const listUsers = asyncHandler(async (req, res) => {
  res.json({ data: await usersService.list(req.query as unknown as ListUsersQuery) });
});

export const createUser = asyncHandler(async (req, res) => {
  res.status(201).json({ data: { user: await usersService.create(req.body) } });
});

export const updateUser = asyncHandler(async (req, res) => {
  if (!req.user) throw Errors.unauthorized();
  res.json({ data: { user: await usersService.update(req.user.id, req.params.id, req.body) } });
});

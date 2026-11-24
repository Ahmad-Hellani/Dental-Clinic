import { Router } from "express";
import { authenticate, requireRole } from "../../shared/middleware/auth.middleware";
import { validate } from "../../shared/middleware/validate.middleware";
import { createUserBody, listUsersQuery, updateUserBody, userIdParams } from "./users.schema";
import { createUser, listUsers, updateUser } from "./users.controller";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get("/", validate({ query: listUsersQuery }), listUsers);
router.post("/", validate({ body: createUserBody }), createUser);
router.patch("/:id", validate({ params: userIdParams, body: updateUserBody }), updateUser);

export default router;

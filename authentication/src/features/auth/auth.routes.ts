import { Router } from "express";
import { validate } from "../../shared/middleware/validate.middleware";
import { authenticate } from "../../shared/middleware/auth.middleware";
import {
  loginIpLimiter,
  loginLimiter,
  registerLimiter,
} from "../../shared/middleware/rate-limit.middleware";
import { loginSchema, registerSchema } from "./auth.schema";
import { login, logout, me, refresh, register, verify } from "./auth.controller";

const router = Router();

router.post("/register", registerLimiter, validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), loginLimiter, loginIpLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);
router.get("/verify", authenticate, verify);

export default router;

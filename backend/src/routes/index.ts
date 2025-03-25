import { Router } from "express";
import wordRoutes from "./wordRoutes";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";

const router = Router();

// 기본 경로 설정
router.use("/api/word", wordRoutes);
router.use("/auth", authRoutes);
router.use("/api", userRoutes);

export default router;
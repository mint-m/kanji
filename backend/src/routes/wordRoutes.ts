// src/routes/wordRoutes.ts
import { Router } from "express";
import * as wordController from "../controllers/wordController";

const router = Router();

// 모든 단어 가져오기
router.get("/all", wordController.getAllWords);

// 레벨별 단어 가져오기
router.get("/level/:level", wordController.getWordsByLevel);

// 레벨별 단어 가져오기
router.get("/level/:level/steps", wordController.getStepsForLevel);

// 한자 검색 (네이버 API 활용)
router.get("/kanjiSearch", wordController.searchKanji);

export default router;
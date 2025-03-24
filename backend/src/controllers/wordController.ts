// src/controllers/wordController.ts
import { Request, Response, NextFunction } from "express";
import axios from "axios";
import Word from "../models/word";
import { NotFoundError, InternalServerError } from "../utils/errors";

// 모든 단어 가져오기
export const getAllWords = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const words = await Word.find();
    res.json(words);
  } catch (error) {
    next(new InternalServerError("Failed to fetch words"));
  }
};

// 레벨별 단어 가져오기
export const getWordsByLevel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const level = req.params.level;
    const words = await Word.find({ level: level });
    
    if (words.length === 0) {
      return next(new NotFoundError(`No words found for level ${level}`));
    }
    
    res.json(words);
  } catch (error) {
    next(new InternalServerError("Failed to fetch words by level"));
  }
};

// 한자 검색 (네이버 API 활용)
export const searchKanji = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const kanji = req.query.kanji;
    
    if (!kanji) {
      return next(new NotFoundError("Kanji query parameter is required"));
    }
    
    const baseUrl = "https://ja.dict.naver.com/api3/jako/search/hanja?query=";
    const kanjiData = await axios.get(baseUrl + kanji);
    
    res.json(kanjiData.data);
  } catch (error) {
    next(new InternalServerError("Failed to search kanji"));
  }
};
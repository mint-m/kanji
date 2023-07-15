import express, { Request, Response, NextFunction } from "express";
import axios from "axios";

const app = express();

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hi! This is my first express server");
});

app.get("/api/word", (req: Request, res: Response, next: NextFunction) => {
  res.send([
    {
      hiragana: "あい",
      targetWord: "[愛]",
      wordMean: "[명사]사랑;애정",
      tryNum: 0,
    },
  ]);
});

app.get(
  "/api/kanji",
  async (req: Request, res: Response, next: NextFunction) => {
    const baseUrl = "https://ja.dict.naver.com/api3/jako/search/hanja?query=";
    const kanjiData = await axios.get(baseUrl + req.query.kanji);

    res.json(kanjiData.data);
  }
);

app.listen("8000", () => {
  console.log(`
        #############################################
        🛡️ Server listening on port: 8000 🛡️
        #############################################  
    `);
});

//REST API

import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import mongoose from "mongoose";
import config from "./config";
import Word from "./models/word";

const { MONGO_URI, PORT } = config;

const app = express();

mongoose
  .connect(MONGO_URI!, { dbName: "kanji-db" })
  .then(() => console.log("MongoDB connecting Success!!!"))
  .catch((e) => console.log(e));

app.use(express.json());

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hi! This is my first express server");
});

app.get(
  "/api/word/all",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const words = await Word.find();
      res.json(words);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/word/level/:level",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const level = req.params.level;
      const words = await Word.find({ level: level });
      res.json(words);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

app.get(
  "/api/kanji",
  async (req: Request, res: Response, next: NextFunction) => {
    const baseUrl = "https://ja.dict.naver.com/api3/jako/search/hanja?query=";
    const kanjiData = await axios.get(baseUrl + req.query.kanji);

    res.json(kanjiData.data);
  }
);

app.listen(PORT, () => {
  console.log(`
        #############################################
        🛡️ Server listening on port: ${PORT} 🛡️
        #############################################  
    `);
});

//REST API

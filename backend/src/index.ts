import express, { Request, Response, NextFunction } from "express";

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

app.listen("8000", () => {
  console.log(`
        #############################################
        🛡️ Server listening on port: 8000 🛡️
        #############################################  
    `);
});

//REST API

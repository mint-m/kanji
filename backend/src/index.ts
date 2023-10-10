import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import config from "./config";
import Word from "./models/word";
import User from "./models/user";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";

const {
  MONGO_URI,
  PORT,
  SESSION_SECREST,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} = config;

const app = express();

mongoose
  .connect(MONGO_URI!, { dbName: "kanji-db" })
  .then(() => console.log("MongoDB connecting Success!!!"))
  .catch((e) => console.log(e));

app.use(express.json());
app.use(cors());

app.use(
  session({
    secret: SESSION_SECREST as string,
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: "none",
      secure: true,
    },
  })
);

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) return res.redirect("/login");
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
  "/api/kanjiSearch",
  async (req: Request, res: Response, next: NextFunction) => {
    const baseUrl = "https://ja.dict.naver.com/api3/jako/search/hanja?query=";
    const kanjiData = await axios.get(baseUrl + req.query.kanji);

    res.json(kanjiData.data);
  }
);

const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  "postmessage"
);

app.post("/auth/google/callback", async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.code);

  if (tokens.access_token) {
    const userInfo = await oAuth2Client.getTokenInfo(tokens.access_token);

    try {
      const existingUser = await User.findOne({ email: userInfo.email });
      if (!existingUser) {
        // 새로운 사용자라면 MongoDB에 저장
        const newUser = new User({
          type: "google",
          email: userInfo.email,
          name: userInfo.email?.split("@")[0],
        });

        await newUser.save();
      }
    } catch (error) {
      console.error(error);
    }
  }

  res.send(tokens);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`
        #############################################
        🛡️ Server listening on port: ${PORT} 🛡️
        #############################################  
    `);
});

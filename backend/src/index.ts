import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import config from "./config";
import Word from "./models/word";
import User from "./models/user";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";


const {
  MONGO_URI,
  PORT,
  SESSION_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI,
} = config;

const app = express();

mongoose
  .connect(MONGO_URI!, { dbName: "kanji-db" })
  .then(() => console.log("MongoDB connecting Success!!!"))
  .catch((e) => console.log(e));

app.use(express.json());
app.use(
  cors({
      credentials: true,
      origin : 'http://127.0.0.1:4200',
  })
);

app.use(
  session({
    secret: SESSION_SECRET as string,
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
  REDIRECT_URI
);

app.post("/auth/google/callback", async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.code);
  oAuth2Client.setCredentials({ access_token: tokens.access_token });

  const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: "v2",
  });

  const userInfoData = (await oauth2.userinfo.get()).data;

  if (tokens.access_token) {
    try {
      const existingUser = await User.findOne({ email: userInfoData.email });
      if (existingUser) {
        // 기존 유저 확인
      } else {
        // 새로운 사용자라면 MongoDB에 저장
        const newUser = new User({
          type: "google",
          email: userInfoData.email,
          name: userInfoData.name,
        });

        await newUser.save();
      }
    } catch (error) {
      console.error(error);
    }
  }

  const token = jwt.sign({
    id: userInfoData.id,
    email: userInfoData.email,
    name: userInfoData.name,
  }, 'your_secret_key', { expiresIn: '1h' });
  
  res.json(token);
});

app.get("/auth/user_info", async (req, res) => {
  const tokens = req.body;
  oAuth2Client.setCredentials({ access_token: tokens.access_token });

  const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: "v2",
  });

  const userInfo = await oauth2.userinfo.get();
  return userInfo;
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.patch("/api/checkpoint/:userId/:wordIndex", async (req, res) => {
  const { userId } = req.params;
  const { checkpoint, wordIndex } = req.body;

  console.log(checkpoint, wordIndex);

  try {
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update or add 'checkpoint' field
    if (checkpoint) {
      existingUser.learningCheckpoint = checkpoint;
    }

    await existingUser.save();

    res.json(existingUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`
        #############################################
        🛡️ Server listening on port: ${PORT} 🛡️
        #############################################  
    `);
});

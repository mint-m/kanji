import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import config from "./config";
import Word from "./models/word";
import User from "./models/user";
import passport from "passport";
import { Strategy as GoogleOAuth2Strategy } from "passport-google-oauth20";
import session from "express-session";
import { IUser } from "./interfaces/IUser";

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

passport.use(
  new GoogleOAuth2Strategy(
    {
      clientID: GOOGLE_CLIENT_ID as string,
      clientSecret: GOOGLE_CLIENT_SECRET as string,
      callbackURL: `http://localhost:8000/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ email: profile.id });

        if (existingUser) {
          // 이미 존재하는 사용자라면 이름만 업데이트
          existingUser.name = profile.displayName;
          await existingUser.save();
          return done(null, existingUser);
        } else {
          // 새로운 사용자라면 MongoDB에 저장
          const newUser = new User({
            email: profile.id,
            name: profile.displayName,
          });

          await newUser.save();
          return done(null, newUser);
        }
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((id: string, done) => {
  done(null, id);
});

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.redirect("/login");
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

app.post("/auth/google", async (req, res) => {
  const { accessToken } = req.body;

  try {
    const tokenInfoResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    const tokenInfo = tokenInfoResponse.data;

    (async () => {
      try {
        const existingUser = await User.findOne({ email: tokenInfo.email });

        if (!existingUser) {
          const newUser = new User({
            type: "google",
            userid: tokenInfo.email,
            email: tokenInfo.email,
            name: tokenInfo.email,
          });
          await newUser.save();
          console.log("New user saved successfully");
        }
      } catch (error) {
        console.error("Error:", error);
        res.json({ success: false, error: "New user save err" });
      }
    })();

    if (tokenInfo && tokenInfo.user_id) {
      req.logIn(tokenInfo, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, error: "로그인에 실패했습니다." });
        }
        return res.status(200).json({ success: true, user: tokenInfo });
      });
    } else {
      return res
        .status(401)
        .json({ success: false, error: "토큰이 유효하지 않습니다." });
    }
  } catch (error) {
    console.error("Google token validation error:", error);
    return res
      .status(500)
      .json({ success: false, error: "서버 오류가 발생했습니다." });
  }
});

app.listen(PORT, () => {
  console.log(`
        #############################################
        🛡️ Server listening on port: ${PORT} 🛡️
        #############################################  
    `);
});

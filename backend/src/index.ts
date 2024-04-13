import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import cors from "cors";
import jwt, { Secret } from "jsonwebtoken";
import mongoose from "mongoose";
import config from "./config";
import Word from "./models/word";
import User from "./models/user";
import session from "express-session";
import { OAuth2Client } from "google-auth-library";
import { generateToken } from "./services/auth";
import { google } from "googleapis";

const {
  MONGO_URI,
  PORT,
  SESSION_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI,
  JWT_SECRET,
} = config;

const app = express();

mongoose
  .connect(MONGO_URI!, { dbName: "kanji-db" })
  .then(() => console.log("MongoDB connecting Success!!!"))
  .catch((e) => console.log(e));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  cors({
    credentials: true,
    origin: 'http://127.0.0.1:4200',
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
  REDIRECT_URI,
);

app.post("/auth/google/access-token", async (req, res) => {
  try {
    if (!req.body.code) {
      return res.status(400).send("Error: Code is missing.");
    }

    const { tokens } = await oAuth2Client.getToken(req.body.code);
    if (!tokens || !tokens.access_token) {
      return res.status(500).send("Error: Unable to retrieve access token.");
    }

    res.status(200).send(tokens.access_token);
  } catch (error) {
    console.error("Error while retrieving Google access token:", error);
    res.status(500).send("Error: Internal server error.");
  }
});

app.post("/auth/google-login", async (req: any, res: Response) => {
  try {
    const { accessToken } = req.body;
    const userInfo = await getUserInfoWithToken(accessToken);

    let user = await User.findOne({
      email: userInfo.email
    });

    if (!user) {
      // If user doesn't exist, create a new user
      const newUser = new User({
        email: userInfo.email,
        name: userInfo.name,
        type: 'google',
      });
      user = await newUser.save();
    }

    // Generate JWT token for the user
    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

const getUserInfoWithToken = async (tokens: string) => {
  oAuth2Client.setCredentials({ access_token: tokens });
  const oauth2 = google.oauth2({
    auth: oAuth2Client,
    version: "v2",
  });
  const userInfo = (await oauth2.userinfo.get()).data;

  return userInfo;
}

app.get("/auth/profile", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or not in the expected format' });
  }
  interface JwtPayload {
    userId: string
  }

  const tokenString = authHeader.split(' ')[1].replace(/\"/gi, "");;
  const decodedToken: JwtPayload = jwt.verify(tokenString, JWT_SECRET as Secret) as JwtPayload;

  const user = await User.findOne({_id:decodedToken.userId});
  res.json(user);
});

app.post("/auth/logout", (req, res) => {
  try {
    // Extract the JWT token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or not in the expected format' });
    }

    const token = authHeader.split(' ')[1];

    // Invalidate the JWT token by adding it to a blacklist (optional)
    // Here, you can implement your own logic to blacklist tokens in a database or cache

    // Respond with a successful logout message
    res.json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.patch("/api/checkpoint/:userId/:wordIndex", async (req, res) => {
  const { userId } = req.params;
  const { checkpoint, wordIndex } = req.body;

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

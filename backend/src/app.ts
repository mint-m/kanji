// src/app.ts
import express from "express";
import cors from "cors";
import session from "express-session";
import config from "./config";
import routes from "./routes";
import { errorHandler, notFound } from "./middleware/errorHandler";

const { SESSION_SECRET } = config;

const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'];
app.use(cors({ credentials: true, origin: allowedOrigins }));

// 세션 설정
app.use(
  session({
    secret: SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "none",
      secure: true,
    },
  })
);

// 라우터 설정
app.use("/", routes);

// 루트 경로
app.get("/", (req, res) => {
  if (!req.session) return res.redirect("/login");
  res.send("API is running...");
});

// 존재하지 않는 경로 처리
app.use(notFound);

// 에러 핸들러
app.use(errorHandler);

export default app;
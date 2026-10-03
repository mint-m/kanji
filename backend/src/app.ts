// src/app.ts
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import routes from "./routes";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();

// 프록시(Render 등) 뒤에서 클라이언트 IP(req.ip)가 올바르게 잡히도록 신뢰 — authRateLimit이 의존
app.set("trust proxy", 1);

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:4200'];
app.use(cors({ credentials: true, origin: allowedOrigins }));

// 라우터 설정
app.use("/", routes);

// 루트 경로
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 가동률 모니터용 — DB 연결까지 확인한다 (Atlas 휴면·연결 끊김을 감지)
app.get("/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ success: dbUp, data: { db: dbUp ? "up" : "down" } });
});

// 존재하지 않는 경로 처리
app.use(notFound);

// 에러 핸들러
app.use(errorHandler);

export default app;
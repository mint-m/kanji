// src/server.ts
import mongoose from "mongoose";
import app from "./app";
import config, { validateEnv } from "./config";

// 환경변수 일괄 검증 (누락 시 목록 출력 후 종료)
validateEnv();

const { MONGO_URI, PORT } = config;

// MongoDB 연결
mongoose
  .connect(MONGO_URI, { dbName: "kanji-db" })
  .then(() => {
    console.log("MongoDB connecting Success!!!");
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`
        #############################################
        🛡️ Server listening on port: ${PORT} 🛡️
        #############################################  
      `);
    });
  })
  .catch((e) => {
    console.error("MongoDB connection error:", e);
    process.exit(1);
  });

// 예기치 않은 예외 처리
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
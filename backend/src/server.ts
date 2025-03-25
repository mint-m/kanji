// src/server.ts
import mongoose from "mongoose";
import app from "./app";
import config from "./config";

const { MONGO_URI, PORT } = config;

// 환경 변수 검증
if (!MONGO_URI) {
  console.error("MONGO_URI is required");
  process.exit(1);
}

if (!PORT) {
  console.error("PORT is required");
  process.exit(1);
}

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
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;

app.use(cors());
app.use(express.static(path.join(__dirname, "docs"))); // 정적 파일 제공

// API 키를 클라이언트에 전달하는 엔드포인트
app.get("/api/key", (req, res) => {
  res.json({ clientId: NAVER_CLIENT_ID });
});

// 기본 라우트 설정
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "tourMaps.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

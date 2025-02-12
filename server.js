require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

// CORS 설정
app.use(cors());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "docs"))); // docs 폴더 내 정적 파일 제공

// ✅ [추가] 네이버 지도 API 키 제공 엔드포인트
app.get("/api/key", (req, res) => {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "API Key is missing in server" });
  }
  res.json({ clientId });
});

// 카카오 불러와야징
app.get("/api/kakao-key", (req, res) => {
  const kakaoApiKey = process.env.KAKAO_APIKEY;
  if (!kakaoApiKey) {
    return res
      .status(500)
      .json({ error: "Kakao API Key is missing in server" });
  }
  res.json({ kakaoApiKey });
});

// ✅ [추가] 관광 데이터 제공 API
app.get("/api/data", (req, res) => {
  res.json([
    {
      title: "강원특별자치도 원주시 남원로534번길 20",
      content: "공지천닭갈비",
      createdTime: "2020-11-27",
      lat: 37.3304437672,
      lng: 127.9486731681,
    },
    {
      title: "강원특별자치도 원주시 고문골길 169 (행구동)",
      content: "관음사·국형사계곡",
      createdTime: "2003-08-27",
      lat: 37.333655725,
      lng: 128.0141255047,
    },
  ]);
});

// 기본 페이지 라우팅
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "tourMaps.html"));
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

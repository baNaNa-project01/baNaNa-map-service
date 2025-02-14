require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

// CORS 설정
app.use(cors());

// 정적 파일 제공 (docs 폴더 내 정적 파일)
app.use(express.static(path.join(__dirname, "docs")));

// 네이버 지도 API 키 제공 엔드포인트
app.get("/api/key", (req, res) => {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "API Key is missing in server" });
  }
  res.json({ clientId });
});

// 카카오 키 제공 엔드포인트
app.get("/api/kakao-key", (req, res) => {
  const kakaoApiKey = process.env.KAKAO_APIKEY;
  if (!kakaoApiKey) {
    return res
      .status(500)
      .json({ error: "Kakao API Key is missing in server" });
  }
  res.json({ kakaoApiKey });
});

// TourAPI 데이터를 불러와 클라이언트에 전달하는 엔드포인트 (지역 기반 관광정보 조회 예시)
app.get("/api/tour-data", async (req, res) => {
  const tourAPIKey = process.env.TOUR_API;
  if (!tourAPIKey) {
    return res
      .status(500)
      .json({ error: "Tour API Key is missing in server (.env 파일 확인)" });
  }
  const url = `https://apis.data.go.kr/B551011/KorService1/areaBasedList1?numOfRows=10&pageNo=1&MobileOS=ETC&MobileApp=study&_type=json&areaCode=1&sigunguCode=1&serviceKey=${tourAPIKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("✅ TourAPI 데이터 로드 성공:", data);
    res.json(data);
  } catch (error) {
    console.error("❌ TourAPI 호출 실패:", error);
    res.status(500).json({ error: "TourAPI 호출 실패" });
  }
});

// TourAPI: 도별 지역 코드 조회 엔드포인트
app.get("/api/region-code", async (req, res) => {
  const tourAPIKey = process.env.TOUR_API;
  if (!tourAPIKey) {
    return res
      .status(500)
      .json({ error: "Tour API Key is missing in server (.env 파일 확인)" });
  }
  const url = `https://apis.data.go.kr/B551011/KorService1/areaCode1?serviceKey=${tourAPIKey}&numOfRows=50&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("✅ 도별 지역 코드 로드 성공:", data);
    res.json(data);
  } catch (error) {
    console.error("❌ 도별 지역 코드 호출 실패:", error);
    res.status(500).json({ error: "도별 지역 코드 호출 실패" });
  }
});

// TourAPI: 세부 지역 코드 조회 엔드포인트 (쿼리 파라미터 areaCode 사용)
app.get("/api/detail-region", async (req, res) => {
  const { areaCode } = req.query;
  const tourAPIKey = process.env.TOUR_API;
  if (!tourAPIKey) {
    return res
      .status(500)
      .json({ error: "Tour API Key is missing in server (.env 파일 확인)" });
  }
  const url = `https://apis.data.go.kr/B551011/KorService1/areaCode1?serviceKey=${tourAPIKey}&numOfRows=100&pageNo=1&MobileOS=ETC&MobileApp=AppTest&areaCode=${areaCode}&_type=json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`✅ 세부 지역 코드 (areaCode=${areaCode}) 로드 성공:`, data);
    res.json(data);
  } catch (error) {
    console.error("❌ 세부 지역 코드 호출 실패:", error);
    res.status(500).json({ error: "세부 지역 코드 호출 실패" });
  }
});

// TourAPI: 지역 기반 관광정보 조회 엔드포인트 (contentTypeId, areaCode, sigunguCode 사용)
app.get("/api/region-tour-info", async (req, res) => {
  const { contentTypeId, areaCode, sigunguCode } = req.query;
  const tourAPIKey = process.env.TOUR_API;
  if (!tourAPIKey) {
    return res
      .status(500)
      .json({ error: "Tour API Key is missing in server (.env 파일 확인)" });
  }
  const url = `https://apis.data.go.kr/B551011/KorService1/areaBasedList1?numOfRows=50&pageNo=1&MobileOS=ETC&MobileApp=study&_type=json&contentTypeId=${contentTypeId}&areaCode=${areaCode}&sigunguCode=${sigunguCode}&serviceKey=${tourAPIKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("✅ 지역 기반 관광정보 로드 성공:", data);
    res.json(data);
  } catch (error) {
    console.error("❌ 지역 기반 관광정보 호출 실패:", error);
    res.status(500).json({ error: "지역 기반 관광정보 호출 실패" });
  }
});

// TourAPI: 위치 기반 관광정보 조회 엔드포인트 (mapX, mapY, radius 사용)
app.get("/api/location-tour-info", async (req, res) => {
  const { mapX, mapY, radius } = req.query;
  const tourAPIKey = process.env.TOUR_API;
  if (!tourAPIKey) {
    return res
      .status(500)
      .json({ error: "Tour API Key is missing in server (.env 파일 확인)" });
  }
  const url = `https://apis.data.go.kr/B551011/KorService1/locationBasedList1?numOfRows=100&MobileOS=ETC&MobileApp=study&mapX=${mapX}&mapY=${mapY}&radius=${radius}&serviceKey=${tourAPIKey}&_type=json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("✅ 위치 기반 관광정보 로드 성공:", data);
    res.json(data);
  } catch (error) {
    console.error("❌ 위치 기반 관광정보 호출 실패:", error);
    res.status(500).json({ error: "위치 기반 관광정보 호출 실패" });
  }
});

// 관광 데이터 제공 API (예시 데이터)
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

// 기본 페이지 라우팅 (docs 폴더 내 tourMaps.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "docs", "tourMaps.html"));
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

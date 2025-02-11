const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

// CORS 설정
app.use(cors());

// 정적 파일 경로 설정
app.use(express.static(__dirname));

// 기본 라우팅 설정
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "tourMaps.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

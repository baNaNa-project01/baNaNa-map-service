// 서버에서 API 키 가져오기
fetch("/api/key")
  .then((response) => response.json())
  .then((data) => {
    if (!data.clientId) {
      console.error("API Key is missing");
      return;
    }

    // 네이버 지도 API 스크립트 동적 로드
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${data.clientId}`;
    script.onload = initMap;
    document.head.appendChild(script);
  })
  .catch((error) => console.error("Failed to load API key:", error));

function initMap() {
  const mapOptions = {
    center: new naver.maps.LatLng(37.3595704, 127.105399),
    zoom: 10,
  };
  new naver.maps.Map("map", mapOptions);
}

// 지도 객체를 저장할 전역 변수
let map;

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

// 지도 생성
function initMap() {
  const mapOptions = {
    center: new naver.maps.LatLng(37.3595704, 127.105399),
    zoom: 10,
  };

  // 지도 객체 저장
  map = new naver.maps.Map("map", mapOptions);

  // 마커 추가
  addMarker(37.3595704, 127.105399);
}

// 마커 추가 함수
function addMarker(lat, lng) {
  new naver.maps.Marker({
    map: map,
    position: new naver.maps.LatLng(lat, lng),
    icon: {
      content: "<div class='marker'></div>", // 따옴표 오류 수정
      anchor: new naver.maps.Point(15, 15), // 마커 중심 조정
    },
  });
}

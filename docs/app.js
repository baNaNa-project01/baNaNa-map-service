// 지도 객체를 저장할 전역 변수
let map;
let markerData = [];

// ✅ API 키 가져오기
fetch("/api/key")
  .then((response) => {
    if (!response.ok) throw new Error("API Key fetch failed");
    return response.json();
  })
  .then((data) => {
    if (!data.clientId) throw new Error("API Key is missing");

    // 네이버 지도 API 스크립트 동적 로드
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${data.clientId}`;
    script.onload = initMap;
    document.head.appendChild(script);
  })
  .catch((error) => console.error("Failed to load API key:", error));

// ✅ 관광 데이터 가져오기
fetch("/api/data")
  .then((response) => response.json())
  .then((data) => {
    markerData = data;
    if (map) {
      addMarkers();
    }
  })
  .catch((error) => console.error("Failed to load data:", error));

// 지도 생성
function initMap() {
  const mapOptions = {
    center: new naver.maps.LatLng(37.3595704, 127.105399),
    zoom: 10,
  };

  // 지도 객체 저장
  map = new naver.maps.Map("map", mapOptions);

  // 데이터가 이미 로드된 경우 마커 추가
  if (markerData.length > 0) {
    addMarkers();
  }
}

// ✅ 여러 개의 마커 추가 함수
function addMarkers() {
  let markerList = [];
  let infowindowList = [];

  markerData.forEach((location) => {
    let latlng = new naver.maps.LatLng(location.lat, location.lng);

    // ✅ 마커 생성
    let marker = new naver.maps.Marker({
      map: map,
      position: latlng,
      icon: {
        content: `<div class='marker'></div>`,
        anchor: new naver.maps.Point(12, 12),
      },
    });

    // ✅ 인포 윈도우 내용
    let content = `<div class='infowindow_wrap'>
      <div class='infowindow_title'>${location.title}</div>
      <div class='infowindow_content'>${location.content}</div>
      <div class='infowindow_createdTime'>${location.createdTime}</div>
    </div>`;

    // ✅ 인포 윈도우 생성
    let infowindow = new naver.maps.InfoWindow({
      content: content,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#ccc",
      anchorSize: new naver.maps.Size(10, 10),
    });

    // 리스트에 저장
    markerList.push(marker);
    infowindowList.push(infowindow);

    // ✅ 마커 클릭 시 인포 윈도우 열기/닫기
    naver.maps.Event.addListener(marker, "click", () => {
      if (infowindow.getMap()) {
        infowindow.close();
      } else {
        closeAllInfoWindows(); // 다른 윈도우 닫기
        infowindow.open(map, marker);
      }
    });
  });

  // ✅ 지도 클릭 시 모든 인포 윈도우 닫기
  naver.maps.Event.addListener(map, "click", closeAllInfoWindows);

  function closeAllInfoWindows() {
    infowindowList.forEach((infowindow) => infowindow.close());
  }
}

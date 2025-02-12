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

    console.log("✅ 네이버 API Key 로드 성공");

    // 네이버 지도 API 스크립트 동적 로드
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${data.clientId}`;
    script.onload = initMap;
    document.head.appendChild(script);
  })
  .catch((error) => console.error("Failed to load API key:", error));

// ✅ 카카오 API 키 가져오기
fetch("/api/kakao-key")
  .then((response) => {
    if (!response.ok) throw new Error("Kakao API Key fetch failed");
    return response.json();
  })
  .then((data) => {
    if (!data.kakaoApiKey) throw new Error("Kakao API Key is missing");

    console.log("✅ 카카오 API Key 로드 성공");

    // ✅ 카카오 지도 API 스크립트 동적 로드
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${data.kakaoApiKey}&libraries=services`;
    script.onload = waitForKakaoInit;
    document.head.appendChild(script);
  })
  .catch((error) => console.error("Failed to load Kakao API key:", error));

// ✅ `kakao` 객체가 로드될 때까지 기다리는 함수
function waitForKakaoInit() {
  console.log("⌛ waitForKakaoInit 실행됨");

  if (window.kakao && window.kakao.maps && kakao.maps.services) {
    console.log("✅ Kakao API 로드 성공!");
    initKakaoMap();
  } else {
    console.warn("⏳ Kakao API가 아직 로드되지 않음... 100ms 후 재시도");
    setTimeout(waitForKakaoInit, 100);
  }
}
// ✅ 카카오 지도 초기화 함수
function initKakaoMap() {
  console.log("📌 initKakaoMap 실행됨");
  if (window.kakao && window.kakao.maps && kakao.maps.services) {
    window.search_loc = new kakao.maps.services.Places();
    console.log("✅ Kakao Places 서비스 초기화 완료");
  } else {
    console.error("❌ Kakao Places 서비스 초기화 실패");
  }
}

// ✅ 관광 데이터 가져오기
fetch("/api/data")
  .then((response) => response.json())
  .then((data) => {
    console.log("✅ 관광 데이터 로드 성공");
    markerData = data;
    if (map) {
      addMarkers();
    }
  })
  .catch((error) => console.error("Failed to load data:", error));

// 지도 생성
function initMap() {
  console.log("📌 initMap 실행됨");
  const mapOptions = {
    center: new naver.maps.LatLng(37.3595704, 127.105399),
    zoom: 10,
  };

  // 지도 객체 저장
  map = new naver.maps.Map("map", mapOptions);

  console.log("✅ 네이버 지도 초기화 완료");

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

// ✅ 현재 위치 버튼 기능
$("#current").click(() => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const latlng = new naver.maps.LatLng(lat, lng);

        if (window.currentLocationMarker) {
          window.currentLocationMarker.setMap(null);
        }

        window.currentLocationMarker = new naver.maps.Marker({
          position: latlng,
          map: map,
          icon: {
            content: '<img class="myloc" src="your-icon-url">',
            anchor: new naver.maps.Point(11, 11),
          },
        });

        map.setZoom(14, false);
        map.panTo(latlng);
      },
      function (error) {
        console.error("Geolocation error:", error);
        alert("위치를 가져올 수 없습니다. 브라우저 권한을 확인하세요.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    alert("위치 정보를 지원하지 않는 브라우저입니다.");
  }
});

// ✅ 검색 기능
function searchHandler() {
  let content = $("#search_input").val().trim();
  if (!content) {
    alert("검색어를 입력하세요.");
    return;
  }

  console.log("🔍 검색 요청:", content);

  if (window.search_loc) {
    window.search_loc.keywordSearch(content, searchPlace);
  } else {
    console.error("❌ Kakao search service is not initialized yet.");
  }
}

// ✅ 검색 버튼 이벤트 리스너
$("#search_input").on("keydown", function (e) {
  if (e.keyCode === 13) {
    searchHandler();
  }
});
$("#search_btn").on("click", function () {
  searchHandler();
});

// ✅ Kakao 검색 결과 처리
function searchPlace(data, status, pagination) {
  console.log("📌 searchPlace 함수 호출됨");

  if (status === kakao.maps.services.Status.OK) {
    console.log("✅ 검색 결과:", data);
  } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
    console.warn("⚠️ 검색 결과 없음");
    alert("검색 결과가 없습니다.");
  } else {
    console.error("❌ 검색 오류 발생:", status);
    alert("검색 중 오류가 발생했습니다.");
  }
}

// app.js

// 지도 객체와 관광 데이터 저장용 전역 변수 선언
let map;
let markerData = [];

// ✅ 네이버 API 키 가져오기
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
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${data.clientId}&submodules=panorama,geocoder,drawing,visualization`;
    script.onload = initMap;
    document.head.appendChild(script);
  })
  .catch((error) => console.error("Failed to load API key:", error));

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

// 네이버 지도 초기화 함수
function initMap() {
  console.log("📌 initMap 실행됨");
  const mapOptions = {
    center: new naver.maps.LatLng(37.3595704, 127.105399),
    zoom: 10,
  };

  // 지도 객체 생성 및 저장
  map = new naver.maps.Map("map", mapOptions);

  console.log("✅ 네이버 지도 초기화 완료");

  // 관광 데이터가 이미 로드된 경우 마커 추가
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

    // 마커 생성
    let marker = new naver.maps.Marker({
      map: map,
      position: latlng,
      icon: {
        content: `<div class='marker'></div>`,
        anchor: new naver.maps.Point(12, 12),
      },
    });

    // 인포 윈도우 내용 구성
    let content = `<div class='infowindow_wrap'>
      <div class='infowindow_title'>${location.title}</div>
      <div class='infowindow_content'>${location.content}</div>
      <div class='infowindow_createdTime'>${location.createdTime}</div>
    </div>`;

    // 인포 윈도우 생성
    let infowindow = new naver.maps.InfoWindow({
      content: content,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#ccc",
      anchorSize: new naver.maps.Size(10, 10),
    });

    markerList.push(marker);
    infowindowList.push(infowindow);

    // 마커 클릭 시 인포 윈도우 토글
    naver.maps.Event.addListener(marker, "click", () => {
      if (infowindow.getMap()) {
        infowindow.close();
      } else {
        closeAllInfoWindows();
        infowindow.open(map, marker);
      }
    });
  });

  // 지도 클릭 시 모든 인포 윈도우 닫기
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
            content:
              '<img class="myloc" src="https://github.com/jungmyung16/day12_ChatBotWeb/blob/main/favicon-96x96.png?raw=true">',
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

// ✅ 검색 기능 (네이버 지도 API의 Geocoder 사용)
// 입력한 주소를 검색하여 결과(좌표 등)를 콘솔에 출력하고, 첫번째 결과를 지도 중앙으로 이동합니다.
function searchHandler() {
  let content = $("#search_input").val().trim();
  if (!content) {
    alert("검색어를 입력하세요.");
    return;
  }
  console.log("🔍 검색 요청:", content);
  searchAddress(content);
}

function searchAddress(address) {
  naver.maps.Service.geocode({ query: address }, function (status, response) {
    if (status !== naver.maps.Service.Status.OK) {
      console.error("검색 실패:", status);
      return;
    }
    if (response.v2.meta.totalCount === 0) {
      console.warn("검색 결과가 없습니다.");
    }
    console.log("검색 결과:", response.v2.addresses);
    // 첫 번째 검색 결과를 지도 중앙으로 이동 (선택 사항)
    if (response.v2.addresses.length > 0) {
      let item = response.v2.addresses[0];
      let point = new naver.maps.Point(item.x, item.y);
      map.setCenter(point);
      map.setZoom(15);
    }
  });
}

// 검색 버튼과 엔터키 이벤트 리스너 등록
$("#search_input").on("keydown", function (e) {
  if (e.keyCode === 13) {
    searchHandler();
  }
});
$("#search_btn").on("click", function () {
  searchHandler();
});

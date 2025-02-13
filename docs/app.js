// app.js

// 지도 객체와 전역 변수들
let map;
let markerData = [];
let searchMarkers = [];
let searchInfoWindows = [];

/* 1. 네이버 지도 API 키 가져오기 및 스크립트 로드 */
fetch("/api/key")
  .then((response) => {
    if (!response.ok) throw new Error("API Key fetch failed");
    return response.json();
  })
  .then((data) => {
    if (!data.clientId) throw new Error("API Key is missing");
    console.log("✅ 네이버 API Key 로드 성공");
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${data.clientId}`;
    script.onload = initMap;
    document.head.appendChild(script);
  })
  .catch((error) => console.error("Failed to load API key:", error));

/* 2. 카카오 지도 API 키 가져오기 및 스크립트 로드 (autoload=false 옵션 적용) */
fetch("/api/kakao-key")
  .then((response) => {
    if (!response.ok) throw new Error("Kakao API Key fetch failed");
    return response.json();
  })
  .then((data) => {
    if (!data.kakaoApiKey) throw new Error("Kakao API Key is missing");
    console.log("✅ 카카오 API Key 로드 성공");
    const script = document.createElement("script");
    script.async = false;
    script.defer = false;
    script.type = "text/javascript";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${data.kakaoApiKey}&libraries=services&autoload=false`;
    script.onload = function () {
      kakao.maps.load(function () {
        console.log("✅ Kakao Maps SDK 완전 초기화됨!");
        initKakaoMap();
      });
    };
    document.head.appendChild(script);
  })
  .catch((error) => console.error("Failed to load Kakao API key:", error));

/* 3. Kakao Places 서비스 초기화 */
function initKakaoMap() {
  console.log("📌 initKakaoMap 실행됨");
  if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
    window.search_loc = new kakao.maps.services.Places();
    console.log("✅ Kakao Places 서비스 초기화 완료");
  } else {
    console.error("❌ Kakao Places 서비스 초기화 실패");
  }
}

/* 4. 관광 데이터 가져오기 */
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

/* 5. 네이버 지도 초기화 함수 */
function initMap() {
  console.log("📌 initMap 실행됨");
  const mapOptions = {
    center: new naver.maps.LatLng(37.3595704, 127.105399),
    zoom: 10,
  };
  map = new naver.maps.Map("map", mapOptions);
  console.log("✅ 네이버 지도 초기화 완료");
  if (markerData.length > 0) {
    addMarkers();
  }
}

/* 6. 관광 데이터 마커 추가 함수 (네이버 지도) */
function addMarkers() {
  let markerList = [];
  let infowindowList = [];
  markerData.forEach((location) => {
    let latlng = new naver.maps.LatLng(location.lat, location.lng);
    let marker = new naver.maps.Marker({
      map: map,
      position: latlng,
      icon: {
        content: `<div class='marker'></div>`,
        anchor: new naver.maps.Point(12, 12),
      },
    });
    let content = `<div class='infowindow_wrap'>
      <div class='infowindow_title'>${location.title}</div>
      <div class='infowindow_content'>${location.content}</div>
      <div class='infowindow_createdTime'>${location.createdTime}</div>
    </div>`;
    let infowindow = new naver.maps.InfoWindow({
      content: content,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderColor: "#ccc",
      anchorSize: new naver.maps.Size(10, 10),
    });
    markerList.push(marker);
    infowindowList.push(infowindow);
    naver.maps.Event.addListener(marker, "click", () => {
      if (infowindow.getMap()) {
        infowindow.close();
      } else {
        closeAllInfoWindows();
        infowindow.open(map, marker);
      }
    });
  });
  naver.maps.Event.addListener(map, "click", closeAllInfoWindows);
  function closeAllInfoWindows() {
    infowindowList.forEach((infowindow) => infowindow.close());
  }
}

/* 7. 현재 위치 버튼 기능 */
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

/* 8. 검색 기능 - 입력값을 가져와 Kakao Places 검색 요청 */
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

$("#search_input").on("keydown", function (e) {
  if (e.keyCode === 13) {
    searchHandler();
  }
});
$("#search_btn").on("click", function () {
  searchHandler();
});

/* 기존 검색 마커 및 인포윈도우 제거 */
function clearSearchMarkers() {
  searchInfoWindows.forEach((iw) => {
    iw.close();
  });
  if (searchMarkers.length > 0) {
    searchMarkers.forEach((marker) => {
      marker.setMap(null);
    });
    searchMarkers = [];
    searchInfoWindows = [];
  }
}

/* 9. Kakao 검색 결과 처리 및 지도와 목록에 표출 */
function searchPlace(data, status, pagination) {
  console.log("📌 searchPlace 함수 호출됨");
  if (status === kakao.maps.services.Status.OK) {
    clearSearchMarkers();
    // 검색 결과 목록 초기화
    const listEl = document.getElementById("placesList");
    if (listEl) listEl.innerHTML = "";
    // 결과가 있으면 검색 목록 창 보이기
    document.getElementById("menu_wrap").style.display = "block";

    var bounds = new naver.maps.LatLngBounds();

    data.forEach(function (place, i) {
      console.log("검색된 장소 정보:", place);
      var position = new naver.maps.LatLng(
        parseFloat(place.y),
        parseFloat(place.x)
      );
      // 검색 결과 마커 생성 (Naver Map)
      var marker = new naver.maps.Marker({
        map: map,
        position: position,
        icon: {
          content: `<div class='search-marker'></div>`,
          anchor: new naver.maps.Point(12, 12),
        },
      });
      searchMarkers.push(marker);
      // 인포윈도우 생성
      var content = `<div class='infowindow_wrap'>
          <div class='infowindow_title'>${place.place_name}</div>
          <div class='infowindow_content'>${place.address_name}</div>
          <div class='infowindow_phone'>${
            place.phone ? place.phone : "전화번호 정보 없음"
          }</div>
        </div>`;
      var infowindow = new naver.maps.InfoWindow({
        content: content,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderColor: "#ccc",
        anchorSize: new naver.maps.Size(10, 10),
      });
      searchInfoWindows.push(infowindow);
      // 검색 마커 클릭 시 인포윈도우 토글 처리
      naver.maps.Event.addListener(marker, "click", function () {
        if (infowindow.getMap()) {
          infowindow.close();
        } else {
          searchInfoWindows.forEach((iw) => iw.close());
          infowindow.open(map, marker);
        }
      });
      // 결과 목록에 항목 추가 (클릭 이벤트로 인포윈도우 열고 지도 중심 이동)
      if (listEl) {
        var itemEl = document.createElement("li");
        itemEl.className = "item";
        var itemStr =
          '<span class="markerbg marker_' +
          (i + 1) +
          '"></span>' +
          '<div class="info">' +
          "<h5>" +
          place.place_name +
          "</h5>" +
          (place.road_address_name
            ? "<span>" +
              place.road_address_name +
              "</span><br><span class='jibun gray'>" +
              place.address_name +
              "</span><br>"
            : "<span>" + place.address_name + "</span><br>") +
          "<span class='tel'>" +
          (place.phone || "") +
          "</span>" +
          "</div>";
        itemEl.innerHTML = itemStr;
        // 목록 항목 클릭 시 인포윈도우 열고, 지도 중심 이동
        itemEl.onclick = function () {
          searchInfoWindows.forEach((iw) => iw.close());
          infowindow.open(map, marker);
          map.panTo(position);
        };
        listEl.appendChild(itemEl);
      }
      bounds.extend(position);
    });
    map.fitBounds(bounds);

    // 추가: 지도 클릭 시 검색 인포윈도우 모두 닫기
    naver.maps.Event.addListener(map, "click", function () {
      searchInfoWindows.forEach((iw) => iw.close());
    });

    displayPagination(pagination);
  } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
    alert("검색 결과가 존재하지 않습니다.");
    document.getElementById("menu_wrap").style.display = "none";
    return;
  } else {
    alert("검색 결과 중 오류가 발생했습니다.");
    return;
  }
}

/* 10. 페이지네이션 표시 (공식 예제 참고) */
function displayPagination(pagination) {
  var paginationEl = document.getElementById("pagination"),
    fragment = document.createDocumentFragment();
  while (paginationEl.hasChildNodes()) {
    paginationEl.removeChild(paginationEl.lastChild);
  }
  for (var i = 1; i <= pagination.last; i++) {
    var el = document.createElement("a");
    el.href = "#";
    el.innerHTML = i;
    if (i === pagination.current) {
      el.className = "on";
    } else {
      el.onclick = (function (i) {
        return function () {
          pagination.gotoPage(i);
        };
      })(i);
    }
    fragment.appendChild(el);
  }
  paginationEl.appendChild(fragment);
}

// =================== 기존 지도/검색 관련 코드 시작 ===================

// 전역 변수 선언
let map;
let markerData = [];
let searchMarkers = [];
let searchInfoWindows = [];

// 신규: 지역 기반 관광정보 선택값 저장 변수
let selectedAreaCode = null;
let selectedSigunguCode = null;
let selectedContentTypeId = null;

// 신규: 지역기반 관광정보 마커와 인포윈도우 저장 배열
let regionTourMarkers = [];
let regionTourInfoWindows = [];

// 기존 TourAPI 데이터 불러오기 테스트 (콘솔 로그용)
fetch("/api/tour-data")
  .then((res) => res.json())
  .then((data) => {
    console.log("TourAPI 데이터 (예시):", data);
    // 이후 데이터를 지도나 UI에 활용할 수 있습니다.
  })
  .catch((error) => {
    console.error("TourAPI 데이터 불러오기 실패:", error);
  });

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

/* 4. 관광 데이터 가져오기 (기존 /api/data 엔드포인트) */
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
  // 신규: 지도 빈 곳 클릭 시 regionTour 인포윈도우 닫기
  naver.maps.Event.addListener(map, "click", function () {
    regionTourInfoWindows.forEach((iw) => iw.close());
  });
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
        content: "<div class='marker'></div>",
        anchor: new naver.maps.Point(12, 12),
      },
    });
    let content = `
      <div class="infowindow_wrap">
        <div class="infowindow_title">${location.title}</div>
        <div class="infowindow_content">${location.content}</div>
        <div class="infowindow_createdTime">${location.createdTime}</div>
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

/* 8. 키워드 검색 기능 (Kakao Places) */
function searchHandler() {
  let content = $("#search_input").val().trim();
  if (!content) {
    alert("검색어를 입력하세요.");
    return;
  }
  console.log("🔍 검색 요청:", content);
  if (window.search_loc) {
    window.search_loc.keywordSearch(content, searchPlace, {
      useMapBounds: true,
    });
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

/* 9. 기존 검색 마커 및 인포윈도우 제거 */
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

/* 10. 키워드 검색 결과 처리 및 지도/목록에 표출 */
function searchPlace(data, status, pagination) {
  console.log("📌 searchPlace 함수 호출됨");
  if (status === kakao.maps.services.Status.OK) {
    clearSearchMarkers();
    const listEl = document.getElementById("placesList");
    if (listEl) listEl.innerHTML = "";
    document.getElementById("menu_wrap").style.display = "block";
    var bounds = new naver.maps.LatLngBounds();
    data.forEach(function (place, i) {
      console.log("검색된 장소 정보:", place);
      var position = new naver.maps.LatLng(
        parseFloat(place.y),
        parseFloat(place.x)
      );
      var marker = new naver.maps.Marker({
        map: map,
        position: position,
        icon: {
          content: "<div class='search-marker'></div>",
          anchor: new naver.maps.Point(12, 12),
        },
      });
      searchMarkers.push(marker);
      var content = `
        <div class="infowindow_wrap">
          <div class="infowindow_title">${place.place_name}</div>
          <div class="infowindow_content">${place.address_name}</div>
          <div class="infowindow_phone">${
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
      naver.maps.Event.addListener(marker, "click", function () {
        if (infowindow.getMap()) {
          infowindow.close();
        } else {
          searchInfoWindows.forEach((iw) => iw.close());
          infowindow.open(map, marker);
        }
      });
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

/* 11. 카테고리 검색 기능 */
function searchByCategory(categoryCode) {
  if (!categoryCode) {
    alert("카테고리를 선택해주세요.");
    return;
  }
  console.log("🔍 카테고리 검색 요청:", categoryCode);
  if (window.search_loc) {
    // Naver 지도에서 현재 보이는 영역의 경계 구하기
    const naverBounds = map.getBounds();
    const sw = naverBounds.getSW();
    const ne = naverBounds.getNE();
    // Kakao 지도 객체의 LatLng로 변환
    const kakaoSw = new kakao.maps.LatLng(sw.lat(), sw.lng());
    const kakaoNe = new kakao.maps.LatLng(ne.lat(), ne.lng());
    // Kakao의 LatLngBounds 객체 생성
    const kakaoBounds = new kakao.maps.LatLngBounds(kakaoSw, kakaoNe);
    // categorySearch 시 bounds 옵션에 kakaoBounds 객체를 넘김
    window.search_loc.categorySearch(categoryCode, categorySearchCB, {
      bounds: kakaoBounds,
    });
  } else {
    console.error("❌ Kakao search service is not initialized yet.");
  }
}
function categorySearchCB(data, status, pagination) {
  console.log("📌 categorySearchCB 호출됨");
  if (status === kakao.maps.services.Status.OK) {
    clearSearchMarkers();
    const listEl = document.getElementById("placesList");
    if (listEl) listEl.innerHTML = "";
    document.getElementById("menu_wrap").style.display = "block";
    var bounds = new naver.maps.LatLngBounds();
    data.forEach(function (place, i) {
      console.log("검색된 장소 정보:", place);
      var position = new naver.maps.LatLng(
        parseFloat(place.y),
        parseFloat(place.x)
      );
      var marker = new naver.maps.Marker({
        map: map,
        position: position,
        icon: {
          content: `<div class='search-marker'></div>`,
          anchor: new naver.maps.Point(12, 12),
        },
      });
      searchMarkers.push(marker);
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
      naver.maps.Event.addListener(marker, "click", function () {
        if (infowindow.getMap()) {
          infowindow.close();
        } else {
          searchInfoWindows.forEach((iw) => iw.close());
          infowindow.open(map, marker);
        }
      });
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

/* 11. 페이지네이션 표시 (공식 예제 참고) */
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

/* 12. 카테고리 버튼 클릭 이벤트 (옵션박스 대신 버튼으로 처리) */
$(document).on("click", ".category-btn", function () {
  var catCode = $(this).data("cat");
  searchByCategory(catCode);
});

// =================== 기존 지도/검색 관련 코드 끝 ===================

// =================== TourAPI 관련 UI/기능 및 신규 지역 기반 관광정보 코드 ===================
window.addEventListener("DOMContentLoaded", () => {
  // 기존 TourAPI UI 관련 DOM 요소 선택
  const dataDisplay = document.getElementById("data");
  const checkRegionCodeButton = document.getElementById("checkRegionCode");
  const checkDetailRegionCodeButton = document.getElementById(
    "checkDetailRegionCode"
  );
  const detailRegionSelect = document.getElementById("detailRegionSelect");
  const detailRegionIndexSelect = document.getElementById(
    "detailRegionIndexSelect"
  );
  const detaildetailRegionIndexSelect = document.getElementById(
    "detaildetailRegionIndexSelect"
  );
  const searchButton = document.getElementById("searchButton");
  const locationsearchButton = document.getElementById("locationsearchButton");

  // 기존 세부 지역 및 시군구 옵션박스 초기화 코드
  const detailRegionCodes = [
    1, 2, 3, 4, 5, 6, 7, 8, 31, 32, 33, 34, 35, 36, 37, 38, 39,
  ];
  const detailRegionNames = {
    1: "서울",
    2: "인천",
    3: "대전",
    4: "대구",
    5: "광주",
    6: "부산",
    7: "울산",
    8: "세종",
    31: "경기",
    32: "강원",
    33: "충북",
    34: "충남",
    35: "경북",
    36: "경남",
    37: "전북",
    38: "전남",
    39: "제주",
  };

  // detailRegionSelect와 detailRegionIndexSelect 옵션 채우기
  detailRegionCodes.forEach((code) => {
    const option = document.createElement("option");
    option.value = code;
    option.text = `${detailRegionNames[code]} - ${code}`;
    detailRegionSelect.appendChild(option);

    const indexOption = document.createElement("option");
    indexOption.value = code;
    indexOption.text = `${detailRegionNames[code]} - ${code}`;
    detailRegionIndexSelect.appendChild(indexOption);
  });

  // 세부 지역(시군구) 데이터를 채우는 함수 (옵션박스와 버튼 UI 함께 업데이트)
  function populateSigunguSelect(areaCode) {
    const detailUrl = `/api/detail-region?areaCode=${areaCode}`;
    fetch(detailUrl)
      .then((res) => res.json())
      .then((myJson) => {
        // 시군구 드롭다운 초기화
        detaildetailRegionIndexSelect.innerHTML = "";
        // 신규: 버튼 컨테이너 초기화
        const sigunguButtonsContainer = document.getElementById(
          "sigunguButtonsContainer"
        );
        sigunguButtonsContainer.innerHTML = "";

        const items = myJson.response.body.items.item;
        const itemArray = Array.isArray(items) ? items : [items];

        if (!itemArray[0]) {
          const option = document.createElement("option");
          option.value = "";
          option.text = `해당 지역에 시군구 정보가 없습니다.`;
          detaildetailRegionIndexSelect.appendChild(option);
          // 버튼으로도 표시
          const btn = document.createElement("button");
          btn.className = "sigungu-btn";
          btn.dataset.code = "";
          btn.innerText = "없음";
          sigunguButtonsContainer.appendChild(btn);
        } else {
          itemArray.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.code;
            option.text = item.name;
            detaildetailRegionIndexSelect.appendChild(option);
            // 신규: 버튼 생성
            const btn = document.createElement("button");
            btn.className = "sigungu-btn";
            btn.dataset.code = item.code;
            btn.innerText = item.name;
            sigunguButtonsContainer.appendChild(btn);
          });
        }
      });
  }

  // detailRegionIndexSelect 변경 시 시군구 옵션 업데이트
  detailRegionIndexSelect.addEventListener("change", () => {
    const selectedCode = detailRegionIndexSelect.value;
    populateSigunguSelect(selectedCode);
  });

  // 초기에는 서울(코드 1)로 시군구 데이터 로드
  populateSigunguSelect(1);

  // 도별 버튼 클릭: 신규 지역 선택 (수정됨 - 버튼 클릭 시 sigungu 버튼도 업데이트)
  const regionBtns = document.querySelectorAll(".region-btn");
  regionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 모든 도 버튼 active 클래스 제거 후, 클릭한 버튼에 추가
      regionBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedAreaCode = btn.dataset.code;
      console.log("선택된 지역 코드:", selectedAreaCode);
      // 도별 선택 시, 세부 지역(시군구) 업데이트 (드롭다운과 버튼 모두 갱신)
      populateSigunguSelect(selectedAreaCode);
    });
  });

  // 시군구 버튼 클릭: 신규 세부 지역 선택
  document
    .getElementById("sigunguButtonsContainer")
    .addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("sigungu-btn")) {
        // active 처리: 모든 버튼에서 제거 후 클릭한 버튼에 추가
        document
          .querySelectorAll("#sigunguButtonsContainer .sigungu-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        selectedSigunguCode = e.target.dataset.code;
        console.log("선택된 시군구 코드:", selectedSigunguCode);
      }
    });

  // 관광 타입 버튼 클릭: 신규 콘텐츠 타입 선택
  const contentTypeBtns = document.querySelectorAll(".contentType-btn");
  contentTypeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      contentTypeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedContentTypeId = btn.dataset.contenttypeid;
      console.log("선택된 콘텐츠 타입 ID:", selectedContentTypeId);
    });
  });

  // 신규: 지역기반 관광정보 조회하기 버튼 이벤트 처리
  const regionTourSearchButton = document.getElementById(
    "regionTourSearchButton"
  );
  regionTourSearchButton.addEventListener("click", () => {
    if (!selectedAreaCode) {
      alert("먼저 지역을 선택하세요.");
      return;
    }
    if (!selectedSigunguCode) {
      alert("먼저 세부 지역(시군구)을 선택하세요.");
      return;
    }
    if (!selectedContentTypeId) {
      alert("먼저 관광 타입을 선택하세요.");
      return;
    }
    const regionTourInfoURL = `/api/region-tour-info?contentTypeId=${selectedContentTypeId}&areaCode=${selectedAreaCode}&sigunguCode=${selectedSigunguCode}`;
    fetch(regionTourInfoURL)
      .then((res) => res.json())
      .then((myJson) => {
        // JSON 데이터 출력 (기존)
        dataDisplay.innerText = JSON.stringify(myJson, null, 2);
        // 신규: 기존 지역기반 마커 제거
        clearRegionTourMarkers();

        // API 응답 구조가 { response: { body: { items: { item: [...] } } } } 형태라고 가정합니다.
        let items = myJson.response.body.items.item;
        if (!Array.isArray(items)) {
          items = [items];
        }
        items.forEach((item) => {
          // 좌표: mapy(위도), mapx(경도)
          const position = new naver.maps.LatLng(
            parseFloat(item.mapy),
            parseFloat(item.mapx)
          );
          // 신규 노란 마커 생성
          const marker = new naver.maps.Marker({
            map: map,
            position: position,
            icon: {
              content: "<div class='regionTourMarker'></div>",
              anchor: new naver.maps.Point(12, 12),
            },
          });
          regionTourMarkers.push(marker);
          // 인포윈도우 내용 구성 (필요 정보: title, addr1, addr2, contenttypeid, createdtime, firstimage, modifiedtime)
          const content = `
            <div class="infowindow_wrap">
              <div class="infowindow_title">${item.title}</div>
              <div class="infowindow_content">
                주소: ${item.addr1} ${item.addr2}<br>
                관광타입: ${item.contenttypeid}<br>
                생성일: ${item.createdtime}<br>
                수정일: ${item.modifiedtime}<br>
                ${
                  item.firstimage
                    ? `<img src="${item.firstimage}" alt="${item.title}" style="width:100%;">`
                    : ""
                }
              </div>
            </div>`;
          const infoWindow = new naver.maps.InfoWindow({
            content: content,
            backgroundColor: "rgba(255,255,255,0.9)",
            borderColor: "#ccc",
            anchorSize: new naver.maps.Size(10, 10),
          });
          regionTourInfoWindows.push(infoWindow);
          // 마커 클릭 시 인포윈도우 표시 (다른 인포윈도우들은 닫기)
          naver.maps.Event.addListener(marker, "click", () => {
            regionTourInfoWindows.forEach((iw) => iw.close());
            infoWindow.open(map, marker);
          });
        });

        // 신규: 생성된 지역 기반 마커들의 위치로 지도 이동 (bounds 계산)
        if (regionTourMarkers.length > 0) {
          let bounds = new naver.maps.LatLngBounds();
          regionTourMarkers.forEach((marker) => {
            bounds.extend(marker.getPosition());
          });
          map.fitBounds(bounds);
          map.panTo(bounds.getCenter());
        }
      })
      .catch((error) => {
        dataDisplay.innerText = "Error fetching data: " + error;
      });
  });

  // 신규: 기존 지역기반 마커와 인포윈도우 제거 함수
  function clearRegionTourMarkers() {
    if (regionTourMarkers.length) {
      regionTourMarkers.forEach((marker) => {
        marker.setMap(null);
      });
      regionTourMarkers = [];
    }
    if (regionTourInfoWindows.length) {
      regionTourInfoWindows.forEach((iw) => iw.close());
      regionTourInfoWindows = [];
    }
  }

  // 기존: 도별 지역 코드 조회
  const tourRegionCodeURL = `/api/region-code`;
  checkRegionCodeButton.addEventListener("click", () => {
    fetch(tourRegionCodeURL)
      .then((res) => res.json())
      .then((myJson) => {
        dataDisplay.innerText = JSON.stringify(myJson, null, 2);
      })
      .catch((error) => {
        dataDisplay.innerText = "Error fetching data: " + error;
      });
  });

  // 기존: 세부 지역 코드 조회 (선택한 도의 코드 전달)
  checkDetailRegionCodeButton.addEventListener("click", () => {
    const selectedAreaCode = detailRegionSelect.value;
    const detailRegionURL = `/api/detail-region?areaCode=${selectedAreaCode}`;
    fetch(detailRegionURL)
      .then((res) => res.json())
      .then((myJson) => {
        dataDisplay.innerText = JSON.stringify(myJson, null, 2);
      })
      .catch((error) => {
        dataDisplay.innerText = "Error fetching data: " + error;
      });
  });

  // 기존: 지역 기반 관광정보 조회 (드롭다운 방식)
  searchButton.addEventListener("click", () => {
    const areaCode = detailRegionIndexSelect.value;
    const sigunguCode = detaildetailRegionIndexSelect.value;
    const regionTourInfoURL = `/api/region-tour-info?contentTypeId=12&areaCode=${areaCode}&sigunguCode=${sigunguCode}`;
    // 기본적으로 콘텐츠 타입 12(관광지)로 호출
    fetch(regionTourInfoURL)
      .then((res) => res.json())
      .then((myJson) => {
        dataDisplay.innerText = JSON.stringify(myJson, null, 2);
      })
      .catch((error) => {
        dataDisplay.innerText = "Error fetching data: " + error;
      });
  });

  // 기존: 위치 기반 관광정보 조회
  locationsearchButton.addEventListener("click", () => {
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;
    const radius = document.getElementById("radius").value;
    const locationTourInfoURL = `/api/location-tour-info?mapX=${longitude}&mapY=${latitude}&radius=${radius}`;
    fetch(locationTourInfoURL)
      .then((res) => res.text())
      .then((data) => {
        try {
          const jsonData = JSON.parse(data);
          dataDisplay.innerText = JSON.stringify(jsonData, null, 2);
        } catch (e) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(data, "text/xml");
          console.log(xmlDoc);
          dataDisplay.innerText = data;
        }
      })
      .catch((error) => {
        dataDisplay.innerText = "Error fetching data: " + error;
      });
  });
});

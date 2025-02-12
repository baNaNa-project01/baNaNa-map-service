## [현재 상황]

- 테스트용 마커 추가
- 테스트 하기 위해 확정된 UI가 아닌 임의로 배너 및 현재 위치 인포위도우 추가
- 처음 커밋했을 때 키 노출되어 키 재발급
- express 서버에 dotenv 사용하여 네이버apikey 숨김
- 네이버지도API 연동 오류 해결
  - Client Secret이 아니라 Client ID를 넣어야함
  - 서비스 URL 등록할 때 http://localhost 뒤에 포트 번호 적으면 안됌

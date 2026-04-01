# TW Delivery Zone App Starter

이 프로젝트는 업로드된 대만 파일을 바탕으로 만든 1차 스타터입니다.

## 포함 데이터
- `data/tw-villages-taipei-newtaipei.geojson`
  - 업로드한 `VILLAGE_NLSC_1150306.shp`를 바탕으로 타이베이/신베이만 추출
  - 각 village feature에 `postcode3` 속성을 추가
- `data/tw-postcode-centers.json`
  - 업로드한 `8.1 행정구역 중심점의 3자리 우편번호 및 위도 경도 표 (XML).txt`에서 변환
- `data/zones-tw.json`
  - 예시 구역 JSON

## 파일 설명
- `index.html`: 사용자 지도 페이지
- `admin.html`: 관리자 페이지
- `css/style.css`: 공통 스타일
- `js/app.js`: 지도 로직
- `js/admin.js`: 관리자 로직

## 사용 방법
1. GitHub 새 저장소 생성
2. 이 폴더의 파일을 모두 업로드
3. Mapbox Public Token 발급
4. GitHub Pages 활성화
5. 배포 주소로 접속 후 토큰 입력

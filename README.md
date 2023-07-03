# 들로네를 이용한 이미지 triangle 처리  
들로네 삼각형을 이용한 이미지 이펙트 만들어 보기

## 구현 요약
 - 이미지로드
 - 캔버스를 통해 이미지데이터 추출
 - 이미지 그레이스케일 변환 후 sobel필터를 적용해 외곽라인을 가진 이미지데이터(edgeImageData) 추출
 - edgeImageData에 컬러정보 중 외곽라인에 해당하는 좌표 추출
 - 그레이 스케일 정보를 바탕으로 추출된 좌표에 밀도 조정
 - d3-delaunay를 이용해 polygon으로 표현

## 프로젝트 설정
 - vite
 - react, typescript
 - leva 
  
## 동작샘플
![동작 샘플](./resource/sample.gif)


/**
 * 이미지 리사이즈 정보 반환 함수
 * @param w:number  가로 
 * @param h:number  세로
 * @param sw:number 스테이지 가로
 * @param sh:number 스테이지 세로
 * @returns {w, h} 리사이즈 적용된 가로, 세로 값을 가진 객체
 */
const getRatioSize = (w: number, h: number, sw: number, sh: number) => {
    const ratio = w > h ? sw / w : sh / h;
    return { w: (ratio * w), h: (ratio * h) };
}


/**
 * 리사이즈 스케일 비율 반환 함수
 * @param w:number  가로 
 * @param h:number  세로
 * @param sw:number 스테이지 가로
 * @param sh:number 스테이지 세로
 * @returns ratio 리사이즈 시 적용할 스케일 비율 값
 */
const getScaleRatio = (w: number, h: number, sw: number, sh: number) => {
    return (w > h ? sw / w : sh / h);
}

export { getScaleRatio };
export default getRatioSize;
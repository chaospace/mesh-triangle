import getRatioSize from "../src/utils/getRatioSize";
import mapValue from "../src/utils/mapValue";





describe("비례식을 이용한 이미지 리사이트 테스트", () => {
    it.skip("가로,세로 비율 테스트", () => {
        const w = 600;
        const h = 320;
        const sw = 1280;
        const sh = 768;
        /**
         * 원본 이미지에 비율을 먼저 가져와서 유지하며 화면에 맞춰보자.
         **/
        // const imageRatio = Math.min(h / w, w / h);
        // const screenRatio = Math.min(sw / sh, sh / sw);
        const xRatio = sw / w;
        const yRatio = sh / h;
        // 원본비율을 유지하려면 초기 비율을 보고 가로, 혹은 세로를 결정해야 한다.
        const ratio = (w > h) ? xRatio : yRatio;


        console.log('xRatio', w * ratio, 'yRatio', h * ratio);

        const info = getRatioSize(w, h, sw, sh);
        console.log(info);

    });

    it.skip('min, max를 이용한 비율 계산', () => {
        const min = -100;
        const max = 100;
        const range = max - min;
        console.log('range-', range);
        const value = 30;
        console.log('vv', (value - min));
        console.log('ratio', (value - min) / range);
    });

    it('mapValue-테스트', () => {
        const a = mapValue(10, 0, 100, 0, 1);
        console.log('a', a);
    });
});
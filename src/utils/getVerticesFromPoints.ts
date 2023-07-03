import { ObjType, PointArray } from "../types";


function addVertex(x: number, y: number, hash: any) {
    let key = `${x}|${y}`;
    if (!hash[key]) {
        hash[key] = { x, y };
    }
}


function getVerticesFromPoints(points: PointArray, maxPoints: number, accuracy: number, w: number, h: number) {

    // grid영역 만들기
    const hasMap: ObjType = {};

    const pointCount = Math.max(~~(maxPoints * (1 - accuracy)), 5);
    const columns = Math.round(Math.sqrt(pointCount));
    const rows = Math.ceil(pointCount / columns);



    const xInc = ~~(w / columns);
    const yInc = ~~(h / rows);

    console.log('columns', columns, 'rows', rows, 'xInc', xInc, 'yInc', yInc, 'w', w, 'h', h);

    let rowIndex = 0;
    let startX = 0;
    let x = 0;
    let y = 0;
    for (y = 0; y < h; y += yInc) {
        rowIndex++;
        startX = rowIndex % 2 === 0 ? ~~(xInc / 2) : 0;

        for (x = startX; x < w; x += xInc) {
            if (x < w && y < h) {
                addVertex(
                    ~~(x + Math.cos(y) * yInc),
                    ~~(y + Math.sin(x) * xInc),
                    hasMap
                );
            }
        }

    }

    // 이미지 외곽정보 추가
    addVertex(0, 0, hasMap);
    addVertex(w - 1, 0, hasMap);
    addVertex(w - 1, h - 1, hasMap);
    addVertex(0, h - 1, hasMap);

    // 나머지 포인트 추가처리
    const restPointCount = (maxPoints - Object.keys(hasMap).length);
    const restInc = ~~(points.length / restPointCount);

    if (maxPoints > 0 && restInc > 0) {
        for (let i = 0; i < restPointCount; i += restInc) {
            addVertex(points[i].x, points[i].y, hasMap);
        }
    }

    return Object.keys(hasMap).map(key => hasMap[key]);

}


export {
    addVertex,
    getVerticesFromPoints
}
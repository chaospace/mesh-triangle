import { PointArray } from "../types";

const MAX_POINT_NUM = 5000;
const interpolateEdgePoints = (edgePoints: PointArray, accuracy: number = .5) => {

    const edgePointsNum = edgePoints.length;
    let limit = ~~(edgePointsNum * accuracy);
    if (limit > MAX_POINT_NUM) limit = MAX_POINT_NUM;

    //포인트 보간
    let i = 0;
    let tlen = edgePointsNum;
    let points = [];
    while (i < limit && i < edgePointsNum) {
        const n = ~~(tlen * Math.random()) | 0;
        points.push(edgePoints[n]);
        edgePoints.splice(n, 1);
        tlen--;
        i++;
    }
    return points;
}


const getPolygonCentered = (polygons: PointArray) => {
    let x = 0;
    let y = 0;
    polygons.forEach(p => {
        x += p.x;
        y += p.y;
    });
    x *= .3333;
    y *= .3333;
    return { x, y };
}


export { getPolygonCentered, interpolateEdgePoints }

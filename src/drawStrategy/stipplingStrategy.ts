/**
 * 점묘법 효과
 * d3-delaunay를 이용해 중심점을 이미지 컬러값과 동기화 시킴.
 */

import { getColorByPos } from "@/utils/canvasHelper";
import { generatorConsumer } from "@/utils/generatoerHelper";
import { Delaunay, Voronoi } from "d3-delaunay";




const getPolygonCenteroid = (t: number[][]) => {
    for (var n, e, r = -1, i = t.length, o = 0, a = 0, u = t[i - 1], c = 0; ++r < i;)
        n = u,
            u = t[r],
            c += e = n[0] * u[1] - u[0] * n[1],
            o += (n[0] + u[0]) * e,
            a += (n[1] + u[1]) * e;
    return [o / (c *= 3), a / c]
}


function* stipplingPointProducer(points:Float64Array, imageData:ImageData, colorWeights:Float64Array) {

    const {width, height} = imageData;
    const delaunay = new Delaunay(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    const weights = new Float64Array(points.length/2);
    const targetPoints = new Float64Array(points.length);
    yield voronoi;
    const half=.5;
    const repeat = 160;
    for(let k=0; k<repeat; k++){
        weights.fill(0);
        targetPoints.fill(0);
        for (let y = 0, i = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pIndex = y * width + x;
                const w = colorWeights[pIndex];
                i = delaunay.find(x + half, y + half, i);
                weights[i] += w;
                targetPoints[i * 2] += w * (x + half);
                targetPoints[i * 2 + 1] += w * (y + half);
            }
        }
        const sp = 0.8;
        let ps = delaunay.points as Float64Array;
        const e = Math.pow(k + 1, -0.8) * 10;
        for (let i = 0; i < ps.length; i++) {
            const ra = (Math.random() - .5) * e;
            const x0 = ps[i * 2];
            const y0 = ps[i * 2 + 1];
            const c = weights[i];
            const tx = weights[i] ? targetPoints[i * 2] / c : x0;
            const ty = weights[i] ? targetPoints[i * 2 + 1] / c : y0;
            ps[i * 2] = x0 + (tx - x0) * sp + ra;
            ps[i * 2 + 1] = y0 + (ty - y0) * sp + ra;
        }
        voronoi.update();
        yield voronoi;
    }

}


const transformCenteroid = generatorConsumer(function*(ctx:CanvasRenderingContext2D, imageData:ImageData){

    try{
        while(true){
            const voronoi = yield;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            for( let cells of (voronoi as Voronoi<number>).cellPolygons() ){
                const [cx, cy] = getPolygonCenteroid(cells);
                ctx.beginPath();
                ctx.moveTo(cells[0][0], cells[0][1]);
                for(let i=1; i<cells.length; i++){
                    ctx.lineTo(cells[i][0], cells[i][1]);
                }
                const c = getColorByPos(imageData, ~~cx, ~~cy);
                ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`;
                ctx.strokeStyle = `rgb(${c.r},${c.g},${c.b})`;
                ctx.stroke();
                ctx.fill();
                ctx.closePath();

            }
        }
    } finally {
        console.log('DONE') //end of stream;
    }

} as GeneratorFunction );



export {
    stipplingPointProducer,
    getPolygonCenteroid,
    transformCenteroid
}
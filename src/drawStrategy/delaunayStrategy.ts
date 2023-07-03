import Delaunay from "@/triangles/Delaunay";
import { interpolateEdgePoints } from "@/triangles/delaunayHelper";
import { getEdgePoints, getGrayScaleData } from "@/utils/canvasHelper"
import { getScaleRatio } from "@/utils/getRatioSize";
import stackBlur from "@/utils/stackBlur"





const initialize = (ctx: CanvasRenderingContext2D, imageData: ImageData) => {

    const w = imageData.width;
    const h = imageData.height;
    const grayImageData = getGrayScaleData(stackBlur(imageData, w, h, 2));
    const edgePoints = interpolateEdgePoints(getEdgePoints(grayImageData, 120), .6);
    const triangles = Delaunay.from(w, h).insert(edgePoints).getTriangles();

    const scale = getScaleRatio(w, h, window.innerWidth, window.innerHeight);
    ctx.scale(scale, scale);

    const render = () => {
        ctx.clearRect(0, 0, w, h);
        for (let t of triangles) {
            ctx.beginPath();
            ctx.moveTo(t.nodes[0].x, t.nodes[0].y);
            ctx.lineTo(t.nodes[1].x, t.nodes[1].y);
            ctx.lineTo(t.nodes[2].x, t.nodes[2].y);
            ctx.strokeStyle = 'black';
            ctx.stroke();
            ctx.closePath();
        }
    }
    render();
    return render;
}

// 포인트에 크기를 컬러값으로 정하고 
// 각 포인트 간에 거리를 유지시키게 조정.





export {
    initialize
}
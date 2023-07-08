import { getColorByPos } from "@/utils/canvasHelper";
import { PointArray } from "@/types";
import Delaunay, { Triangle } from "@/triangles/Delaunay";
import { generatorConsumer } from "@/utils/generatoerHelper";

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


function* trianglePolygonProducer(edges:PointArray, boundary:{w:number,h:number}) {
    let i=1;
    const d = Delaunay.from(boundary.w, boundary.h);
    while(i<edges.length) {
        const sample = edges.slice(0, i);
        yield d.insert(sample).getTriangles();
        i=i<<1;
    }
}



const triangleConsumer = generatorConsumer(function* (receiver:Generator, imageData:ImageData){
    try{
        while(true){
            let triangles = yield;
            for(let triangle of triangles as Triangle[]){
                const {x, y} = getPolygonCentered(triangle.nodes);
                const color = getColorByPos( imageData, ~~x, ~~y );
                const [p0, p1, p2] = triangle.nodes;
                receiver.next({color:`rgb(${color.r},${color.g},${color.b})`, p0, p1, p2, circle:triangle.circle});
            }
            
        }
    } finally { 
        
        receiver.return(null);
    }
} as GeneratorFunction);

const drawDelaunayConsumer = generatorConsumer(function* (ctx:CanvasRenderingContext2D, {isFill, showCircle}:any){
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    try{
        while(true){
            const info = yield;
            const {color, p0, p1, p2, circle} = info as any;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p0.x, p0.y);
            ctx.strokeStyle = color;
            if(isFill){
                ctx.fillStyle=color;
                ctx.fill();
            }
            ctx.stroke();
            ctx.closePath();
            if(showCircle){
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, circle.radiusSq, 0, Math.PI*2 );
                ctx.strokeStyle=`rgba(255,0,0,.2)`;
                ctx.stroke();
                ctx.closePath();   
            }
        }
    }finally {
        console.log('DONE!!!');
    }
} as GeneratorFunction);



export { getPolygonCentered, interpolateEdgePoints, trianglePolygonProducer , drawDelaunayConsumer, triangleConsumer }

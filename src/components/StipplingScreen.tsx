import useWatch from "@/hooks/useWatch";
import { getPolygonCentered } from "@/triangles/delaunayHelper";
import { calculateImageColorData, getColorByPos, getImageData, getImageDataIndex } from "@/utils/canvasHelper";
import getImageFromFile from "@/utils/getImageFromFile";
import { getScaleRatio } from "@/utils/getRatioSize";
import stackBlur from "@/utils/stackBlur";
import { Delaunay } from "d3-delaunay";
import { useControls } from "leva";
import { useEffect, useMemo, useRef, useState } from "react";

type CanvasProps = {
    width?: number,
    height?: number,
    source: string | File
}

type ImageDataState = {
    origin?:ImageData;
    colorWeights?:Float64Array;
}

const polygonCenteroid = (t: number[][]) => {
    for (var n, e, r = -1, i = t.length, o = 0, a = 0, u = t[i - 1], c = 0; ++r < i;)
        n = u,
            u = t[r],
            c += e = n[0] * u[1] - u[0] * n[1],
            o += (n[0] + u[0]) * e,
            a += (n[1] + u[1]) * e;
    return [o / (c *= 3), a / c]
}

function StipplingCanvas({ source, width = 400, height = 400 }: CanvasProps) {
    
    const ref = useRef<HTMLCanvasElement|null>(null);
    const [imageDataState, setImageStateData] = useState<ImageDataState>({});
    
    const {pointPrecision, colorThreshold} = useControls({
        pointPrecision:{
            value:.1,
            step:.1,
            min:.1,
            max:1
        },
        colorThreshold:{
            value:.5,
            min:.1,
            max:1,
            step:.1
        }
    });


    const edgePoints = useMemo(()=>{
        
        const {colorWeights, origin} = imageDataState;
        let points = undefined;
        if(origin && colorWeights){
            const {width, height} = origin;
            const total = width*height;
            const maxPoint = ~~((total* pointPrecision)/20);
            points = new Float64Array(maxPoint*2);
            let i=0;
            while(i<maxPoint){
                const x = Math.random() * width;
                const y = Math.random() * height;
                const idx = getImageDataIndex(x, y, width);
                const weight = colorWeights[idx];
                if (weight === undefined) {
                    throw new Error('오류 인덱스!');
                }
                if(weight > colorThreshold){
                    points[i*2] = x;
                    points[i*2+1]= y;
                }
                i++;
            }
        }
        return points;

    }, [imageDataState, pointPrecision, colorThreshold]);


    useEffect(()=>{
        const {origin, colorWeights} = imageDataState;
        if(edgePoints && origin && colorWeights ){
            const ctx = ref.current?.getContext('2d', {willReadFrequently:true})!;
            ctx.putImageData(origin, 0, 0);
            const delaunay = new Delaunay(edgePoints);
            const voronoi = delaunay.voronoi([0, 0, origin.width, origin.height]);
            const weights = new Float64Array(edgePoints.length/2);
            const targetPoints = new Float64Array(edgePoints.length);
            // 이미지 컬러 가중치 적용처리
            const half = .5;
            for (let k = 0; k < 80; k++) {

                weights.fill(0);
                targetPoints.fill(0);
                const e = Math.pow(k + 1, -0.8) * 10;
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

                // ctx.beginPath();
                // ctx.fillStyle = 'black';
                // ctx.fillRect(0, 0, width, height);
                // ctx.closePath();

                const sp = 1.2;
                let ps = delaunay.points as Float64Array;
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
                // delaunay.update();
            }
            // voronoi.update();
            //
            ctx.clearRect(0, 0, origin.width, origin.height);
            ctx.putImageData(origin, 0, 0);
            for( let cells of voronoi.cellPolygons() ){
                const [cx, cy] = polygonCenteroid(cells);
                ctx.beginPath();
                ctx.fillStyle='white';
                ctx.arc(cx, cy, 1, 0, Math.PI*2);
                ctx.fill();
                ctx.closePath();
                // ctx.beginPath();
                // ctx.moveTo(cells[0][0], cells[0][1]);
                // for(let i=1; i<cells.length; i++){
                //     ctx.lineTo(cells[i][0], cells[i][1]);
                // }
                // const color = getColorByPos(origin, ~~cx, ~~cy);
                // ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
                // ctx.fill();
                // ctx.closePath();
            }
        }
        
    },[edgePoints, imageDataState]);

    useWatch(async()=>{
        const ctx = ref.current?.getContext('2d', {willReadFrequently:true})!;
        const image = await getImageFromFile(source);
        const imageData = getImageData(image);
        // 이미지에 컬러평균값 추출
        const colorWeights = calculateImageColorData(stackBlur(imageData, imageData.width, imageData.height, 2));
        const scale = getScaleRatio(imageData.width, imageData.height, window.innerWidth, window.innerHeight);
        ctx.canvas.width = (image.width*scale); 
        ctx.canvas.height = (image.height*scale);
        ctx.scale(scale, scale);
        setImageStateData({
            origin:imageData,
            colorWeights
        });

    },[source])

    return (
        <canvas ref={ref} width={width} height={height} />
    )
}


export default StipplingCanvas;
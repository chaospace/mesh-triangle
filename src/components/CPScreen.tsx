import { DependencyList, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useWatch from "@/hooks/useWatch";
import getImageFromFile from "@/utils/getImageFromFile";
import { adjustPointCount, calculateImageColorData, getColorByPos, getEdgePoints, getGrayScaleData, getGridInfo, getImageData, getSobelImageData } from "@/utils/canvasHelper";
import getRatioSize, { getScaleRatio } from "../utils/getRatioSize";
import stackBlur from "@/utils/stackBlur";
import { PointArray, PointLike } from "@/types";
// import { Delaunay } from "d3-delaunay";
import Delaunay, { Triangle } from "@/triangles/Delaunay";
import { useControls } from "leva";
import useForceUpdate from "@/hooks/useForceUpdate";
import useRender from "@/hooks/useRender";
import { drawDelaunayConsumer, generatorBinder, getPolygonCentered, interpolateEdgePoints, renderDelaunay, triangleConsumer, trianglePolygons } from "@/triangles/delaunayHelper";

type CanvasProps = {
    width?: number,
    height?: number,
    source: string | File
}

// const worker = new ImageWorker();

interface ICanvas {
    getContext(): CanvasRenderingContext2D;
    draw(imageSource: CanvasImageSource): void;
    getImageData(): ImageData;
    clear(): void
}

const drawArc = (ctx: CanvasRenderingContext2D, p: PointLike) => {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,255,0,1)';
    ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

const getGridPos = (x: number, y: number, cellSize = 10) => {
    return { x: x * cellSize, y: y * cellSize };
}

const getGridIndex = (x: number, y: number, cellSize = 10) => {
    return {
        x: Math.round(x / cellSize),
        y: Math.round(y / cellSize)
    }
}


const getGridPixelIndex = (p: PointLike, columns: number) => {
    return (Math.round(p.y) * columns + Math.round(p.x));
}

const randomPos = (w: number, h: number) => {
    return {
        x: Math.random() * w,
        y: Math.random() * h,
    }
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


const W = 400;
const H = 400;

type EffectImageParams = {
    originData: ImageData;
    grayImageData: ImageData;
    edgeImageData: ImageData;
    colorWeights: Float64Array;
}

type EffectParams = { threshold: number, pointDensity: number, animate: boolean, isTriangle: boolean, isFill: boolean, isOverride: boolean };

type EffectConfig = {
    w: number,
    h: number
}

/**
 * 이펙트 처리에 필요한 상태정리
 * imageData
 *  - grayscaleImageData
 *  - edgeImageData
 *  - imageColorWeights
 * 
 * filterParams - leva에서 동적제어 즉 외부에서 참조되는 값.
 *  - blur
 *  - pointDensity
 *  - threshold
 * 
 * points       - 결과로 만들어지는 포인트
 */
const getImageDataIndex = (x: number, y: number, w: number) => {
    return ~~(y) * w + ~~(x);
}

const updatePoint = (source: EffectImageParams, { threshold, pointDensity }: EffectParams) => {

    const { width, height } = source.originData;
    const total = width * height;
    const maxPoint = ~~((pointDensity * total) / 20);
    const { colorWeights } = source;
    let i = 0;
    const edgePoints = new Float64Array(maxPoint * 2);
    // edgePoints.set([1, 1], i++);
    // edgePoints.set([width - 1, 1], i++);
    // edgePoints.set([width - 1, height - 1], i++);
    // edgePoints.set([1, height - 1], i++);
    while (i < maxPoint) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const idx = getImageDataIndex(x, y, width);
        const weight = colorWeights[idx];
        if (weight === undefined) {
            throw new Error('오류 인덱스!');
        }
        if (threshold < weight) {
            edgePoints[i * 2] = x;
            edgePoints[i * 2 + 1] = y;
            i++;
        }
    }

    return edgePoints;
};

const getEdgePoint = (source:{originData:ImageData, colorWeights:Float64Array}, { threshold, pointDensity }:{threshold:number, pointDensity:number}) => {

    const { width, height } = source.originData;
    const total = width * height;
    const maxPoint = ~~((pointDensity * total) / 20);
    const { colorWeights } = source;
    let i = 0;
    const edgePoints = new Float64Array(maxPoint * 2);
    // edgePoints.set([1, 1], i++);
    // edgePoints.set([width - 1, 1], i++);
    // edgePoints.set([width - 1, height - 1], i++);
    // edgePoints.set([1, height - 1], i++);
    while (i < maxPoint) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const idx = getImageDataIndex(x, y, width);
        const weight = colorWeights[idx];
        if (weight === undefined) {
            throw new Error('오류 인덱스!');
        }
        if (threshold < weight) {
            edgePoints[i * 2] = x;
            edgePoints[i * 2 + 1] = y;
            i++;
        }
    }

    return edgePoints;
};

/**
 * 델루네 효과를 발생시키는 주요 속성은 어떤 것일까?
 * image, points, threshold, pointDensity, blur <-  이중 하나라도 변경되면 다시 그려야 한다.
 * 그렇지만 변경에 영향을 미치는 요소 안에서도 우선순위가 정해져야 한다.
 * image <- 가 변경되면 이미지 데이터 갱신 필요.
 * blurx <- 이미지 데이터 갱신 필요.
 * pointDensity, threshold <- 포인트를 다시 구해야 함.
 * points <- 그리기만 다시 수행. 
 * @param config 
 * @param depParams 
 * @returns 
 */
// 이펙트 처리 함수를 하나로 만들어 훅으로 관리할 수 있을까?
/*
function useCanvasEffect(config: EffectConfig, depParams: EffectParams) {

    const _ref = useRef<CanvasRenderingContext2D>();
    const [_imageData, setImageData] = useState<EffectImageParams>();

    // 2dcontext 설정
    const setRef = useCallback((node: HTMLCanvasElement) => {
        if (node !== null && !_ref.current) {
            _ref.current = node.getContext('2d', { willReadFrequeantly: true })! as CanvasRenderingContext2D;
        }
    }, []);

    
    const setup = useCallback((image: HTMLImageElement) => {
        if (_ref.current) {
            let { w, h } = getRatioSize(image.width, image.height, config.w, config.h);
            w = ~~(w);
            h = ~~(h);
            _ref.current.canvas.width = w;
            _ref.current.canvas.height = h;
            _ref.current.drawImage(image, 0, 0, w, h);
            const originData = _ref.current.getImageData(0, 0, w, h);
            const grayImageData = stackBlur(getGrayScaleData(originData), originData.width, originData.height, 2);
            const edgeImageData = getSobelImageData(grayImageData);
            const colorWeights = calculateImageColorData(grayImageData);
            _ref.current.putImageData(edgeImageData, 0, 0);
            setImageData({
                originData,
                grayImageData,
                edgeImageData,
                colorWeights
            })
        }
    }, []);



    const registerParamHandler = useCallback((param: EffectParams, handler: (params: EffectParams) => void) => {
        useWatch(() => {
            handler({ ...param });
        }, Object.values(param));
    }, []);

    const _points = useMemo(() => {
        if (_imageData) {
            console.log('포인트갱신');
            return updatePoint(_imageData, depParams);
        }
        return undefined;
    }, [_imageData, depParams.pointDensity, depParams.threshold]);


    useEffect(() => {
        let animateID = -1;

        if (_points && _imageData && _ref.current) {
            const { width, height } = _ref.current.canvas;
            if (!depParams.animate) {
                _ref.current.clearRect(0, 0, width, height);
                _ref.current.putImageData(_imageData.edgeImageData, 0, 0);
                for (let i = 0; i < _points.length / 2; i++) {
                    _ref.current.beginPath();
                    _ref.current.fillStyle = 'green';
                    _ref.current.arc(_points[i * 2], _points[i * 2 + 1], 1, 0, Math.PI * 2);
                    _ref.current.fill();
                    _ref.current.closePath();
                }
                return;
            }
            const weights = new Float64Array(_points.length / 2);
            const targetPoints = new Float64Array(_points.length);

            const { colorWeights, originData } = _imageData;

            // 맥스 포인트 참조.
            let step = 2;
            const _progress = () => {
                const delaunay = new Delaunay(_points.slice(0, step));
                const voronoi = delaunay.voronoi([0, 0, width, height]);
                delaunay.update();

                const half = 1;
                for (let k = 0; k < 1; k++) {

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

                    _ref.current!.beginPath();
                    _ref.current!.fillStyle = 'black';
                    _ref.current!.fillRect(0, 0, width, height);
                    _ref.current!.closePath();

                    const sp = 1.2;
                    let ps = delaunay.points as Float64Array;
                    for (let i = 0; i < step; i++) {
                        const ra = 0;//(Math.random() - .5) * e;
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

                //triangle로 
                let polygons = depParams.isTriangle ? delaunay.trianglePolygons() : voronoi.cellPolygons();
                for (let cell of polygons) {
                    const [cx, cy] = polygonCenteroid(cell);
                    _ref.current!.beginPath();
                    const idx = getGridPixelIndex({ x: cx, y: cy }, width) * 4;
                    const r = originData.data[idx];
                    const g = originData.data[idx + 1];
                    const b = originData.data[idx + 2];
                    _ref.current!.fillStyle = `rgb(${r},${g},${b})`;
                    _ref.current!.beginPath();
                    // _ref.current!.strokeStyle = `rgb(${r},${g},${b})`;
                    _ref.current!.strokeStyle = `#ff000011`;
                    _ref.current!.moveTo(cell[0][0], cell[0][1]);
                    for (let j = 1; j < cell.length; j++) {
                        _ref.current!.lineTo(cell[j][0], cell[j][1]);
                    }
                    _ref.current!.stroke();
                    if (depParams.isFill) {
                        _ref.current!.fill();
                    }
                    _ref.current!.closePath();
                }
                // _ref.current!.beginPath();
                // _ref.current!.fillStyle = 'green';
                // delaunay.renderPoints(_ref.current!);
                // _ref.current!.fill();
                // _ref.current!.closePath();
                if (depParams.isOverride) {
                    polygons = depParams.isTriangle ? voronoi.cellPolygons() : delaunay.trianglePolygons();
                    for (let cell of polygons) {
                        // const [cx, cy] = polygonCenteroid(cell);
                        _ref.current!.beginPath();
                        // const idx = getGridPixelIndex({ x: cx, y: cy }, width) * 4;
                        // const r = originData.data[idx];
                        // const g = originData.data[idx + 1];
                        // const b = originData.data[idx + 2];
                        _ref.current!.beginPath();
                        _ref.current!.strokeStyle = `#ffffff11`;
                        _ref.current!.moveTo(cell[0][0], cell[0][1]);
                        for (let j = 1; j < cell.length; j++) {
                            _ref.current!.lineTo(cell[j][0], cell[j][1]);
                        }
                        _ref.current!.stroke();
                        _ref.current!.closePath();
                    }
                }
      
                if (step < _points.length) {
                    step = step << 1;
                    animateID = window.setTimeout(_progress, 200);
                } else if (step > _points.length) {
                    step = _points.length;
                    _progress();
                }
            }
            _progress();
        }
        return () => {
            console.log('이전 진행제거', animateID);
            clearTimeout(animateID);
        }
    }, [_points, _imageData, depParams.animate, depParams.isTriangle, depParams.isFill, depParams.isOverride]);




    return {
        ref: setRef,
        setup,
        registerParamHandler
    }
}

*/





function CPScreen({ source, width = 400, height = 400 }: CanvasProps) {


    const { pointDensity, threshold,  showCircle, isFill } = useControls({
        pointDensity: {
            value: 0.5,
            min: 0,
            max: 1,
            step: .1
        },
        threshold: {
            value: .6,
            min: .1,
            max: .8,
            step: .1
        },
        showCircle: false,
        isFill: false
    });

    const ref = useRef<HTMLCanvasElement|null>(null);
    const [imageData, setImageData] = useState<{origin:ImageData, edges:ImageData}|null>(null);
    // const { ref, setup } = useCanvasEffect({ w: W, h: H }, { pointDensity, threshold, animate, isTriangle, isFill, isOverride });

    useRender(() => {
        console.log('draw-re--screen');
    });




    const edgePoints = useMemo(()=>{
        return imageData?.edges ? interpolateEdgePoints( getEdgePoints(imageData?.edges, threshold*255), pointDensity) : null;
    },
    [imageData?.edges, threshold, pointDensity]);


    useEffect(()=>{
        const origin = imageData?.origin;
        let generator:Generator|null = null;
        if(origin && edgePoints){
            const ctx = ref.current?.getContext('2d', {willReadFrequently:true})!;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            generator = trianglePolygons(edgePoints, {w:origin.width, h:origin.height});
            const drawGenerator = drawDelaunayConsumer(ctx, {isFill, showCircle});
            const consumer = triangleConsumer(drawGenerator, origin);
            generatorBinder(generator, consumer, 200);
        }
        return ()=>{
            if(generator){
                generator.return(null);
            }
        }
    }, [imageData?.origin, edgePoints, showCircle, isFill])


    useWatch(async () => {
        const ctx = ref.current?.getContext('2d', {willReadFrequently:true});
        const image = await getImageFromFile(source) as HTMLImageElement;
        const scale = getScaleRatio(image.width, image.height, window.innerWidth, window.innerHeight);
        ctx!.canvas.width = ~~(image.width*scale);
        ctx!.canvas.height = ~~(image.height*scale);
        ctx!.scale(scale, scale);
        const imageData = getImageData(image);
        const blurImageData = stackBlur(imageData, imageData.width, imageData.height, 2);
        const edgeImageData = getSobelImageData(blurImageData);
        setImageData({
            origin:imageData,
            edges :edgeImageData
        });
    }, [source]);

    return (
        <>
            <canvas ref={ ref } width={ width } height={ height } />
        </>
    )
};




export type {
    ICanvas,
    CanvasProps
}
export default CPScreen;
import Delaunay from "../triangles/Delaunay";
import { interpolateEdgePoints } from "@/drawStrategy/delaunayStrategy";
import { PointArray, PointLike } from "../types";
import stackBlur from "./stackBlur";

type DrawSource = Exclude<CanvasImageSource, VideoFrame | HTMLVideoElement>;
type ColorLike = { r: number, g: number, b: number };

/**
 * 
 * @param imageData:ImageData imageData 정보
 * @param x:number imageData 가로 인덱스 정보
 * @param y:number imageDAta 세로 인덱스 정보
 * @returns {r:number, g:number, b:number, a:number } 해당위치에 rgba 값
 */
const getColorByPos = (imageData: ImageData, x: number, y: number) => {
    const idx = (y * imageData.width + x) << 2;
    const r = imageData.data[idx];
    const g = imageData.data[idx + 1];
    const b = imageData.data[idx + 2];
    const a = imageData.data[idx + 3];
    return { r, g, b, a };
}

const drawGridLine = (ctx: CanvasRenderingContext2D, w: number, h: number, cellSize: number = 10) => {
    const columns = Math.ceil(w / cellSize);
    const rows = Math.ceil(h / cellSize);
    ctx.save();
    ctx.strokeStyle = 'red';
    for (let i = 0; i < rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(w, i * cellSize);
        ctx.stroke();
        ctx.closePath();
    }
    for (let i = 0; i < columns; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, h);
        ctx.stroke();
        ctx.closePath();
    }
    ctx.restore();
}

const adjustPointCount = (source:PointLike[], precision = .5) => {
    const max = source.length;
    let i=0;
    let limit = ~~(max*precision);
    let tMax = max;
    let temp = source.concat();
    console.log('max', max, 'limit', limit);
    const results =[];
    while(i<limit && i<max) {
        let idx = ~~(tMax*Math.random());
        results.push(temp[idx]);
        temp.splice(idx,1);
        tMax--;
        i++;
    }
    return results;
}

const createContextRef = (ctx: CanvasRenderingContext2D) => {

    return {
        drawGridLine: (w: number, h: number, cellSize: number = 10) => drawGridLine(ctx, w, h, cellSize)
    }
}

/**
 * imageData에 rgba접근을 위한 인덱스 정보 반환
 * @param x : x위치
 * @param y : y위치
 * @param w : imageData에 width값
 * @returns x, y, w정보에 기반한 인덱스 값
 */
const getImageDataIndex = (x: number, y: number, w: number) => {
    return ~~(y) * w + ~~(x);
}

const getGridInfo = (w: number, h: number, cellSize = 10) => {
    const columns = Math.ceil(w / cellSize);
    const rows = Math.ceil(h / cellSize);
    const edges = [];
    for (let i = 0; i < rows; i++) {
        edges.push([{ x: 0, y: i * cellSize }, { x: w, y: i * cellSize }]);
    }
    for (let i = 0; i < columns; i++) {
        edges.push([{ x: i * cellSize, y: 0 }, { x: i * cellSize, y: h }]);
    }


    return { columns, rows, edges };
}


/**
 * imageData로 전달된 컬러 정보를 그레이컬러로 변경해 반환
 * @param imageData 
 * @returns grayImageData:ImageData 회색컬러로 변경된 이미지 데이터 
 */
const getGrayScaleData = (imageData: ImageData) => {
    const grayImageData = new ImageData(imageData.width, imageData.height);
    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
            const idx = (y * imageData.width + x) << 2;
            const r = imageData.data[idx];
            const g = imageData.data[idx + 1];
            const b = imageData.data[idx + 2];
            const gray = r * .34 + g * .5 + b * .16;

            grayImageData.data[idx] = gray;
            grayImageData.data[idx + 1] = gray;
            grayImageData.data[idx + 2] = gray;
            grayImageData.data[idx + 3] = 255;
        }
    }

    return grayImageData;
}

/**
 * sobel필터 적용 함수
 * @param source:ImageData 이미지 데이터
 * @returns newImageData;
 */
const getSobelImageData = (source: ImageData) => {
    const grayscaleData = getGrayScaleData(source);
    const sobelData = new ImageData(grayscaleData.width, grayscaleData.height);
    const width = source.width;
    const height = source.height;

    // Sobel 필터 적용
    const sobelX = [
        -1, 0, 1,
        -2, 0, 2,
        -1, 0, 1
    ];

    const sobelY = [
        -1, -2, -1,
        0, 0, 0,
        1, 2, 1
    ];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gradientX = 0;
            let gradientY = 0;

            for (let j = -1; j <= 1; j++) {
                for (let i = -1; i <= 1; i++) {
                    const pixelIndex = (y + j) * width + (x + i);
                    const grayscale = grayscaleData.data[pixelIndex * 4];
                    gradientX += grayscale * sobelX[(j + 1) * 3 + (i + 1)];
                    gradientY += grayscale * sobelY[(j + 1) * 3 + (i + 1)];
                }
            }

            const gradientMagnitude = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
            const index = (y * width + x) * 4;
            sobelData.data[index] = gradientMagnitude;
            sobelData.data[index + 1] = gradientMagnitude;
            sobelData.data[index + 2] = gradientMagnitude;
            sobelData.data[index + 3] = 255;
        }
    }
    return sobelData;
}


const getEdgePoints = (imageData: ImageData, threshold = 50) => {

    const multiplier = 2;
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    const points: PointArray = [];
    let x, y, row, col, sx, sy, step, sum, total;

    for (y = 0; y < h; y += multiplier) {
        for (x = 0; x < w; x += multiplier) {
            sum = total = 0;

            for (row = -1; row <= 1; row++) {
                sy = y + row;
                step = sy * w;

                if (sy >= 0 && sy < h) {
                    for (col = -1; col <= 1; col++) {
                        sx = x + col;
                        if (sx >= 0 && sx < w) {
                            // 4를 곱해 자리수 맞춤.
                            sum += data[(step + sx) << 2];
                            total++;
                        }
                    }
                }
            }

            if (total) {
                sum !== total;
            }

            if (sum > threshold) {
                points.push({ x, y });
            }

        }
    }
    return points;
}

const getRGBFromInt = (num: number) => {
    let b = num & 0xFF;
    let g = (num & 0xFF00) >>> 8;
    let r = (num & 0xFF0000) >>> 16;
    let a = ((num & 0xFF000000) >>> 24) / 255;
    return [r, g, b, a];
}

const imageDataTotDrawSource = (source: ImageData) => {
    const origin = new OffscreenCanvas(source.width, source.height);
    origin.getContext('2d')?.putImageData(source, 0, 0);
    return origin;
}

const getImageData = (source: HTMLImageElement) => {
    let w = source.width;
    let h = source.height;
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(source, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
}

const drawGridEdgeLine = (ctx: CanvasRenderingContext2D, edges: PointLike[][]) => {
    for (let edge of edges) {
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.moveTo(edge[0].x, edge[0].y);
        ctx.lineTo(edge[1].x, edge[1].y);
        ctx.stroke();
        ctx.closePath();
    }
}

const getAverageColor = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, cellSize = 10) => {
    const imageData = ctx.getImageData(x, y, cellSize, cellSize);
    const color = { r: 0, g: 0, b: 0 }
    const max = imageData.data.length / 4;
    for (let i = 0; i < max; i++) {
        const idx = (i * 4);
        color.r += imageData.data[idx];
        color.g += imageData.data[idx + 1];
        color.b += imageData.data[idx + 2];
    }
    color.r = (color.r / max);
    color.g = (color.g / max);
    color.b = (color.b / max);
    return { ...color };
}

const getGrayColorFromRGB = ({ r, g, b }: ColorLike) => {
    return r * .34 + g * .5 + b * .16;
}

const getCropImageData = (source: HTMLImageElement, clipArea: { x: number, y: number, w: number, h: number }) => {
    const canvas = new OffscreenCanvas(clipArea.w, clipArea.h);
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(source, clipArea.x, clipArea.y, clipArea.w, clipArea.y);
    return ctx?.getImageData(0, 0, clipArea.w, clipArea.h);
}

const calculateImageColorData = (imageData: ImageData, reverse: boolean = false) => {
    const { width, height } = imageData;
    const data = imageData.data;
    const chachedColor = new Float64Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;
            const e = brightness / 255;
            chachedColor[~~(idx / 4)] = reverse ? 1 - e : e;
        }
    }
    return chachedColor;
}

const getPointsByImageColorWeights = (colorInfo: number[], w: number, h: number, maxCount = 1000) => {

    const points = [];
    const threshold = .4;
    while (points.length < maxCount) {
        const x = ~~(Math.random() * w);
        const y = ~~(Math.random() * h);
        const idx = y * w + x;
        if (colorInfo[idx] > threshold) {
            points.push({
                x, y
            });
        }
    }

}


/**
 * 
 * @param imageData 
 */
const cloneImageData = (imageSource: ImageData) => {
    return new ImageData(new Uint8ClampedArray(imageSource.data), imageSource.width, imageSource.height);
}

class CanvasInstance {
    canvas: HTMLCanvasElement;
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    get context() {
        return this.canvas.getContext('2d', { willReadFrequently: true })!;
    }

    setSize(w: number, h: number) {
        this.canvas.width = w;
        this.canvas.height = h;
    }

    draw(source: DrawSource, x: number, y: number, w: number, h: number) {
        this.setSize(w || Number(source.width), h || Number(source.height));
        this.context.drawImage(source, x || 0, y || 0, this.canvas.width, this.canvas.height);
        const colorData = cloneImageData(this.imageData);
        const edgeImageData = getSobelImageData(stackBlur(this.imageData, w, h, 4));
        const edgePoints = interpolateEdgePoints(getEdgePoints(edgeImageData, 200));
        const triangles = Delaunay.from(w, h).insert(edgePoints).getTriangles();
        for (let t of triangles) {
            const p0 = t.nodes[0];
            const p1 = t.nodes[1];
            const p2 = t.nodes[2];
            const cx = ~~((p0.x + p1.x + p2.x) * .3333);
            const cy = ~~((p0.y + p1.y + p2.y) * .3333);
            const idx = (cy * w + cx) << 2;
            const color = `rgb(${colorData.data[idx]},${colorData.data[idx + 1]},${colorData.data[idx + 2]})`;
            this.context.beginPath();
            this.context.fillStyle = color;
            this.context.moveTo(p0.x, p0.y);
            this.context.lineTo(p1.x, p1.y);
            this.context.lineTo(p2.x, p2.y);
            this.context.fill();
            this.context.closePath();
        }

    }

    set imageData(newData) {
        this.context.putImageData(newData, 0, 0);
    }

    get imageData() {
        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

}

export { CanvasInstance, adjustPointCount, getImageDataIndex, drawGridEdgeLine, getGrayColorFromRGB, getAverageColor, getGridInfo, createContextRef, getPointsByImageColorWeights, imageDataTotDrawSource, getRGBFromInt, calculateImageColorData, getCropImageData, getImageData, getColorByPos, getGrayScaleData, cloneImageData, getEdgePoints, getSobelImageData };
export type { DrawSource };
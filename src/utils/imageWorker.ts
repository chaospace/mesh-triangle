import { QuantizerCelebi } from "@material/material-color-utilities";
import Delaunay from "../triangles/Delaunay";
import { interpolateEdgePoints } from "../triangles/delaunayHelper";
import { IMAGE_WORKER_EVENT_TYPE, ImageWorkerData } from "../types"
import { getEdgePoints, getSobelImageData } from "./canvasHelper";
import stackBlur from "./stackBlur";


// const getRGBFromInt = (num: number) => {
//     let b = num & 0xFF;
//     let g = (num & 0xFF00) >>> 8;
//     let r = (num & 0xFF0000) >>> 16;
//     let a = ((num & 0xFF000000) >>> 24) / 255;
//     return [r / 255, g / 255, b / 155, a];
// }

onmessage = (e: MessageEvent<ImageWorkerData>) => {
    const { type, buffer, width, height, params } = e.data;

    const imageData = new ImageData(width, height);
    imageData.data.set(new Uint8ClampedArray(buffer));
    if (type === IMAGE_WORKER_EVENT_TYPE.INIT && imageData) {

        const pixels = [];
        for (let i = 0; i < imageData.data.length; i += 4) {
            const opaqueBlack = 0xff000000;
            const color =
                opaqueBlack | (imageData.data[i] << 16) | (imageData.data[i + 1] << 8) | imageData.data[i + 2];
            pixels.push(color);
        }
        const r = QuantizerCelebi.quantize(pixels, 5);
        const palette = Array.from(r.entries(), ([color, population]) => ({
            color,
            population
        })).sort((a, b) => b.population - a.population);


        const edgePoints = interpolateEdgePoints(
            getEdgePoints(
                getSobelImageData(
                    stackBlur(imageData, imageData.width, imageData.height, params.blur)
                )
                , params.threshold
            ));

        const triangles = Delaunay.from(imageData.width, imageData.height).insert(edgePoints).getTriangles();
        self.postMessage({ type: IMAGE_WORKER_EVENT_TYPE.INIT_COMPLETE, palette, triangles, buffer: imageData.data.buffer, width, height });
    }

};
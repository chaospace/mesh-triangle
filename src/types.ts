import { PaleteState } from "./store/traiangleStore";
import { Triangle } from "./triangles/Delaunay";

type PointLike = { x: number, y: number };
type PointArray = PointLike[];
type ObjType = { [key: string]: any };
type BoundingBox = { x: number, y: number, w: number, h: number };

enum IMAGE_WORKER_EVENT_TYPE {
    INIT = 'INIT',
    INIT_COMPLETE = 'INIT_COMPLETE',
    UPDATE = 'UPDATE',
    UPDATE_COMPLETE = 'UPDATE_COMPLETE',
    GRAYSCALE_REQUEST = 'GRAYSCALE_REQUEST',
    GRAYSCALE_RESPONSE = 'GRAYSCALE_RESPONSE',
    EDGE_REQUEST = 'EDGE_REQUEST',
    EDGE_RESPONSE = 'EDGE_RESPONSE',
    STIPPLING_REQUEST = 'STIPPLING_REQUEST',
    STIPPLING_RESPONSE = 'STIPPLING_RESPONSE'
};

type ImageWorkerData = {
    type: IMAGE_WORKER_EVENT_TYPE;
    buffer: ArrayBufferLike;
    palette: PaleteState[]
    width: number;
    height: number;
    triangles: Triangle[];
    params: {
        threshold: number;
        blur: number;
        accuracy: number;
    }
}


export type {
    PointLike,
    PointArray,
    ObjType,
    ImageWorkerData,
    BoundingBox
}

export { IMAGE_WORKER_EVENT_TYPE }

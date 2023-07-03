import { Triangle } from "@/triangles/Delaunay";
import { StateCreator, create, createStore, useStore } from "zustand";
import { createSelectors } from "./storeHelper";


type FooStoreProps = Pick<FooStore, 'age' | 'name' | 'hobby'>;


interface FooStore {
    name: string;
    age: number;
    hobby: string;
    setProps(key: keyof FooStoreProps, value: FooStoreProps[keyof FooStoreProps]): void;
}

type PaleteState = {
    color: number;
    population: number
}


interface ImageDataSlice {
    imageData: ImageData | null;
    palette: PaleteState[];
    setPalette(newPalette: PaleteState[]): void;
    setImageData(imgData: ImageData): void
}


type DelaunayParams = Pick<ImageDelaunaySlice, 'blur' | 'threshold' | 'accuracy'>;
type DelaunayParamKey = keyof DelaunayParams;
interface ImageDelaunaySlice {
    triangles: Triangle[];
    blur: number;
    threshold: number;
    accuracy: number;
    setDelaunayParams: (key: DelaunayParamKey, value: number) => void
    setTriangles: (triangles: Triangle[]) => void
}


const createDelaunaySlice: StateCreator<ImageDelaunaySlice, [], [], ImageDelaunaySlice> = (set) => ({
    triangles: [],
    blur: 8,
    threshold: 150,
    accuracy: .5,
    setDelaunayParams: (key, value) => set(() => ({ [key]: value })),
    setTriangles: (newTriangles) => set(() => ({ triangles: newTriangles }))
});

const createImageDataSlice: StateCreator<ImageDataSlice, [], [], ImageDataSlice> = (set) => ({
    imageData: null,
    palette: [],
    setPalette: (newPalette) => set(() => ({ palette: newPalette })),
    setImageData: (imgData) => set(() => ({ imageData: imgData }))
});

const useTriangleBoundStore = createSelectors(create<ImageDelaunaySlice & ImageDataSlice>()((...a) => ({
    ...createDelaunaySlice(...a),
    ...createImageDataSlice(...a),
})));


const triangleStore = createStore<FooStore>((set) => ({
    name: 'chaospace',
    age: 30,
    hobby: 'game',
    setProps: (key, value) => set(() => ({ [key]: value }))
}));

console.log('스토어 모듈 초기화!');

function useTriangleStore(): FooStore
function useTriangleStore<T>(selector: (state: FooStore) => T, equals?: (a: T, b: T) => boolean): T
function useTriangleStore<T>(selector?: (state: FooStore) => T, equals?: (a: T, b: T) => boolean) {
    return useStore(triangleStore, selector!, equals);
}

export type {
    FooStore,
    PaleteState
}
export { triangleStore, useTriangleBoundStore };
export default useTriangleStore;
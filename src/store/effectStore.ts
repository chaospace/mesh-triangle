
/**
 * zustand를 이용한 상태관리
 * 이미지 처리에 사용되는 주요상태를 정의하고 적용해 보자.
 */

import { createStore } from "zustand";
import { createBoundedStore } from "./storeHelper";
import { calculateImageColorData, getImageData, getImageDataIndex, getSobelImageData } from "@/utils/canvasHelper";
import stackBlur from "@/utils/stackBlur";
import sampleImage from "./assets/images/image.jpg?inline";
import getImageFromFile from "@/utils/getImageFromFile";


type DelaunayEffectState = {
    imageData:ImageData;
    edgeImageData:ImageData;
    imageColorRate:Float64Array;
    edgePoints:Float64Array;
    edgeThreshold:number;       // 이미지 edge추출 시 사용할 임계값
    pointPrecision:number;      // edgePoint추출 정밀도
}
type EffectImageParams = Pick<DelaunayEffectState, 'imageData' | 'imageColorRate' >;
type EffectParams = Pick<DelaunayEffectState, 'pointPrecision'|'edgeThreshold'>;
type EffectParamKey = keyof EffectParams;
type EffectImageParamKey =keyof EffectImageParams;

type DelaunayEffectActions = {
    initialize:(source:HTMLImageElement)=>void;
    setEffectParams:(key:EffectParamKey, value:EffectParams[EffectParamKey])=>void;
    setImageSource:(source:string|File)=>void;
}


const calculateEdgePoint = ({imageData, imageColorRate}:EffectImageParams, { edgeThreshold, pointPrecision }: EffectParams) => {

    const { width, height } = imageData;
    const total = imageColorRate.length;
    const maxPoint = ~~((pointPrecision * total) / 20);
    //const { colorWeights } = source;
    let i = 0;
    const edgePoints = new Float64Array(maxPoint * 2);
    while (i < maxPoint) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const idx = getImageDataIndex(x, y, width);
        const weight = imageColorRate[idx];
        if (weight === undefined) {
            throw new Error('오류 인덱스!');
        }
        if (edgeThreshold < weight) {
            edgePoints[i * 2] = x;
            edgePoints[i * 2 + 1] = y;
            i++;
        }
    }

    return edgePoints;
};



/**
 * 동작만 생각하면 param에 변경을 반드시 이미지데이터가 선행되어야 함.
 * 그렇다면 이미지 정보만 저장되고 나머지 요소는 화면에서 상황마다 처리하는게 옳은건가?
 * 캔버스는 오직 points만 참조한다고 하면 어떻게 될까?
 * 그럼 리렌더는 발생하지 않고 오직 points변경에 따른 렌더만 실행될까?
 */
const delaunayEffectStore = createStore<DelaunayEffectState>((set, get)=>({
    imageData:new ImageData(1,1),
    edgeImageData:new ImageData(1,1),
    edgePoints:new Float64Array(),
    imageColorRate:new Float64Array(),
    edgeThreshold:0.2,
    pointPrecision:0.5,
    setEffectParams:(key:EffectParamKey, value:EffectParams[EffectParamKey]) => {
        const {imageData, imageColorRate, edgeThreshold, pointPrecision} = get();
         //기본값보다 이미지 데이터가 크면 설정된 것으로 판단.
         let edgePoints = undefined;
        if(imageData.width > 1 ){
            edgePoints = calculateEdgePoint({imageData, imageColorRate}, {edgeThreshold, pointPrecision, [key]:value});
        }
        set({[key]:value, edgePoints:edgePoints});
    },
    initialize:(source:HTMLImageElement) => {
        const imageData = getImageData(source);
        const edgeImageData = getSobelImageData(stackBlur(imageData, imageData.width, imageData.height, 2));
        const imageColorRate = calculateImageColorData(imageData);
        set({imageData, edgeImageData, imageColorRate});
    },
    setImageSource:async(source:string|File)=>{
        const {edgeThreshold, pointPrecision} = get();
        const imageEle = await getImageFromFile(source);
        const imageData = getImageData(imageEle);
        const edgeImageData = getSobelImageData(stackBlur(imageData, imageData.width, imageData.height, 2));
        const imageColorRate = calculateImageColorData(imageData);
        const edgePoints = calculateEdgePoint({imageData, imageColorRate}, {edgeThreshold, pointPrecision});
        
    }

}));


const useEffectStore = createBoundedStore(delaunayEffectStore);

export {useEffectStore};
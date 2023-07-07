
/**
 * zustand를 이용한 상태관리
 * 이미지 처리에 사용되는 주요상태를 정의하고 적용해 보자.
 */

import { createStore } from "zustand";
import { createBoundedStore } from "./storeHelper";
import { calculateImageColorData, getEdgePoints, getImageData, getImageDataIndex, getSobelImageData } from "@/utils/canvasHelper";
import stackBlur from "@/utils/stackBlur";
import sampleImage from "./assets/images/image.jpg?inline";
import getImageFromFile from "@/utils/getImageFromFile";
import { PointArray } from "@/types";
import { shallow } from "zustand/shallow";
import { computed } from "zustand-computed";
import { interpolateEdgePoints } from "@/triangles/delaunayHelper";


type DelaunayEffectState = {
    imageData:ImageData;
    edgeImageData:ImageData;
    edgeThreshold:number;       // 이미지 edge추출 시 사용할 임계값
    pointPrecision:number;      // edgePoint추출 정밀도
    isFill:boolean;             // 채우기 여부
    showCircle:boolean;         // 외곽써클처리
    dispatch:(args:DELAUNAY_ACTION)=>void;
}
type EffectImageParams = Pick<DelaunayEffectState, 'imageData' | 'edgeImageData' >;
type EffectParams = Pick<DelaunayEffectState, 'pointPrecision'|'edgeThreshold'|'isFill'|'showCircle'>;

type DelaunayEffectActions = {
    dispatch:(args:DELAUNAY_ACTION)=>void;
}

const calculateEdgePoint = ({imageData, imageColorRate}:any, { edgeThreshold, pointPrecision }: EffectParams) => {

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



enum EFFECT_ACTIONS  {
    IMAGE_CHANGE='IMAGE_CHANGE',
    PARAM_UPDATE='PARAM_UPDATE',
    UPDATE_EDGE_POINTS = 'UPDATE_EDGE_POINTS'
};

type DELAUNAY_ACTION = {
    type:EFFECT_ACTIONS,
    payload:Partial<EffectImageParams> | Partial<EffectParams>
}



const delaunayReducer = (_:DelaunayEffectState, {type, payload}:DELAUNAY_ACTION) => {
    switch(type){
        case EFFECT_ACTIONS.IMAGE_CHANGE:
             return {...payload};
            break;
        case EFFECT_ACTIONS.PARAM_UPDATE:
            return {...payload};
            break;
        default:
            return {...payload};
            break;
    }
}



/**
 * 동작만 생각하면 param에 변경을 반드시 이미지데이터가 선행되어야 함.
 * 그렇다면 이미지 정보만 저장되고 나머지 요소는 화면에서 상황마다 처리하는게 옳은건가?
 * 캔버스는 오직 points만 참조한다고 하면 어떻게 될까?
 * 그럼 리렌더는 발생하지 않고 오직 points변경에 따른 렌더만 실행될까?
 */
const delaunayEffectStore = createStore<DelaunayEffectState & DelaunayEffectActions>((set,_)=>({
    imageData:new ImageData(1,1),
    edgeImageData:new ImageData(1,1),
    edgePoints:[],
    edgeThreshold:0.5,
    pointPrecision:0.5,
    showCircle:false,
    isFill:false,
    dispatch:(info:DELAUNAY_ACTION) => set(state => delaunayReducer(state, info))
}));

/*
type ComputedState = {
    edgePoints:()=>PointArray;
}


const computedState = (state:DelaunayEffectState):ComputedState => ({
    edgePoints:() => {
        console.log('computed-계산실행')
        let edges:PointArray = [];
        if(state.edgeImageData) {
            return interpolateEdgePoints(getEdgePoints(state.edgeImageData, state.edgeThreshold*255), state.edgeThreshold);
        }
        return edges;
    }
});


const computedEffectStore = createStore(
    computed(
        (set)=>({
            imageData:new ImageData(1,1),
            edgeImageData:new ImageData(1,1),
            edgeThreshold:0.5,
            pointPrecision:0.5,
            showCircle:false,
            isFill:false,
            dispatch:(info:DELAUNAY_ACTION) => set(state => delaunayReducer(state, info))
        }), 
        computedState
    )
);
*/


//computed

const useEffectStore = createBoundedStore(delaunayEffectStore);
const useEffectParams =  () => useEffectStore((state) => ({pointPrecision:state.pointPrecision, edgeThreshold:state.edgeThreshold, isFill:state.isFill, showCircle:state.showCircle}) , shallow);
const useEffectImageData = () => useEffectStore((state) => state.imageData);
const useEffectEdgeImageData = () => useEffectStore((state) => state.edgeImageData);

const useEffectDispatch = () => useEffectStore((state) => state.dispatch );

export {useEffectStore, useEffectParams, useEffectImageData, useEffectEdgeImageData, useEffectDispatch,  EFFECT_ACTIONS};
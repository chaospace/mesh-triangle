/**
 * Delaunay효과 훅
 */

import {  getGrayScaleData, getImageData, getSobelImageData } from "@/utils/canvasHelper";
import getImageFromFile from "@/utils/getImageFromFile";
import stackBlur from "@/utils/stackBlur";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { combine } from "zustand/middleware";

type PixelData = {
    imageData?:ImageData;
    edgeImageData?:ImageData;
}



function useDelaunayEffect(){


    const _ref = useRef<CanvasRenderingContext2D|null>(null);
    const [pixelData, setPixelData] = useState<PixelData>({imageData:undefined, edgeImageData:undefined});


    const setRefHandler = useCallback((node:HTMLCanvasElement)=>{
        if(node && !_ref.current ){
            _ref.current = node.getContext('2d', {willReadFrequently:true});
        }
        return ()=>{
            _ref.current = null;
        }
    },[]);


    const setImageSource = useCallback(async(source:string|File)=>{
        const image = await getImageFromFile(source);

        const imageData = getImageData(image);
        const edgeImageData = getSobelImageData(getGrayScaleData(stackBlur(imageData, imageData.width, imageData.height, 2)));

        setPixelData({
            imageData,
            edgeImageData
        });

    },[]);


    // callback은 밖에서 설정하는데 데이터는 내부에서 관리하는 형식이 되야 함.


    useEffect(()=>{
        let animateID = -1;
        const render  = () => {

            animateID = requestAnimationFrame(render);
        }

        render();
        return ()=>{
            cancelAnimationFrame(animateID);
        }

    },[pixelData]);

    
    return {
        ref:setRefHandler,
        setImageSource
    };

}



export default useDelaunayEffect;
import { drawDelaunayConsumer,  stipplingPointProducer, transformCenteroid } from "@/drawStrategy/stipplingStrategy";
import useWatch from "@/hooks/useWatch";
import { calculateImageColorData, getImageData, getImageDataIndex } from "@/utils/canvasHelper";
import { generatorBinder } from "@/utils/generatoerHelper";
import getImageFromFile from "@/utils/getImageFromFile";
import { getScaleRatio } from "@/utils/getRatioSize";
import stackBlur from "@/utils/stackBlur";
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
    reverseColorWeights?:Float64Array;
}


function StipplingCanvas({ source, width = 400, height = 400 }: CanvasProps) {
    
    const ref = useRef<HTMLCanvasElement|null>(null);
    const [imageDataState, setImageStateData] = useState<ImageDataState>({});
    
    const {pointPrecision, colorThreshold, isReverse} = useControls({
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
        },
        isReverse:false
    });


    const selectColorWeights = useMemo(()=>{
        return imageDataState.colorWeights && imageDataState.reverseColorWeights && isReverse ? imageDataState.reverseColorWeights : imageDataState.colorWeights;
    },[isReverse, imageDataState.colorWeights, imageDataState.reverseColorWeights]) 


    const edgePoints = useMemo(()=>{
        
        const {origin} = imageDataState;
        let points = undefined;
        if(origin && selectColorWeights){
            
            const {width, height} = origin;
            const total = width*height;
            const maxPoint = ~~((total* pointPrecision)/10);
            points = new Float64Array(maxPoint*2);
            let i=0;
            while(i<maxPoint){
                const x = Math.random() * width;
                const y = Math.random() * height;
                const idx = getImageDataIndex(x, y, width);
                const weight = selectColorWeights[idx];
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

    }, [imageDataState.origin, pointPrecision, colorThreshold, selectColorWeights]);


    useEffect(()=>{
        const {origin} = imageDataState;
        if(edgePoints && origin && selectColorWeights ){
            const ctx = ref.current?.getContext('2d', {willReadFrequently:true})!;
            
            const producer = stipplingPointProducer(edgePoints);
            const drawGenerator = drawDelaunayConsumer(ctx, origin);
            generatorBinder(
                producer,
                transformCenteroid(drawGenerator, origin, selectColorWeights)
            )
           
           return ()=>{
            producer.return();
           }
        }
        
    },[edgePoints, imageDataState.origin]);



    useWatch(async()=>{
        const ctx = ref.current?.getContext('2d', {willReadFrequently:true})!;
        const image = await getImageFromFile(source);
        const imageData = getImageData(image);
        // 이미지에 컬러평균값 추출
        const colorWeights = calculateImageColorData(stackBlur(imageData, imageData.width, imageData.height, 2));
        const reverseColorWeights = colorWeights.map(v => 1 - v);
        const scale = getScaleRatio(imageData.width, imageData.height, window.innerWidth, window.innerHeight);
        ctx.canvas.width = (image.width*scale); 
        ctx.canvas.height = (image.height*scale);
        ctx.scale(scale, scale);
        setImageStateData({
            origin:imageData,
            colorWeights,
            reverseColorWeights
        });

    },[source])

    return (
        <canvas ref={ref} width={width} height={height} />
    )
}


export default StipplingCanvas;
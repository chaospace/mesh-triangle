import { useEffect, useMemo, useRef } from "react";
import useWatch from "@/hooks/useWatch";
import getImageFromFile from "@/utils/getImageFromFile";
import { getEdgePoints, getImageData, getSobelImageData } from "@/utils/canvasHelper";
import { getScaleRatio } from "../utils/getRatioSize";
import stackBlur from "@/utils/stackBlur";
import { useControls } from "leva";
import { drawDelaunayConsumer, interpolateEdgePoints, triangleConsumer, trianglePolygonProducer } from "@/drawStrategy/delaunayStrategy";
import { EFFECT_ACTIONS, useEffectDispatch, useEffectEdgeImageData, useEffectImageData, useEffectParams } from "@/store/effectStore";
import { generatorBinder } from "@/utils/generatoerHelper";

type CanvasProps = {
    width?: number,
    height?: number,
    source: string | File
}




function CPScreen({ source, width = 400, height = 400 }: CanvasProps) {
    
    const ref = useRef<HTMLCanvasElement|null>(null);
    
    const dispatch = useEffectDispatch();
    const {isFill, showCircle, edgeThreshold, pointPrecision} = useEffectParams();
    const origin  = useEffectImageData();
    const edges = useEffectEdgeImageData();
    
    useControls({
        pointDensity: {
            value: pointPrecision,
            min: 0,
            max: 1,
            step: .1,
            onChange:(value:number)=>{
                dispatch({
                    type:EFFECT_ACTIONS.PARAM_UPDATE,
                    payload:{pointPrecision:value}
                });
            }
        },
        threshold: {
            value: edgeThreshold,
            min: .1,
            max: .8,
            step: .1,
            onChange:(value:number)=>{
                dispatch({
                    type:EFFECT_ACTIONS.PARAM_UPDATE,
                    payload:{
                        edgeThreshold:value
                    }
                })
            }
        },
        showCircle:{
            value:showCircle,
            onChange:(value:boolean) => {
                dispatch({
                    type:EFFECT_ACTIONS.PARAM_UPDATE,
                    payload:{
                        showCircle:value
                    }
                })
            }
        },
        isFill:{
            value:isFill,
            onChange:(value:boolean) => {
                dispatch({
                    type:EFFECT_ACTIONS.PARAM_UPDATE,
                    payload:{
                        isFill:value
                    }
                })
            }
        }
    });

    
    
    const edgePoints = useMemo(()=>{
        return edges ? interpolateEdgePoints( getEdgePoints(edges, edgeThreshold*255), pointPrecision) : null;
    },
    [edges, edgeThreshold, pointPrecision]);


    useEffect(()=>{
        let generator:Generator|null = null;
        if(origin && edgePoints){
            const ctx = ref.current?.getContext('2d', {willReadFrequently:true})!;
            ctx.clearRect(0, 0, origin.width, origin.height);
            generator = trianglePolygonProducer(edgePoints, {w:origin.width, h:origin.height});
            const drawGenerator = drawDelaunayConsumer(ctx, {isFill, showCircle});
            const consumer = triangleConsumer(drawGenerator, origin);
            generatorBinder(generator, consumer, 200);
        }
        return ()=>{
            if(generator){
                generator.return(null);
            }
        }
    }, [origin, edgePoints, showCircle, isFill])


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
        dispatch(
            {
                type:EFFECT_ACTIONS.IMAGE_CHANGE,
                payload:{
                    imageData,
                    edgeImageData
                }
            }
        )
    }, [source]);
    
    return (<canvas ref={ ref } width={ width } height={ height } />)

};




export type {
    CanvasProps
}
export default CPScreen;
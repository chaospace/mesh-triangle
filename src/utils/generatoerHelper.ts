/**
 * 제너레이터함수 유틸 모음
 */

function generatorBinder( source:Generator, receiver:Generator, delay=500) {
    const innerLoop = () =>{
        const r = source.next();
        if(!r.done){
            receiver.next(r.value);
            setTimeout(innerLoop,delay);
        } else {
            receiver.return(null); //end of stream;
        }
    }
    innerLoop();
}

function generatorConsumer( func:GeneratorFunction ){
    return (...args:Parameters<typeof func>):ReturnType<typeof func> => {
        const generator = func(...args);
        generator.next();
        return generator;
    }
}


export {
    generatorBinder, 
    generatorConsumer
}


function generatorRunner( generatorFunc:any ) {
    const callback = ({value, done}:IteratorYieldResult<any>) => {
        //const r = generator.next();
        console.log('value', value, done);
        if(done){
            return value;
        }
        callback(generator.next(value) as any);
    }

    const generator = generatorFunc(callback);
    callback(generator.next());
}

const range = (start:number, end:number) => {
    return Array.from({length:end-start}, (_, i) => start + i);
}
        
describe.skip("중첩 제너레이터 동작테스트", ()=>{

    it.skip("제너레이터함수는 안에 yield의 수 +1 만큼 실행해야 완료된다.",()=>{

        function* genLoop() {
            yield 10;
            yield 30;
            yield 40;
            yield 50;
        } 

        const gen = genLoop();

        console.log(gen.next());
        console.log(gen.next());
        console.log(gen.next());
        console.log(gen.next());
        console.log(gen.next());

    });

    it.skip("제너레이터함수는 yield를 통해 서로 값을 주고 받을 수 있다.", ()=>{

        function* genFoo() {
            let foo:string = yield;
            return 'Hello ' + foo;
        }

        const gen = genFoo();
        gen.next(); // yield문이 있는 곳까지 이동.
        console.log(gen.next( 'chaospace' )); // 리턴값을 전달하고 종료

    });

    it.skip('runner를 통한 제너레이터함수 처리 개선',()=>{
        
        generatorRunner(function* foo(){
            yield 10;
            yield 20;
            yield 40;
            yield 50;
            yield 60;
        });

    });

    it.skip("중복 제너레이터함수 처리 동작테스트",()=>{

        function *innerGenerator(){
            yield *['a', 'b', 'c'];
        }

        function* generator(){
            yield* [1, 2, 3];
            const innerGen = innerGenerator();
            console.log('innerGen', innerGen);
            yield* innerGenerator();
        }

        console.log('generator', [...generator()]);

    });
}); 


describe("제너레이터함수 중급 테스트", ()=>{

    beforeEach(()=>{
        vi.useFakeTimers();
    });

    afterEach(()=>{
        vi.restoreAllMocks();
    })

    

    it.skip("중첩 제너레이터함수 동작 실험", ()=>{


        function* innerLoop(){
            let v:number = yield null;
            v = yield v+1;
            v = yield v+1;
            return v;
        }


        generatorRunner(function* (){

            yield 10;
            yield 20;
            yield* innerLoop();
            yield 30;
            yield 40;

        });

    });


    it.skip("제너레이터함수를 이용한 값 주고 받기", ()=>{
        
        function runnerWrapper( generatorFunc:((...args:any)=>Iterator<unknown>), delay=100){

            function callback(info:IteratorYieldResult<any>){
                if(info.done){
                    return info.value;
                }
                console.log('v', info, delay);
                setTimeout( ()=>callback(g.next(info.value) as any) , delay);
                // vi.advanceTimersToNextTimer();
            }

            const g = generatorFunc();
            callback(g.next() as any);
        }   

        

        function* addGen() {
            let source= [1, 2, 3, 4, 5];
            while(source.length){
                yield source.shift();
            }
            return;
        }

        // 일정간격마다 실행하려면.. 한번 더 커링이 일어나야 함.
        runnerWrapper(addGen, 100);
        
        

    });


    it("제너레이터 위임을 이용한 값 전달하기", ()=>{

        function* loopFoo(){
            const arr = [1, 2, 3, 4, 5];
            for( let _ of arr ){
                yield _;
            }
        }



        function receiveFooCallback(iter:Generator<number>, callback:((n:number)=>void)){
            
            let result = iter.next();
            //console.log('result', result);
            if(!result.done){
                callback(result.value);
                setTimeout(()=>{
                    receiveFooCallback(iter, callback);
                },100);
                vi.advanceTimersToNextTimer();
            }

        }

        const iter = loopFoo();
        
        receiveFooCallback(iter, (n:number)=>{
            console.log('receive', n);
        });

        

    });

    
});
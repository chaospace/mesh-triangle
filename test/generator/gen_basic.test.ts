/**
 * https://2ality.com/2015/03/es6-generators.html
 * 제너레이터는 데이터 공급자와 소비자로 구분되며 크게 Iterator와 Observer 인터페이스로 구분 
 * 제너레이터는 공급과 소비를 모두 가진 객체로 둘 모두를 다룰 수 있게 인터페이스가 구성됨.
 * 
 * interface Iterator {
 *  next():IteratorResult;
 *  return?(value?:any) :IteratorResult;
 * }
 * 
 * interface Observer {
 *  next(value?:any):void;
 *  return(value?:any) :void;
 *  throw(error) :void;
 * }
 * 
 * interface Generator {
 *  next(value?:any):IteratorResult;
 *  throw(value?:any):IteratorResult;
 *  return(value?:any) :IteratorResult;
 * }
 * 
 * interface :IteratorResult {
 *  value:any;
 *  done:boolean;
 * }
 * 
 */

describe.skip("yield동작 테스트",()=>{
    function* callee(){
        console.log('callee ' + (yield));
    }
    
    function* caller(){
        while(true){
            yield* callee();
        }
    }
    it("callee, caller를 이용한 동작 확인",()=>{
        
        const callerObj = caller();
        console.log(callerObj.next()); // start

        console.log(callerObj.next('a')); // 
        console.log(callerObj.next('b')); // 
    })


    

});


describe.skip("제너레이터 반복 중 throw동작 확인",()=>{
  
    function* callee(){
        try{
            yield 'b';
            yield 'c';
        } finally {
            console.log('finally callee');
        }
    }
    
    function* caller(){
        try{
            yield 'a';
            yield* callee();
            yield 'd';
        } catch(e) {
            console.log('[caller] '+ e);
        }
    }


    it("제너레이터 반복 중 throw가 발생하면 상태는 완료가 된다.",()=>{
        
        const callerObj = caller();
        console.log(callerObj.next().value);
        console.log(callerObj.next().value);
        console.log(callerObj.next().value);
        console.log(callerObj.throw(new Error('문제!!')));
    });


});




describe.skip("제너레이터 반복 중 return동작 확인",()=>{
  
    function* callee(){
        try{
            yield 'b';
            yield 'c';
        } finally {
            console.log('finally callee');
        }
    }
    
    function* caller(){
        try{
            yield 'a';
            yield* callee();
            yield 'd';
        } finally {
            console.log('finally caller');
        }
    }


    it("제너레이터에 결과를 구조분해 할당 할 경우 마지막까지 안하면 return이 실행되어 자동종료된다",()=>{
        
        const [x, y] = caller(); // 구조분해 할당하는 수에 따라 중첩된 제너레이터함수는 종료되지 않을 수 있음.

        console.log(x, '-', y);

        
    });


});


describe.skip("이터러블 직접구현 및 제너레이터 함수 사용비교", ()=>{

    function* takeGeneratorFunc<T extends number>( n:T, iter:Iterable<T>) {
        for(let x of iter) {
            if( n<=0) return;
            n--;
            yield x;
        }
    }

    function takeImp<T extends number>(n:T, iterable:Iterable<T>) {
        const iter = iterable[Symbol.iterator]();
        let idx = Number(n);
        return {
            [Symbol.iterator](){
                return this;
            },
            next(){
                if(idx>0){
                    idx--;
                    return iter.next();
                } else {
                    iter.return && iter.return();
                    console.log('return',iter.return);
                    return {done:true, value:undefined};
                }
            },
            return(){
                idx = 0;
                return iter.return!();
            }
        }
    }

    it('제너레이터를 이용한 take동작확인', ()=>{
        for(let x of takeGeneratorFunc(2, [1, 2, 3, 4, 5])){
            console.log('x',x);
        }
    });

    it('제너레이터 인터페이스 구현 take동작확인', ()=>{
        for( let x of takeImp(3, [1, 2, 3, 4]) ){
            console.log('x',x);
        }
    });

});



describe("이터러블래퍼 동작테스트", ()=>{
    const END_ITER = Symbol();
    function getNextValue<T>( target:Iterator<T> ){
        const current = target.next();
        return current.done ? END_ITER : current.value;
    }

    
    it.skip("value값만으로 이터러블에 마지막을 체크한다.",()=>{

        const iter = 'abcde'[Symbol.iterator]();
        //const next = getNextValue(iter);
        let value = getNextValue(iter);
        try{
            while(value !== END_ITER){
                console.log(value);
                value=getNextValue(iter);
            }
        } catch(e){
            console.log('error', e);
        } finally {
            console.log('finally-', value , END_ITER, value === END_ITER);
            value === END_ITER && console.log('end-');
        }
        
    });

    
})
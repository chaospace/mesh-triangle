import { StateCreator, StoreApi, create, createStore } from "zustand";
import computed  from "zustand-computed";
import { subscribeWithSelector } from "zustand/middleware";
import { shallow } from "zustand/shallow";

type State = {
    name:string
    setName:((newName:string)=>void)
}

type ComputedState = {
    nickname:()=>string
}

const computedState = (state:State):ComputedState =>  ({
    nickname:() => state.name+'!!'
})


describe("zustand상태 동작테스트",()=>{

    const useCombinedState = create<State>()(
        computed(
            (set)=>({
                name:'chaopace',
                setName:(newName:string) => set({name:newName})
            }),
            computedState
        )
    );


    it("computed플러그인은 상태변경 시에만 동작한다.",()=>{
        console.log('nick-name',useCombinedState.getState().nickname());
    });


    it('shallow 비교 배열 테스트', ()=>{
        let a= [1,0];
        let b = [1];
        const r = shallow(a, b);
        console.log('비교결과', r);
    });

    it('store셀렉터 접근', ()=>{
        const unsub = useCombinedState.subscribe((state, prev) => {
            return state.name;
        });
        
        useCombinedState.setState({name:'ddee'});
        unsub();

    });

});


describe.skip('바닐라 스토어 테스트',()=>{
    type MyState={
        name:string;
    }
    const myState = createStore<MyState>()(
            subscribeWithSelector((set) =>
                ({name:'cha'})
            )
    );
    
    it("바닐라스토어 생성 시 미들웨어 적용",()=>{
        expect(myState.getState().name).toEqual('cha');
    });

    it("바닐라스토어 미들웨어 사용",()=>{
        myState.subscribe( state => state.name, 
                           selectState => console.log('selectedState', selectState),
                           {equalityFn:(_, current) => { 
                                return current === 'ddd!';
                            }});
        myState.setState({name:'ddd!'});
        // myState.setState({name:'cd!'});
    });
})


describe('스토더 slice 테스트',()=>{
    interface FooSlice {
        value:string;
    }
    interface WooSlice {
        age:string;
        getAge:()=>string;
    }
    const fooSlice:StateCreator<FooSlice & WooSlice, [],[], FooSlice> = (set, get)=>({
        value:'foo'
    });

    const wooSlice:StateCreator<WooSlice & FooSlice,[],[],WooSlice> = (set, get)=>({
        age:'woo',
        getAge:() => get().value
    });
    const boundedStore = create<FooSlice & WooSlice>()((...a)=>({
        ...fooSlice(...a),
        ...wooSlice(...a)
    }));
    
    it("slice된 모듈은 set, get을 통해 다른 모듈에 값을 제어 가능하다.",()=>{
        expect(boundedStore.getState().getAge()).toEqual('foo');
    });
});


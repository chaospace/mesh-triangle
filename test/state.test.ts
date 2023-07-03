import { StoreApi, UseBoundStore, create } from "zustand";
import { computed } from "zustand-middleware-computed-state";
// import { subscribeWithSelector } from "zustand/middleware";

type State = {
    name:string
    setName:((newName:string)=>void)
}

type ComputedState = {
    nickname:() => string
}

type CombinedStore = State & ComputedState;

describe("zustand상태 동작테스트",()=>{

    let useCombinedState:UseBoundStore<StoreApi<CombinedStore>>;

    beforeAll(()=>{
        useCombinedState = create<CombinedStore>(
            computed<State, ComputedState>(
                (set:any)=>({
                    name:'chaospace',
                    setName:(newName:string) => set({name:newName})
                }),
                (state:State) => {
                    return {
                        nickname() {
                            console.log('nick-name-call');
                            return state.name + '~~~'
                        }
                    }
                }
            )
        );
    });


    it("computed플러그인은 상태변경 시에만 동작한다.",()=>{
        console.log('nick-name',useCombinedState.getState().nickname());
        useCombinedState.getState().setName('one-piece-name');
    });

});




describe("set동작테스트",()=>{
    it("add를 통해 함수등록가능",()=>{
        const listeners = new Set();

        listeners.add((value:any)=>{
            console.log('new-value', value);
        });



    });
});
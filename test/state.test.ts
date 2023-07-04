import { create } from "zustand";
import computed  from "zustand-computed";

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

});



// type test
// declare const withError:<T,E>(p:Promise<T>) => Promise<[error:undefined, value:T] | [error:E, value:undefined]>;

// declare const doSomthing:() => Promise<string>;

// const main = async() => {
//     let [error, value] = await withError<string, number>(doSomthing());
// }


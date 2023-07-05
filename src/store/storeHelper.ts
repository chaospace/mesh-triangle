
import { StoreApi,  UseBoundStore, useStore } from "zustand"

// const capitalize = (key: string) => key[0].toUpperCase() + key.slice(1);


// type WithSelectorHook<S> = S extends { getState: () => infer T }
//     ? S & { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] } : never



// const createGetter = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
//     let store = _store as WithSelectorHook<S>;
//     for (let k of Object.keys(store)) {
//         (store as any)[`get${capitalize(k)}`] = () => store((s) => s[k as keyof typeof s]);
//     }
//     return store;
// }

type WithState<S> = S extends { getState:() => infer T } ? T : never;
type WithSelector<S> = S extends { getState: () => infer T }
    ? S & { use: { [K in keyof T]: () => T[K] } }
    : never

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(_store: S) => {
    let store = _store as WithSelector<typeof _store>;
    store.use = {};
    for (let k of Object.keys(store.getState())) {
        (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
    }

    return store;
}


const createBoundedStore = ( (store) => (selector, equals) =>  useStore( store, selector as never, equals ) ) as <S extends StoreApi<object>>(store:S) => {
    ():WithState<S>,
    <T>( selector:(state:WithState<S>) => T, equals?:(a:T, b:T) => boolean ):T
};


    


// type ComputedState<S> = (state:S) => S;

// const computed = <S,C>(create:StateCreator<S>, compute:(state:S)=>C) => (
//     set:StoreApi<S>['setState'], get:StoreApi<S>['getState'], api:StoreApi<S>
// ): S & C  => {

//     const setWithComputed:StoreApi<S>['setState'] = (update, replace) => {
//         set((state)=>{
//             const updated = typeof update === 'function' ? (update as (state:S) => Partial<S> |S)(state) : update;
//             const computedState = compute({...state, ...updated} as S);
//             return {...updated, ...computedState};
//         }, replace);
//     }

//     api.setState = setWithComputed;
//     const state = create(setWithComputed, get, api);
//     return {...state, ...compute(state)};
// }




export { createSelectors, createBoundedStore };
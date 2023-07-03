import { StoreApi, UseBoundStore } from "zustand"

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


/*
interface FooState {
    bears: number;
    inc: (by: number) => void
}

const useFooBase = create<FooState>()((set) => ({
    bears: 0,
    inc: (by) => set((state) => ({ bears: state.bears + by }))
}));

const useFooStore = createSelectors(useFooBase);
useFooStore.use.inc()(3);
const useFooSelectorStore = createGetter(useFooBase);
useFooSelectorStore.getBears();
useFooSelectorStore.getInc()(30);
*/


export { createSelectors };
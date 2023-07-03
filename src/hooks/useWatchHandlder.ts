import useWatch from "./useWatch";


type WithParams<S> = S extends object ? {} : never;

function useWatchHandler<T extends WithParams<unknown>>(params: T, handler: ((params: T) => void)) {
    useWatch(() => {
        handler(params);
    }, Object.values(params));
}

export default useWatchHandler;
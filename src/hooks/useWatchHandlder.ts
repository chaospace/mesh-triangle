import useWatch from "./useWatch";


function useWatchHandler<T extends object>(params: T, handler: ((params: T) => void)) {
    useWatch(() => {
        handler(params);
    }, Object.values(params));
}

export default useWatchHandler;
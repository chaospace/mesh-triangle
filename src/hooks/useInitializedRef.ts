import { useRef } from "react";

function useInitializedRef() {
    const isInitialized = useRef(false);
    if (!isInitialized.current) {
        isInitialized.current = true;
        return false;
    }
    return isInitialized.current;
}

export default useInitializedRef;
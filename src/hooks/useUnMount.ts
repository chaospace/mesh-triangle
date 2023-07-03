import { useEffect } from "react";


function useUnMount(callback: Function) {
    useEffect(() => () => callback(), []);
}

export default useUnMount;
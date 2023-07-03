import { useCallback, useState } from "react";


function useForceUpdate() {

    const [_, setCount] = useState(0);

    const forceUpdate = useCallback(() => {
        setCount(prev => prev + 1);
    }, []);

    return forceUpdate;
}


export default useForceUpdate;
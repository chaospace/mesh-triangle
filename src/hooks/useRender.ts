import { useEffect } from "react";


/**
 * 컴포넌트 갱신 시 마다 호출되는 훅
 * @param callback : 렌더링 시마다 호출될 콜백
 */
function useRender(callback: Function) {
    useEffect(() => callback());
}

export default useRender;
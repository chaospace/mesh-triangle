import { DependencyList, useEffect } from "react";

/**
 * 참조 변경 시 핸들러 함수 실행 훅 
 * 코드에 useEffect와 동일하지만 가독성을 생각해 사용
 * @param callback : 의존성 변경 시 실행될 콜백함수
 * @param deps  : 의존성 목록 배열참조
 */
function useWatch(callback: Function, deps: DependencyList) {
    useEffect(() => {
        callback();
    }, deps);
}

export default useWatch;

## Zustand 구성
- 코어는 클로저와 subscription을 이용한 상태변경 로직을 바닐라 js로 구성
- createStore를 통해 기본 상태객체 구성
  ```javascript
    const state = createStore((set, get, api)=>({
        name:'chao',
        age:20,
        setName(){

        },
        setAge(){

        }
    }))
  ```
- react훅과 연동을 위해 useStore를 제공하며 이는 <mark>useSyncExternalStoreWithSelector(api.subscribe, api.getState, api.getServerState || api.getState, selector, equalityFn);</mark>를 이용하며 리턴 값을 통해 raw상태객체와 훅 함수 접근가능.  
  
```javascript
import { useStore } from 'zustand'
import { vanillaStore } from './vanillaStore'

const useBoundStore = (selector) => useStore(vanillaStore, selector)
```

## 주요 함수 구성
- createStore 함수 subscription을 이용한 상태변경 감지 제공 및 상태 변경을 위한 get, set 처리제공
  
```javascript
var createStoreImpl = function createStoreImpl(createState) {
  var state;
  var listeners = new Set();
  var setState = function setState(partial, replace) {
    var nextState = typeof partial === 'function' ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      var _previousState = state;
      state = (replace != null ? replace : typeof nextState !== 'object') ? nextState : Object.assign({}, state, nextState);
      listeners.forEach(function (listener) {
        return listener(state, _previousState);
      });
    }
  };
  var getState = function getState() {
    return state;
  };
  
  var subscribe = function subscribe(listener) {
    listeners.add(listener);
    return function () {
      return listeners.delete(listener);
    };
  };

  var destroy = function destroy() {
    listeners.clear();
  };

  var api = {
    setState: setState,
    getState: getState,
    subscribe: subscribe,
    destroy: destroy
  };
  state = createState(setState, getState, api);
  return api;
};
```

- useStore는 셀렉터와 함께 비교함수를 옵션으로 제공하며 이를 통해 참조 체크를 커스텀하게 조작가능.
```javascript
import { shallow } from 'zustand/shallow'

//Object pick, re-renders the component when either state.nuts or state.honey change
const { nuts, honey } = useBearStore(
  (state) => ({ nuts: state.nuts, honey: state.honey }),
  shallow
)

// Array pick, re-renders the component when either state.nuts or state.honey change
const [nuts, honey] = useBearStore(
  (state) => [state.nuts, state.honey],
  shallow
)

// Mapped picks, re-renders the component when state.treats changes in order, count or keys
const treats = useBearStore((state) => Object.keys(state.treats), shallow)
```

- 미들웨어 사용
  create시 미들웨어 함수를 통해 상태 변경 및 추가행동정의 가능  
  - ts사용 시 복잡한 타입추론 정의필요(공식문서 참고)
```javascript
// Log every time state is changed
const log = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.log('  applying', args)
      set(...args)
      console.log('  new state', get())
    },
    get,
    api
  )

const useBeeStore = create(
  log((set) => ({
    bees: false,
    setBees: (input) => set({ bees: input }),
  }))
)
```

## 참고
- [github페이지](https://github.com/pmndrs/zustand)  
- [ts참고페이지](https://github.com/pmndrs/zustand/blob/main/docs/guides/typescript.md)
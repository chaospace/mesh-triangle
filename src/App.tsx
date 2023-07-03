import { ChangeEvent, useCallback, useState } from 'react';
import sampleImage from "./assets/images/image.jpg?inline";
import useTriangleStore, { FooStore, triangleStore } from './store/traiangleStore';
import useRender from './hooks/useRender';
import CPScreen from './components/CPScreen';
import './App.css'
import useForceUpdate from './hooks/useForceUpdate';


function NameButton() {
  const name = useTriangleStore((state: FooStore) => state.name);
  const setProps = useTriangleStore(state => state.setProps);
  useRender(() => {
    console.log('re-draw-이름버튼');
  });


  return (
    <>
      <button onClick={ () => { setProps('age', 300) } }>{ name } 변경</button>
    </>
  )
}

function AegButton() {
  const age = useTriangleStore((state: FooStore) => state.age);
  const setProps = useTriangleStore(state => state.setProps);

  useRender(() => {
    console.log('re-draw-나이버튼');
  });

  return (
    <>
      <button onClick={ () => setProps('name', 'from-age') }>{ age } 변경</button>
    </>
  )
}

function ChangeButton() {
  const setProps = useTriangleStore((state: FooStore) => state.setProps);

  useRender(() => {
    console.log('변경실행');
  });

  return (
    <>
      <button onClick={ () => {
        setProps('name', 'ddd');
      } }> 변경</button>
    </>
  )
}


triangleStore.setState({ name: 'dd000' });
console.log('triangleStore', triangleStore.getState());
function App() {

  const [imageSource, setImageSource] = useState<string | File>(sampleImage);

  const forceUpdate = useForceUpdate();

  const onChangeFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    files && setImageSource(files[0]);
  }, []);









  return (
    <div className='container'>
      <CPScreen source={ imageSource } />
      <div className='control-layer'>
        <div>
          <NameButton />
          <AegButton />
          <ChangeButton />
          <button onClick={ () => forceUpdate() }>강제갱신</button>
          <input className='custom-file-input' type="file" name="upload-image" id="ipt-upload-image" accept='image/*' onChange={ onChangeFile } />
        </div>
      </div>
    </div >
  )
}

export default App

import { ChangeEvent, useCallback, useState } from 'react';
import sampleImage from "./assets/images/image_4.jpg?inline";
import CPScreen from './components/CPScreen';
import './App.css'
import useForceUpdate from './hooks/useForceUpdate';
import StipplingCanvas from './components/StipplingScreen';
//import { useEffectStore } from './store/effectStore';



function App() {
  
  const [imageSource, setImageSource] = useState<string | File>(sampleImage);
  //console.log('effect-store',useEffectStore());
  const onChangeFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    files && setImageSource(files[0]);
  }, []);

  return (
    <div className='container'>
      {/* <CPScreen source={ imageSource } /> */}
      <StipplingCanvas  source={ imageSource }/>
      <div className='control-layer'>
        <div>
          <input className='custom-file-input' type="file" name="upload-image" id="ipt-upload-image" accept='image/*' onChange={ onChangeFile } />
        </div>
      </div>
    </div >
  )
}

export default App

import ReactDOM from 'react-dom';
import { createStore, Provider } from 'jotai';
import { IsFullscreenAtom } from 'src/ui/atoms/IsFullscreen';
import App from 'src/ui/components/App';
import './index.css';

const store = createStore();
store.set(IsFullscreenAtom, false);

ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));

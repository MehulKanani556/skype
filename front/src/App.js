
import './App.css';
import Login from './pages/Login';
import SkypeClone from './pages/main';
import { Provider } from 'react-redux';
import { configureStore } from './reduxe/store';
function App() {
  const { store, persistor } = configureStore();
  return (
    <Provider store={store}>
      {/* <Login /> */}
      <SkypeClone />
      </Provider>
  );
}

export default App;

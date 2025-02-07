
import './App.css';
import Chat from './pages/Chat';
import Login from './pages/Login';
import { Provider } from 'react-redux';
import { configureStore } from './redux/Store';
function App() {
  const { store, persistor } = configureStore();
  return (

    <Provider store={store}>
      < Chat />
      {/* <Login /> */}
    </Provider>
  );
}

export default App;

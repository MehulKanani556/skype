
import './App.css';
import Chat from './pages/Chat';
import Login from './pages/Login';
import SkypeClone from './pages/main';
import { Provider } from 'react-redux';
// import { configureStore } from './reduxe/store';
import { configureStore } from './redux/Store';
import { Route, Routes } from 'react-router-dom';
function App() {
  const { store, persistor } = configureStore();
  return (

    <Provider store={store}>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/" element={<Chat />}></Route>
        <Route path="/clone" element={<SkypeClone />}></Route>
      </Routes>

    </Provider>
  );
}

export default App;

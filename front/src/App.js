
import './App.css';
import Chat from './pages/Chat';
import Login from './pages/Login';
import { Provider } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { configureStore } from './redux/Store';
import Chat2 from './pages/Chat2';
import Front from './component/Front';

function App() {
  const { store, persistor } = configureStore();
  return (
    <Provider store={store}>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/" element={<Login />}></Route>
        {/* <Route path="/clone" element={<SkypeClone />}></Route> */}
        <Route path="/chat" element={<Chat2 />}></Route>
        <Route path="/chat2" element={<Chat />}></Route>
        <Route path="/front" element={<Front />}></Route>
      </Routes>

    </Provider>
  );
}

export default App;

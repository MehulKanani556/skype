import './App.css';
import Chat11 from './pages/Chat11';
import Login from './pages/Login';
import { Provider } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { configureStore } from './redux/Store';
import Chat2 from './pages/Chat2';
import Front from './component/Front';
import ChatNew from './pages/ChatNew';

function App() {
  const { store, persistor } = configureStore();
  return (
    <Provider store={store}>
      <Routes>
        {/* <Route path="/login" element={<Login />}></Route> */}
        <Route path="/" element={<Login />}></Route>
        <Route path="/chat" element={<Chat2 />}></Route>
        {/* <Route path="/chat2" element={<Chat11 />}></Route> */}
        {/* <Route path="/front" element={<Front />}></Route> */}
        {/* <Route path="/chatNew" element={<ChatNew/>}></Route> */}
      </Routes>
    </Provider>
  );
}
export default App;

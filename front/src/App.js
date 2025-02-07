
import './App.css';
import Chat from './pages/Chat';
import Login from './pages/Login';
import { Provider } from 'react-redux';
import { configureStore } from './redux/Store';
import Chat2 from './pages/Chat2';
import { Routes, Route } from 'react-router-dom';

function App() {
  const { store, persistor } = configureStore();
  return (     
    <Provider store={store}>
      <Routes>
          <Route path="/chat2" element={<Chat2 />}></Route>
          <Route path="/chat" element={<Chat />}></Route>
          <Route path="/" element={<Login />}></Route>
        </Routes>
    </Provider>
  );  
}

export default App;

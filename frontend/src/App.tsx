import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CreateRoom } from './pages/CreateRoom';
import { JoinRoom } from './pages/JoinRoom';
import { RoomLobby } from './pages/RoomLobby';
import { ComponentDemo } from './pages/ComponentDemo';
import { GamePlayDemo } from './pages/GamePlayDemo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<RoomLobby />} />
        <Route path="/demo" element={<ComponentDemo />} />
        <Route path="/game-demo" element={<GamePlayDemo />} />
      </Routes>
    </Router>
  );
}

export default App;

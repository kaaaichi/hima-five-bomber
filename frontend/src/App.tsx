import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CreateRoom } from './pages/CreateRoom';
import { JoinRoom } from './pages/JoinRoom';
import { RoomLobby } from './pages/RoomLobby';
import { ComponentDemo } from './pages/ComponentDemo';
import { GamePlayDemo } from './pages/GamePlayDemo';
import { PrototypeHome } from './pages/prototype/PrototypeHome';
import { PlayerSetup } from './pages/prototype/PlayerSetup';
import { PrototypeGame } from './pages/prototype/PrototypeGame';
import { GameResult } from './pages/prototype/GameResult';

function App() {
  return (
    <Router>
      <Routes>
        {/* オンライン対戦版（本来の仕様） */}
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<RoomLobby />} />
        <Route path="/demo" element={<ComponentDemo />} />
        <Route path="/game-demo" element={<GamePlayDemo />} />

        {/* プロトタイプ版（イベント用縮小版） */}
        <Route path="/prototype" element={<PrototypeHome />} />
        <Route path="/prototype/setup" element={<PlayerSetup />} />
        <Route path="/prototype/game" element={<PrototypeGame />} />
        <Route path="/prototype/result" element={<GameResult />} />
      </Routes>
    </Router>
  );
}

export default App;

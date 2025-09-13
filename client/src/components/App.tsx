import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import VideoPage from "./VideoPage";
import MyTicketsPage from "./MyTicketsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/ticketfairy" element={<VideoPageWrapper />} />
        <Route path="/tickets" element={<MyTicketsPageWrapper />} />
      </Routes>
    </Router>
  );
}

function LandingPageWrapper() {
  const navigate = useNavigate();
  return <LandingPage onNavigateToVideo={() => navigate('/ticketfairy')} />;
}

function VideoPageWrapper() {
  const navigate = useNavigate();
  return (
    <VideoPage
      onNavigateToTickets={() => navigate('/tickets')}
      onNavigateToLanding={() => navigate('/')}
    />
  );
}

function MyTicketsPageWrapper() {
  const navigate = useNavigate();
  return <MyTicketsPage onNavigateToLanding={() => navigate('/')} />;
}

export default App;
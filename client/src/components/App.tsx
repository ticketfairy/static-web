import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import VideoPage from "./VideoPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/ticketfairy" element={<VideoPageWrapper />} />
      </Routes>
    </Router>
  );
}

function LandingPageWrapper() {
  const navigate = useNavigate();
  return <LandingPage onNavigateToVideo={() => navigate("/ticketfairy")} />;
}

function VideoPageWrapper() {
  const navigate = useNavigate();
  return <VideoPage onNavigateToTickets={() => navigate("/tickets")} onNavigateToLanding={() => navigate("/")} />;
}

export default App;

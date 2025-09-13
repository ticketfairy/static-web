import { useState } from "react";
import LandingPage from "./LandingPage";
import VideoPage from "./VideoPage";
import MyTicketsPage from "./MyTicketsPage";

export type Page = "landing" | "video" | "tickets";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  switch (currentPage) {
    case "landing":
      return <LandingPage onNavigateToVideo={() => navigateToPage("video")} />;
    case "video":
      return <VideoPage onNavigateToTickets={() => navigateToPage("tickets")} onNavigateToLanding={() => navigateToPage("landing")} />;
    case "tickets":
      return <MyTicketsPage onNavigateToLanding={() => navigateToPage("landing")} />;
    default:
      return <LandingPage onNavigateToVideo={() => navigateToPage("video")} />;
  }
}

export default App;
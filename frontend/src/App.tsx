import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { BoardView } from "./components/BoardView";
import { IssueDetailView } from "./components/IssueDetailView";
import { Header } from "./components/Header";
import { NotFound } from "./components/NotFound";

const RouteLogger: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    // Simple client-side trace of route changes.
    // Visible in the browser console and frontend container logs.
    console.log("[router] navigated to", location.pathname);
  }, [location]);

  return null;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <RouteLogger />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-5 space-y-5">
        <Header />
        <main>
          <Routes>
            <Route path="/projects/:projectId/board" element={<BoardView />} />
            <Route
              path="/projects/:projectId/issues/:identifier"
              element={<IssueDetailView />}
            />
            <Route
              path="/"
              element={<Navigate to="/projects/default/board" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;

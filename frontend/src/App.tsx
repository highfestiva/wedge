import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Provider } from "urql";
import { client } from "./graphql/client";
import { CreateIssueActionProvider } from "./contexts/CreateIssueContext";
import { BoardPage } from "./pages/BoardPage";
import { IssueDetailPage } from "./pages/IssueDetailPage";
import { Header } from "./components/Header";
import { NotFound } from "./components/NotFound";

const RouteLogger: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    console.log("[router] navigated to", location.pathname);
  }, [location]);

  return null;
};

export default function App() {
  return (
    <Provider value={client}>
      <BrowserRouter>
        <CreateIssueActionProvider>
        <RouteLogger />
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-5 space-y-5">
          <Header />
          <main>
            <Routes>
              <Route path="/projects/:projectPrefix/board" element={<BoardPage />} />
              <Route
                path="/projects/:projectPrefix/issues/:identifier"
                element={<IssueDetailPage />}
              />
              <Route
                path="/"
                element={<Navigate to="/projects/DFT/board" replace />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </CreateIssueActionProvider>
      </BrowserRouter>
    </Provider>
  );
};

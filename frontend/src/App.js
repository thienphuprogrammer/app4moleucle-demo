import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./features/dashboard/DashboardPage";
import ExperimentsPage from "./features/experiments/ExperimentsPage";
import ExperimentDetail from "./features/experiments/ExperimentDetail";
import KnowledgePage from "./features/knowledge/KnowledgePage";
import SimulationPage from "./features/simulation/SimulationPage";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/experiments" element={<ExperimentsPage />} />
              <Route path="/experiments/:id" element={<ExperimentDetail />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/simulation" element={<SimulationPage />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </div>
    </ThemeProvider>
  );
}

export default App;

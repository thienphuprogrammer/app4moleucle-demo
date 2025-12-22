import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./features/dashboard/DashboardPage";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </div>
    </ThemeProvider>
  );
}

export default App;

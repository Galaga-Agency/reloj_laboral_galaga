import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AbsenceProvider } from "@/contexts/AbsenceContext";
import { TeleworkingProvider } from "@/contexts/TeleworkingContext";
import { RouteRenderer } from "@/components/RouteRenderer";
import { Footer } from "@/components/layout/Footer";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AbsenceProvider>
          <TeleworkingProvider>
            <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-azul-profundo to-teal">
              <RouteRenderer />
              <Footer />
            </div>
          </TeleworkingProvider>
        </AbsenceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { RouteRenderer } from "@/components/RouteRenderer";
import { Footer } from "@/components/layout/Footer";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-azul-profundo to-teal">
          <RouteRenderer />
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

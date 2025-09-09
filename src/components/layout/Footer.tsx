import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="absolute bottom-6 right-12 text-white text-sm py-4 text-center bg-transparent">
      <div className="flex gap-6">
        <Link to="/politica-privacidad" className="hover:underline">
          Política de Privacidad
        </Link>
        <Link to="/aviso-legal" className="hover:underline">
          Aviso Legal
        </Link>
      </div>
    </footer>
  );
}

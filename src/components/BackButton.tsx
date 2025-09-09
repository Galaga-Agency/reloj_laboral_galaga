import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/panel")}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition"
      aria-label="Volver"
    >
      <FiArrowLeft className="w-4 h-4" />
      Volver
    </button>
  );
}

import { useNavigate } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi2";

export function BackButton() {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Volver"
      className="group flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-4 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 hover:-translate-x-1 transition-all duration-300 shadow-lg"
    >
      <HiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
    </button>
  );
}
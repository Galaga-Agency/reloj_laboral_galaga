import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import SecondaryButton from "./ui/SecondaryButton";

export function BackButton() {
  const navigate = useNavigate();
  return (
    <SecondaryButton
      onClick={() => navigate("/panel")}
      aria-label="Volver"
      darkBg
    >
      <FiArrowLeft className="w-4 h-4" />
      <span className="hidden md:block">Volver</span>
    </SecondaryButton>
  );
}

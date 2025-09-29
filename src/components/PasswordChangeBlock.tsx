import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CustomInput } from "@/components/ui/CustomInput";
import { FiKey } from "react-icons/fi";
import SecondaryButton from "@/components/ui/SecondaryButton";
import PrimaryButton from "./ui/PrimaryButton";

interface PasswordChangeBlockProps {
  onMessage: (message: { type: "success" | "error"; text: string }) => void;
}

export function PasswordChangeBlock({ onMessage }: PasswordChangeBlockProps) {
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState<string>("");
  const [localMessage, setLocalMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const changePassword = async () => {
    setPasswordError("");
    setLocalMessage(null);

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError("Las contraseñas no coinciden");
      onMessage({
        type: "error",
        text: "Las contraseñas no coinciden",
      });
      return;
    }

    if (passwordData.new.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      onMessage({
        type: "error",
        text: "La contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });

      if (error) throw error;

      const successMessage = {
        type: "success" as const,
        text: "Contraseña actualizada correctamente",
      };

      setLocalMessage(successMessage);
      onMessage(successMessage);
      setPasswordData({ current: "", new: "", confirm: "" });

      setTimeout(() => setLocalMessage(null), 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      const errorMessage = "Error cambiando contraseña";
      setPasswordError(errorMessage);
      onMessage({
        type: "error",
        text: errorMessage,
      });
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/10">
      <div className="flex items-center gap-3 pb-6">
        <FiKey className="text-2xl text-teal" />
        <h2 className="text-2xl font-bold text-white">Cambiar Contraseña</h2>
      </div>

      {localMessage && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            localMessage.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {localMessage.text}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <CustomInput
          label="Nueva contraseña"
          type="password"
          value={passwordData.new}
          onChange={(e) =>
            setPasswordData((prev) => ({ ...prev, new: e.target.value }))
          }
          placeholder="Mínimo 6 caracteres"
          error={passwordError && passwordData.new ? passwordError : undefined}
        />

        <CustomInput
          label="Confirmar contraseña"
          type="password"
          value={passwordData.confirm}
          onChange={(e) =>
            setPasswordData((prev) => ({
              ...prev,
              confirm: e.target.value,
            }))
          }
          placeholder="Repite la nueva contraseña"
          error={
            passwordError && passwordData.confirm ? passwordError : undefined
          }
        />

        <div className="flex flex-col md:flex-row gap-2">
          <PrimaryButton
            onClick={changePassword}
            disabled={!passwordData.new || !passwordData.confirm}
            className="flex-1"
          >
            Actualizar <span className="hidden md:block">Contraseña</span>
          </PrimaryButton>
          <SecondaryButton
            onClick={() => {
              setPasswordData({ current: "", new: "", confirm: "" });
              setPasswordError("");
              setLocalMessage(null);
            }}
            className="px-4 py-2 flex-1"
            borderColor="white"
          >
            Cancelar
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

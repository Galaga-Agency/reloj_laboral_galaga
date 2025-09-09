import { useState } from "react";
import { CustomInput } from "@/components/ui/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

interface CreateUserFormProps {
  onSubmit: (userData: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  editingUser?: {
    id: string;
    nombre: string;
    email: string;
    isAdmin: boolean;
  } | null;
}

export interface UserFormData {
  nombre: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

export function CreateUserForm({
  onSubmit,
  onCancel,
  isLoading,
  editingUser,
}: CreateUserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    nombre: editingUser?.nombre || "",
    email: editingUser?.email || "",
    password: "",
    isAdmin: editingUser?.isAdmin || false,
  });
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!editingUser && !formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleInputChange =
    (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === "isAdmin" ? e.target.checked : e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <CustomInput
        label="Nombre completo"
        type="text"
        value={formData.nombre}
        onChange={handleInputChange("nombre")}
        error={errors.nombre}
        placeholder="Ingresa el nombre completo"
        disabled={isLoading}
        required
      />

      <CustomInput
        label="Email"
        type="email"
        value={formData.email}
        onChange={handleInputChange("email")}
        error={errors.email}
        placeholder="ejemplo@correo.com"
        disabled={isLoading}
        required
      />

      <CustomInput
        label={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
        type="password"
        value={formData.password}
        onChange={handleInputChange("password")}
        error={errors.password}
        placeholder={
          editingUser
            ? "Dejar vacío para mantener actual"
            : "Mínimo 6 caracteres"
        }
        helperText={
          editingUser
            ? "Solo completa si quieres cambiar la contraseña"
            : "Mínimo 6 caracteres"
        }
        disabled={isLoading}
        required={!editingUser}
      />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isAdmin"
          checked={formData.isAdmin}
          onChange={handleInputChange("isAdmin")}
          disabled={isLoading}
          className="w-4 h-4 text-teal bg-blanco border-hielo/50 rounded focus:ring-teal focus:ring-2"
        />
        <label
          htmlFor="isAdmin"
          className="text-sm font-medium text-azul-profundo"
        >
          Otorgar permisos de administrador
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <SecondaryButton
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </SecondaryButton>
        <PrimaryButton disabled={isLoading} className="flex-1">
          {isLoading
            ? "Guardando..."
            : editingUser
            ? "Actualizar Usuario"
            : "Crear Usuario"}
        </PrimaryButton>
      </div>
    </form>
  );
}

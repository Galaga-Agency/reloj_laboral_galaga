interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Cargando..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-azul-profundo to-teal flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border-2 border-blanco border-t-transparent rounded-full animate-spin"></div>
        <span className="text-blanco text-lg">{message}</span>
      </div>
    </div>
  );
}

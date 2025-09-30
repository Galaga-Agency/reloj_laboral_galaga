import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi";

export type ToastType = "success" | "error" | "warning";

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setIsVisible(false), duration);
    const removeTimer = setTimeout(() => onClose(), duration + 300);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  const styles = {
    success: "bg-green-500/90 border-green-400 text-white",
    error: "bg-red-500/90 border-red-400 text-white",
    warning: "bg-yellow-500/90 border-yellow-400 text-white",
  };

  const icons = {
    success: <FiCheckCircle className="w-5 h-5" />,
    error: <FiXCircle className="w-5 h-5" />,
    warning: <FiAlertTriangle className="w-5 h-5" />,
  };

  const toastContent = (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 
        flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border z-[99999]
        ${styles[type]} 
        ${isVisible ? "animate-fade-in-down" : "animate-fade-out-up"}`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => setIsVisible(false)}
        className="ml-3 text-white/80 hover:text-white focus:outline-none"
      >
        ✕
      </button>
    </div>
  );

  return createPortal(toastContent, document.body);
}

import Toastify from "toastify-js";
import "@/assets/css/vendors/toastify.css";

export type ToastType = "success" | "error" | "info" | "warning";

function resolveBackground(type: ToastType) {
  switch (type) {
    case "success":
      return "linear-gradient(to right, #22c55e, #16a34a)";
    case "error":
      return "linear-gradient(to right, #ef4444, #dc2626)";
    case "warning":
      return "linear-gradient(to right, #f97316, #ea580c)";
    default:
      return "linear-gradient(to right, #3b82f6, #2563eb)";
  }
}

export function showToast(message: string, type: ToastType = "info") {
  Toastify({
    text: message,
    duration: 4000,
    close: true,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    style: {
      background: resolveBackground(type),
      color: "white",
    },
  }).showToast();
}

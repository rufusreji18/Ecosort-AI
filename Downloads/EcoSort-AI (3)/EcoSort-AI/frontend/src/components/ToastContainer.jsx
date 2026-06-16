import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import "../styles/Toast.css";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <FiCheckCircle size={20} />;
      case "error":
        return <FiAlertCircle size={20} />;
      case "info":
        return <FiInfo size={20} />;
      default:
        return <FiCheckCircle size={20} />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-icon">{getIcon(toast.type)}</div>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
          >
            <FiX size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}

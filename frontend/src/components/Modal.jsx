// src/components/Modal.jsx
import ReactDOM from "react-dom";

const Modal = ({ children, onClose }) => {
  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg p-8 min-w-[300px] shadow-xl z-[1001]"
      >
        {children}
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default Modal;

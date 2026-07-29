import './ConfirmModal.css';

export default function ConfirmModal({ 
  isOpen, 
  title = "Sign Out", 
  message = "Are you sure you want to sign out?", 
  onConfirm, 
  onCancel, 
  confirmText = "Sign Out", 
  cancelText = "Cancel" 
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-card">
        <div className="confirm-modal-header">
          <span className="confirm-modal-icon">🚪</span>
          <h2 className="confirm-modal-title">{title}</h2>
        </div>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-btn-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="confirm-btn-action" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

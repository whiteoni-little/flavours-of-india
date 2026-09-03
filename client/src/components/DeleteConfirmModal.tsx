import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  productTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  productTitle,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(32, 27, 22, 0.65)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
        padding: "16px",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div
        style={{
          background: "var(--raised)",
          border: "1px solid var(--border)",
          maxWidth: "480px",
          width: "100%",
          padding: "32px",
          boxShadow: "0 20px 40px rgba(32, 27, 22, 0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#F3E0D8",
                color: "var(--terracotta)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h2
              id="delete-dialog-title"
              style={{ font: "600 22px var(--font-serif)", margin: 0 }}
            >
              Archive product?
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              background: "none",
              border: 0,
              color: "var(--muted)",
              padding: "4px",
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p
          style={{
            color: "var(--secondary)",
            fontSize: "14px",
            lineHeight: "1.6",
            margin: "0 0 24px",
          }}
        >
          Are you sure you want to archive <strong>{productTitle}</strong>? This
          product will be immediately removed from the active catalogue and will
          no longer be visible to customers.
        </p>

        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              background: "var(--sunken)",
              color: "var(--secondary)",
              padding: "10px 20px",
              fontWeight: 500,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              background: "var(--terracotta)",
              color: "var(--ivory)",
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: isDeleting ? "not-allowed" : "pointer",
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            {isDeleting ? "Archiving..." : "Archive product"}
          </button>
        </div>
      </div>
    </div>
  );
}

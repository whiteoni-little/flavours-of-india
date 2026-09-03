import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  HelpCircle,
  UploadCloud,
  XCircle,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

interface DryRunResult {
  fileName: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  canCommit: boolean;
  errors: Array<{ row: number; field: string; message: string }>;
  preview: any[];
  validatedData: any[];
}

export default function AdminImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setDryRunResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setDryRunResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const runDryRun = async () => {
    if (!selectedFile) {
      toast.error("Please select a CSV or XLSX file first");
      return;
    }

    setIsDryRunning(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/admin/spreadsheet/dry-run", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDryRunResult(data);
        if (data.canCommit) {
          toast.success(`Dry run complete: ${data.validCount} valid products ready for import!`);
        } else {
          toast.error(`Dry run found ${data.errorCount} validation error(s). Please review below.`);
        }
      } else {
        toast.error(data.message || "Failed to parse spreadsheet");
      }
    } catch (err: any) {
      toast.error("Network error executing dry run");
    } finally {
      setIsDryRunning(false);
    }
  };

  const commitImport = async () => {
    if (!dryRunResult || !dryRunResult.canCommit) return;

    setIsCommitting(true);
    try {
      const res = await fetch("/api/admin/spreadsheet/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: dryRunResult.fileName,
          rows: dryRunResult.validatedData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Import successfully committed!");
        setDryRunResult(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(data.message || "Failed to commit import");
      }
    } catch (err) {
      toast.error("Network error committing import");
    } finally {
      setIsCommitting(false);
    }
  };

  const downloadTemplate = (type: "products" | "payments") => {
    window.open(`/api/admin/spreadsheet/template/${type}`, "_blank");
  };

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Data Operations & Import</p>
          <h1>Spreadsheet Import</h1>
        </div>
      </div>

      {/* Guide Cards */}
      <section className="admin-grid" style={{ marginBottom: "24px" }}>
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Catalogue Guidelines</p>
              <h2>Required Column Schema</h2>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--secondary)", lineHeight: "1.6" }}>
            Upload standard product catalogue data in <strong>CSV</strong> or <strong>Excel (.xlsx)</strong> format.
            The spreadsheet import engine validates all slugs, SKU codes, rupee prices (converted safely to paise), and publishing status before writing to the database.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button
              onClick={() => downloadTemplate("products")}
              className="quiet-button"
              style={{ fontSize: "12px", padding: "8px 14px" }}
            >
              <Download size={15} /> Download Product Template (.csv)
            </button>
            <button
              onClick={() => downloadTemplate("payments")}
              className="quiet-button"
              style={{ fontSize: "12px", padding: "8px 14px" }}
            >
              <Download size={15} /> Download Reconciliation Template (.csv)
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Safety Protocols</p>
              <h2>Safe Dry-Run Guarantee</h2>
            </div>
          </div>
          <ul style={{ fontSize: "13px", color: "var(--secondary)", lineHeight: "1.7", paddingLeft: "18px", margin: 0 }}>
            <li>No data is committed until you inspect the dry-run results.</li>
            <li>Duplicate slug errors and missing price warnings are flagged immediately.</li>
            <li>Existing products with matching slugs are updated; new ones are created.</li>
            <li>Large images are linked via URLs without bloating the database.</li>
          </ul>
        </div>
      </section>

      {/* Upload Dropzone */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: "8px",
            padding: "36px 20px",
            textAlign: "center",
            background: "var(--sunken)",
            cursor: "pointer",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, .xlsx, .xls"
            style={{ display: "none" }}
          />
          <UploadCloud size={40} strokeWidth={1.5} style={{ margin: "0 auto 12px", color: "var(--terracotta)" }} />
          <h3 style={{ font: "600 16px var(--font-serif)", margin: "0 0 6px" }}>
            {selectedFile ? selectedFile.name : "Drag and drop your spreadsheet here"}
          </h3>
          <p style={{ fontSize: "12px", color: "var(--muted)", margin: "0 0 16px" }}>
            Supports CSV, Excel (.xlsx, .xls) up to 10MB
          </p>
          <button
            type="button"
            className="quiet-button"
            style={{ display: "inline-flex", background: "#fff" }}
            onClick={e => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <FileSpreadsheet size={15} /> Select File from Device
          </button>
        </div>

        {selectedFile && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <div style={{ fontSize: "13px" }}>
              Selected file: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
            <button
              onClick={runDryRun}
              className="primary-button"
              disabled={isDryRunning}
            >
              {isDryRunning ? "Validating Spreadsheet..." : "Execute Dry Run Validation"}
            </button>
          </div>
        )}
      </div>

      {/* Dry Run Results Preview */}
      {dryRunResult && (
        <div className="panel" style={{ marginBottom: "24px" }}>
          <div className="panel-heading" style={{ marginBottom: "16px" }}>
            <div>
              <p className="eyebrow">Validation Summary</p>
              <h2>Dry Run Results</h2>
            </div>
            {dryRunResult.canCommit && (
              <button
                onClick={commitImport}
                className="primary-button"
                style={{ background: "var(--olive)" }}
                disabled={isCommitting}
              >
                {isCommitting ? "Importing..." : `Commit ${dryRunResult.validCount} Products to Database`}
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
            <div className="metric-card" style={{ padding: "16px" }}>
              <span>Total Rows</span>
              <strong>{dryRunResult.totalRows}</strong>
            </div>
            <div className="metric-card" style={{ padding: "16px" }}>
              <span>Valid Products</span>
              <strong style={{ color: "var(--olive)" }}>{dryRunResult.validCount}</strong>
            </div>
            <div className="metric-card" style={{ padding: "16px" }}>
              <span>Validation Errors</span>
              <strong style={{ color: dryRunResult.errorCount > 0 ? "var(--terracotta)" : "var(--muted)" }}>
                {dryRunResult.errorCount}
              </strong>
            </div>
          </div>

          {/* Errors Breakdown */}
          {dryRunResult.errors.length > 0 && (
            <div style={{ marginBottom: "24px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991B1B", fontWeight: 600, marginBottom: "8px", fontSize: "14px" }}>
                <XCircle size={18} /> Please fix the following errors in your spreadsheet:
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "#7F1D1D" }}>
                {dryRunResult.errors.map((err, idx) => (
                  <li key={idx} style={{ marginBottom: "4px" }}>
                    Row <strong>{err.row}</strong> [{err.field}]: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid Rows Preview Table */}
          {dryRunResult.preview.length > 0 && (
            <div>
              <h3 style={{ font: "600 14px var(--font-sans)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                Data Preview (First {dryRunResult.preview.length} Rows)
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ width: "100%", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--sunken)", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>Row</th>
                      <th style={{ padding: "10px" }}>SKU / Slug</th>
                      <th style={{ padding: "10px" }}>Title</th>
                      <th style={{ padding: "10px" }}>Category</th>
                      <th style={{ padding: "10px" }}>Price (INR)</th>
                      <th style={{ padding: "10px" }}>Stock</th>
                      <th style={{ padding: "10px" }}>Publish State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dryRunResult.preview.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px" }}>#{row.rowNumber}</td>
                        <td style={{ padding: "10px" }}>
                          <code>{row.slug}</code>
                          {row.sku && <small style={{ display: "block", color: "var(--muted)" }}>{row.sku}</small>}
                        </td>
                        <td style={{ padding: "10px", fontWeight: 500 }}>{row.title}</td>
                        <td style={{ padding: "10px" }}>{row.category}</td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>₹{row.price_inr}</td>
                        <td style={{ padding: "10px" }}>{row.stock_quantity} ({row.stock_status})</td>
                        <td style={{ padding: "10px" }}>
                          {row.is_published ? (
                            <span style={{ color: "var(--olive)", fontWeight: 600 }}>Published</span>
                          ) : (
                            <span style={{ color: "var(--gold)" }}>Draft</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

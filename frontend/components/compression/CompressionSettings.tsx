"use client";

import { useState } from "react";
import { Settings, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface CompressionSettingsPanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CompressionSettingsPanel({ title, children, defaultOpen = true }: CompressionSettingsPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "24px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "var(--editor-workspace)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(7,140,145,0.4)";
          e.currentTarget.style.background = "var(--teal-light)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--editor-workspace)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Settings size={18} style={{ color: "var(--primary-teal)" }} />
          <span style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-primary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            {title}
          </span>
        </div>
        {open ? <ChevronUp size={18} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={18} style={{ color: "var(--text-muted)" }} />}
      </button>
      {open && (
        <div style={{
          padding: "20px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          animation: "slideUp 0.3s ease forwards",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export function CompressionSelect({
  label,
  value,
  onChange,
  options,
  disabled,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="neon-input"
        style={{ padding: "10px 12px", fontSize: "13px", width: "100%" }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{helperText}</p>
      )}
    </div>
  );
}

export function CompressionSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  unit = "%",
  disabled,
  marks,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  marks?: { value: number; label: string }[];
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </label>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        style={{ width: "100%", accentColor: "var(--primary-teal)" }}
      />
      {marks && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "10px", color: "var(--text-muted)" }}>
          {marks.map(mark => (
            <span key={mark.value}>{mark.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompressionToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)", marginTop: "2px", flexShrink: 0 }}
      />
      <div>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{label}</span>
        {description && (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", margin: 0 }}>{description}</p>
        )}
      </div>
    </label>
  );
}

export function CompressionRadioGroup({
  label,
  value,
  onChange,
  options,
  disabled,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
  disabled?: boolean;
  helperText?: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {options.map(opt => (
          <label
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px 16px",
              background: value === opt.value ? "var(--teal-light)" : "var(--bg-card)",
              border: value === opt.value ? "1px solid rgba(7,140,145,0.24)" : "1px solid var(--border)",
              borderRadius: "10px",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <input
              type="radio"
              name={`compression-${label.replace(/\s+/g, '-')}`}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              style={{ width: "18px", height: "18px", accentColor: "var(--primary-teal)", marginTop: "2px", flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{opt.label}</span>
              {opt.description && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", margin: 0 }}>{opt.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      {helperText && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>{helperText}</p>
      )}
    </div>
  );
}

export function InfoBox({ children, title = "Notes" }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      padding: "16px",
      background: "var(--editor-workspace)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      marginTop: "24px",
    }}>
      <HelpCircle size={18} style={{ color: "var(--primary-teal)", flexShrink: 0, marginTop: "1px" }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" }}>{title}</p>
        <ul style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, paddingLeft: "20px", lineHeight: 1.8 }}>
          {children}
        </ul>
      </div>
    </div>
  );
}

export function InfoItem({ children }: { children: React.ReactNode }) {
  return <li>{children}</li>;
}
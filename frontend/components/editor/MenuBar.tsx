"use client";

const ITEMS = ["File", "Edit", "Insert", "Format", "Tools", "View", "Help"];

export default function MenuBar() {
  return (
    <div
      id="menubar"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e0e0e0",
        padding: "2px 12px",
        display: "flex",
        gap: 2,
        flexShrink: 0,
      }}
    >
      {ITEMS.map((item) => (
        <button
          key={item}
          className="menu-item"
          style={{
            padding: "5px 12px",
            fontSize: 13,
            color: "#3c3c3c",
            borderRadius: 4,
            cursor: "pointer",
            border: "none",
            background: "none",
            transition: "background 0.1s",
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

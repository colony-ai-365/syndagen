// Sidebar.tsx
import React from "react";

const sections = [
  { key: "configs", label: "Configs" },
  { key: "dataset-upload", label: "Dataset Upload" },
  { key: "dataset-manage", label: "Dataset Manage" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" },
];

export default function Sidebar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <aside className="h-screen w-64 bg-gradient-to-b from-blue-50 to-blue-100 border-r shadow-lg flex flex-col py-8 px-2 rounded-r-2xl">
      <nav className="flex flex-col gap-2">
        {sections.map((section) => (
          <button
            key={section.key}
            className={`text-left px-5 py-3 rounded-lg font-semibold transition-colors text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
              ${
                selected === section.key
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-transparent text-blue-900 hover:bg-blue-200"
              }
            `}
            onClick={() => onSelect(section.key)}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

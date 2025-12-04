"use client";
// Sidebar.tsx
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { key: "configs", label: "Configs" },
  { key: "dataset-upload", label: "Dataset Upload" },
  { key: "dataset-manage", label: "Dataset Manage" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="h-screen w-64 bg-linear-to-b from-blue-50 to-blue-100 border-r shadow-lg flex flex-col py-8 px-2 rounded-r-2xl">
      <nav className="flex flex-col gap-2">
        {sections.map((section) => (
          <Link
            key={section.key}
            href={`/${section.key}`}
            className={`px-5 py-3 rounded-lg font-semibold transition-colors text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-left
              ${
                pathname === `/${section.key}`
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-transparent text-blue-900 hover:bg-blue-200"
              }
            `}
          >
            {section.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

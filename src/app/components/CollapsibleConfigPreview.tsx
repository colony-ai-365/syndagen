"use client";

import { useState } from "react";

type CollapsibleConfigPreviewProps = {
  config: any;
  onTestApi?: () => void;
  testLoading?: boolean;
  testResult?: any;
  testError?: string;
};

export default function CollapsibleConfigPreview({
  config,
  onTestApi,
  testLoading,
  testResult,
  testError,
}: CollapsibleConfigPreviewProps) {
  const [open, setOpen] = useState(false);
  if (!config) return null;
  return (
    <div
      style={{
        background: "#f9f9f9",
        padding: 16,
        borderRadius: 6,
        maxWidth: 600,
        marginTop: 16,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 0, flex: 1 }}>
          Config Details
        </h2>
        <span style={{ fontSize: 22, marginLeft: 8 }}>{open ? "▼" : "►"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div>
            <b>ID:</b> {config.id}
          </div>
          <div>
            <b>Name:</b> {config.name}
          </div>
          <div>
            <b>Route:</b> {config.route}
          </div>
          <div>
            <b>Method:</b> {config.method}
          </div>
          <div>
            <b>Field:</b> {config.field}
          </div>
          <div>
            <b>Created At:</b> {config.created_at}
          </div>
          <div>
            <b>Updated At:</b> {config.updated_at}
          </div>
          <div style={{ marginTop: 10 }}>
            <b>Headers:</b>
            <pre style={{ background: "#f4f4f4", padding: 8, borderRadius: 4 }}>
              {JSON.stringify(JSON.parse(config.headers || "{}"), null, 2)}
            </pre>
          </div>
          <div style={{ marginTop: 10 }}>
            <b>Additional Fields:</b>
            <pre style={{ background: "#f4f4f4", padding: 8, borderRadius: 4 }}>
              {JSON.stringify(
                JSON.parse(config.additional_fields || "{}"),
                null,
                2
              )}
            </pre>
          </div>
          <div style={{ marginTop: 10 }}>
            <b>Prompt:</b>
            <pre
              style={{
                background: "#f4f4f4",
                padding: 8,
                borderRadius: 4,
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.parse(config.prompt || '""').prompt || ""}
            </pre>
          </div>
          <div style={{ marginTop: 10 }}>
            <b>Variables:</b>
            <pre style={{ background: "#f4f4f4", padding: 8, borderRadius: 4 }}>
              {JSON.stringify(JSON.parse(config.variables || "{}"), null, 2)}
            </pre>
          </div>
          <div style={{ marginTop: 10 }}>
            <b>Schema:</b>
            <pre style={{ background: "#f4f4f4", padding: 8, borderRadius: 4 }}>
              {JSON.stringify(JSON.parse(config.schema || "[]"), null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// useSaveConfig.ts
// Hook for saving request configuration changes

import { useState } from "react";

export function useSaveConfig() {
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const saveConfig = async (id: string | undefined, payload: any) => {
    setSaveLoading(true);
    setSaveMessage("");
    try {
      if (!id) {
        setSaveMessage("No config ID found.");
        setSaveLoading(false);
        return;
      }
      const res = await fetch(`/api/request-config/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMessage("Changes saved successfully.");
      } else {
        setSaveMessage(data.error || "Failed to save changes.");
      }
    } catch (err) {
      setSaveMessage("Failed to save changes.");
    }
    setSaveLoading(false);
  };

  return {
    saveLoading,
    saveMessage,
    saveConfig,
  };
}

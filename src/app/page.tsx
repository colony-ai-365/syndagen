// Home page for listing and managing saved request configs
"use client";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ConfigsSection from "./sections/ConfigsSection";
import DatasetUploadSection from "./sections/DatasetUploadSection";

export default function HomePage() {
  const [selectedSection, setSelectedSection] = useState<string>("configs");

  return (
    <div className="min-h-screen flex font-sans">
      <Sidebar selected={selectedSection} onSelect={setSelectedSection} />
      <main className="flex-1 p-8 flex flex-col items-center gap-8">
        {selectedSection === "configs" && <ConfigsSection />}
        {selectedSection === "dataset-upload" && <DatasetUploadSection />}
        {/* Future: Add other sections here */}
      </main>
    </div>
  );
}

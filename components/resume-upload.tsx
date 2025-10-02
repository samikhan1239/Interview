"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ExtractedData {
  name: string | null;
  email: string | null;
  phone: string | null;
  rawText: string;
}

interface ResumeUploadProps {
  onExtract: (data: ExtractedData) => void;
}

export function ResumeUpload({ onExtract }: ResumeUploadProps) {
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [manualInput, setManualInput] = useState<{
    name: string;
    email: string;
    phone: string;
  }>({ name: "", email: "", phone: "" });
  const [error, setError] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("📂 Uploading file:", file.name);
      const response = await fetch("/api/resume-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API error:", errorData);
        setError(errorData.error || "Failed to process file");
        setLoading(false);
        return;
      }

      const data: ExtractedData = await response.json();
      console.log("✅ API response:", data);
      setExtractedData(data);
      onExtract(data);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Failed to upload and process file");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedData) return;
    const updatedData: ExtractedData = {
      name: manualInput.name || extractedData.name,
      email: manualInput.email || extractedData.email,
      phone: manualInput.phone || extractedData.phone,
      rawText: extractedData.rawText,
    };
    setExtractedData(updatedData);
    onExtract(updatedData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualInput({
      ...manualInput,
      [e.target.name]: e.target.value,
    });
  };

  const isMissingFields = extractedData && (!extractedData.name || !extractedData.email || !extractedData.phone);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Input
          type="file"
          accept=".pdf,.docx"
          onChange={onChange}
          disabled={loading}
        />
        <div className="text-xs text-muted-foreground">
          {fileName ? `Selected: ${fileName}` : "Upload a PDF or DOCX file"}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading and extracting details...
          </div>
        )}
        {error && (
          <div className="text-sm text-red-500">
            {error}
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setFileName("");
            setExtractedData(null);
            setManualInput({ name: "", email: "", phone: "" });
            setError(null);
            onExtract({ name: null, email: null, phone: null, rawText: "" });
          }}
          disabled={loading}
        >
          Clear
        </Button>
      </div>

      {isMissingFields && (
        <form onSubmit={handleManualSubmit} className="grid gap-4 border-t pt-4">
          <h3 className="text-sm font-medium">Please provide missing details</h3>
          {!extractedData.name && (
            <div className="grid gap-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={manualInput.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
          )}
          {!extractedData.email && (
            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={manualInput.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
          )}
          {!extractedData.phone && (
            <div className="grid gap-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={manualInput.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                required
              />
            </div>
          )}
          <Button type="submit" disabled={loading}>
            Submit Details
          </Button>
        </form>
      )}
    </div>
  );
}
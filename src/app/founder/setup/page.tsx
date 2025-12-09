"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTORS } from "@/lib/constants";
import { FileUpload } from "@/components/file-upload";

export default function FounderSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSector, setSelectedSector] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!selectedSector) {
      setError("Please select a sector");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    // Validation: Require either file or deckLink (if we kept it, but we are replacing it with upload primarily)
    // If the file upload component is used, we expect 'file'
    if (!file) {
        // Fallback or error if no file selected
        // We will assume file upload is mandatory now as per user request to "add upload field"
        setError("Please upload your pitch deck");
        setIsLoading(false);
        return;
    }

    try {
      // Construct FormData for multipart/form-data request
      const submitData = new FormData();
      submitData.append("startupName", formData.get("startupName") as string);
      submitData.append("sector", selectedSector);
      submitData.append("askAmount", formData.get("askAmount") as string);
      submitData.append("file", file);

      const response = await fetch("/api/founder/profile", {
        method: "POST",
        // Note: Content-Type header is set automatically by browser for FormData with boundary
        body: submitData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to create profile");
      }

      router.push("/founder/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-black">Founder Profile Setup</h1>
          <p className="text-black">
            Tell us about your startup to get matched with the right VCs
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-black">Startup Information</CardTitle>
              <CardDescription className="text-black">Basic details about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startupName" className="text-black">Startup Name</Label>
                <Input
                  id="startupName"
                  name="startupName"
                  placeholder="Acme Inc."
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector" className="text-black">Sector</Label>
                <Select
                  value={selectedSector}
                  onValueChange={setSelectedSector}
                  disabled={isLoading}
                  required
                >
                  <SelectTrigger id="sector">
                    <SelectValue placeholder="Select your sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-black">
                  Choose the sector that best describes your startup
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="askAmount" className="text-black">Fundraising Amount ($)</Label>
                <Input
                  id="askAmount"
                  name="askAmount"
                  type="number"
                  placeholder="1000000"
                  min="0"
                  step="1000"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-black">
                  How much are you looking to raise in this round?
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-black">Pitch Deck</CardTitle>
              <CardDescription className="text-black">
                Upload your deck so VCs can learn more about your startup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-black">Upload PDF</Label>
                <FileUpload onFileSelect={setFile} selectedFile={file} />
              </div>

              <div className="rounded-lg border bg-zinc-50 p-4">
                <h4 className="mb-2 font-medium text-black">What happens next?</h4>
                <ul className="space-y-1 text-sm text-black">
                  <li>✓ We&apos;ll analyze your deck using AI</li>
                  <li>✓ Match you with VCs looking for your sector</li>
                  <li>✓ Validate thesis fit before sending</li>
                  <li>✓ Get instant feedback on your match quality</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating Profile..." : "Create Profile & Find VCs"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTORS } from "@/lib/constants";

export default function FounderSetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSector, setSelectedSector] = useState("");
  const [error, setError] = useState("");

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
    const data = {
      startupName: formData.get("startupName") as string,
      sector: selectedSector,
      askAmount: parseInt(formData.get("askAmount") as string),
      deckLink: formData.get("deckLink") as string,
    };

    try {
      const response = await fetch("/api/founder/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
                Share your deck so VCs can learn more about your startup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deckLink" className="text-black">Pitch Deck URL</Label>
                <Input
                  id="deckLink"
                  name="deckLink"
                  type="url"
                  placeholder="https://docsend.com/your-deck"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-black">
                  Link to your pitch deck (DocSend, Google Drive, Dropbox, etc.)
                </p>
              </div>

              <div className="rounded-lg border bg-zinc-50 p-4">
                <h4 className="mb-2 font-medium text-black">What happens next?</h4>
                <ul className="space-y-1 text-sm text-black">
                  <li>✓ We'll analyze your deck using AI</li>
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

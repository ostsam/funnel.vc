"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SECTORS } from "@/lib/constants";

export default function VCSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [error, setError] = useState("");

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (selectedSectors.length === 0) {
      setError("Please select at least one sector");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      firmName: formData.get("firmName") as string,
      thesis: formData.get("thesis") as string,
      minCheck: parseInt(formData.get("minCheck") as string),
      maxCheck: parseInt(formData.get("maxCheck") as string),
      sectors: selectedSectors,
      mondayBoardId: formData.get("mondayBoardId") as string,
      slug: formData.get("slug") as string,
    };

    try {
      const response = await fetch("/api/vc/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to create profile");
      }

      const result = await response.json();
      router.push(`/${result.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-black">VC Profile Setup</h1>
          <p className="text-black">
            Create your public profile and define your investment thesis
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
              <CardTitle className="text-black">Basic Information</CardTitle>
              <CardDescription className="text-black">Your firm details and public profile URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firmName" className="text-black">Firm Name</Label>
                <Input
                  id="firmName"
                  name="firmName"
                  placeholder="Acme Ventures"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-black">Profile URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-black">funnel.vc/</span>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="acme"
                    pattern="[a-z0-9-]+"
                    required
                    disabled={isLoading}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-black">Lowercase letters, numbers, and hyphens only</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-black">Investment Thesis</CardTitle>
              <CardDescription className="text-black">Define what you&apos;re looking for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thesis" className="text-black">Thesis Statement</Label>
                <Textarea
                  id="thesis"
                  name="thesis"
                  placeholder="We invest in B2B SaaS companies with strong product-market fit, targeting mid-market enterprises. We look for technical founders with domain expertise..."
                  rows={6}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-black">
                  Be specific. This helps our AI match you with the right founders.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minCheck" className="text-black">Min Check Size ($)</Label>
                  <Input
                    id="minCheck"
                    name="minCheck"
                    type="number"
                    placeholder="100000"
                    min="0"
                    step="1000"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCheck" className="text-black">Max Check Size ($)</Label>
                  <Input
                    id="maxCheck"
                    name="maxCheck"
                    type="number"
                    placeholder="5000000"
                    min="0"
                    step="1000"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-black">Target Sectors</CardTitle>
              <CardDescription className="text-black">Select all sectors you invest in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {SECTORS.map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={sector}
                      checked={selectedSectors.includes(sector)}
                      onCheckedChange={() => toggleSector(sector)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={sector}
                      className="text-sm font-medium leading-none text-black peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {sector}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-black">Monday.com Integration</CardTitle>
              <CardDescription className="text-black">Connect your CRM for automatic deal tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mondayBoardId" className="text-black">Monday Board ID (Optional)</Label>
                <Input
                  id="mondayBoardId"
                  name="mondayBoardId"
                  placeholder="1234567890"
                  disabled={isLoading}
                />
                <p className="text-xs text-black">
                  Matched founders will automatically appear in your Monday.com board
                </p>
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
              {isLoading ? "Creating Profile..." : "Create Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

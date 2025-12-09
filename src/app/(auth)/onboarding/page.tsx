"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuthLayout from "@/components/auth-layout";
import { Building2, Rocket } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"vc" | "founder" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      // Redirect based on role
      if (selectedRole === "vc") {
        router.push("/vc/settings");
      } else {
        router.push("/founder/setup");
      }
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-black">Welcome to Funnel.vc</h1>
          <p className="text-black">
            Let&apos;s get you set up. Choose your role to continue.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className={`cursor-pointer border-zinc-200 transition-all hover:border-blue-600 hover:shadow-lg ${
              selectedRole === "founder" ? "border-blue-600 ring-2 ring-blue-600" : ""
            }`}
            onClick={() => setSelectedRole("founder")}
          >
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Rocket className="h-6 w-6" />
              </div>
              <CardTitle className="text-black">I&apos;m a Founder</CardTitle>
              <CardDescription className="text-black">
                Get matched with VCs who are actively looking for startups in your sector
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-black">
                <li>✓ AI-powered matching</li>
                <li>✓ Instant thesis validation</li>
                <li>✓ Direct investor connections</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-zinc-200 transition-all hover:border-blue-600 hover:shadow-lg ${
              selectedRole === "vc" ? "border-blue-600 ring-2 ring-blue-600" : ""
            }`}
            onClick={() => setSelectedRole("vc")}
          >
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <CardTitle className="text-black">I&apos;m a VC</CardTitle>
              <CardDescription className="text-black">
                Publish your thesis and receive pre-qualified deal flow that matches your criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-black">
                <li>✓ Thesis-gated submissions</li>
                <li>✓ AI-validated matches</li>
                <li>✓ Auto-CRM integration</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedRole || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </AuthLayout>
  );
}

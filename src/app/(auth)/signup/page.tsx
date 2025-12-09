"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AuthLayout from "@/components/auth-layout";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: roleParam, // Use the role from the URL
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create account");
      }

      // After signup, go to onboarding
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!roleParam) {
    return (
      <AuthLayout>
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Choose Your Role</CardTitle>
            <CardDescription className="text-black">
              Please select whether you are a Founder or a VC to proceed with signup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Link href="/signup?role=founder" className="w-full">
              <Button className="w-full">
                I&apos;m a Founder
              </Button>
            </Link>
            <Link href="/signup?role=vc" className="w-full">
              <Button variant="outline" className="w-full">
                I&apos;m a VC
              </Button>
            </Link>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-black w-full">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Create Account</CardTitle>
          <CardDescription className="text-black">
            {roleParam === "vc"
              ? "Join as a VC to receive thesis-matched deal flow"
              : "Join as a Founder to get matched with the right investors"
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-black">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="founder@startup.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-center text-sm text-black">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  );
}

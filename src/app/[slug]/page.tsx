import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, DollarSign, Target, ArrowLeft } from "lucide-react";
import { db } from "@/db/client";
import { vcProfile } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getVCProfile(slug: string) {
  const profile = await db.query.vcProfile.findFirst({
    where: eq(vcProfile.slug, slug),
  });

  if (!profile) return null;

  // sectors is stored as a JSON string in the DB
  let parsedSectors: string[] = [];
  try {
    parsedSectors = JSON.parse(profile.sectors);
  } catch (e) {
    console.error("Failed to parse sectors for profile:", profile.id);
    parsedSectors = [];
  }

  return {
    ...profile,
    sectors: parsedSectors,
  };
}

export default async function VCProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getVCProfile(slug);

  if (!profile) {
    notFound();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Funnel.vc"
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup?role=founder">
              <Button>Pitch to This VC</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-black hover:text-blue-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-3xl text-black">{profile.firmName}</CardTitle>
                  <CardDescription className="text-base text-black">
                    funnel.vc/{profile.slug}
                  </CardDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-black">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>
                  {formatCurrency(profile.minCheck)} - {formatCurrency(profile.maxCheck)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>{profile.sectors.length} Sectors</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Investment Thesis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-black">Investment Thesis</CardTitle>
            <CardDescription className="text-black">What we&apos;re looking for</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-black">
              {profile.thesis}
            </p>
          </CardContent>
        </Card>

        {/* Target Sectors */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-black">Target Sectors</CardTitle>
            <CardDescription className="text-black">Industries we invest in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.sectors.map((sector: string) => (
                <Badge key={sector} variant="secondary">
                  {sector}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="border-blue-600 bg-blue-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Think you&apos;re a fit?</CardTitle>
            <CardDescription className="text-white">
              Get AI-validated matching before submitting your pitch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/signup?role=founder">
              <Button size="lg" variant="secondary" className="w-full">
                Create Free Account & Pitch
              </Button>
            </Link>
            <p className="mt-4 text-center text-sm text-white">
              Our AI will validate your thesis fit before forwarding to the VC
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-black">
          <p>© 2024 Funnel.vc. The Thesis-Driven Deal Flow Network.</p>
        </div>
      </footer>
    </div>
  );
}

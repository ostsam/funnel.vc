import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex justify-center">
              <Image
                src="/logo.png"
                alt="Funnel.vc"
                width={60}
                height={60}
                className="h-15 w-15"
              />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

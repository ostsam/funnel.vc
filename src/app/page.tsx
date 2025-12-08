import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Target, Zap, Brain, TrendingUp } from "lucide-react";

export default function Home() {
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
							className="h-8 w-8"
							priority
						/>
					</Link>
					<div className="flex items-center gap-4">
						<Link href="/login">
							<Button variant="ghost">Sign In</Button>
						</Link>
						<Link href="/signup">
							<Button>Get Started</Button>
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="container mx-auto px-4 py-20 md:py-32">
				<div className="mx-auto max-w-5xl text-center">
					<div className="mb-10 flex justify-center">
						<Image
							src="/full-name-logo.png"
							alt="Funnel.vc"
							width={1200}
							height={120}
							className="h-40 w-auto"
							priority
						/>
					</div>

					<h1 className="mb-6 text-4xl font-bold tracking-tight text-black md:text-6xl">
						Stop spray-and-pray.
						<br />
						<span className="text-blue-600">Match with intent.</span>
					</h1>
					<p className="mb-8 text-xl text-black md:text-2xl">
						Founders get algorithmically matched to VCs who actually want their
						sector.
						<br />
						VCs get deal flow that fits their thesis. Powered by AI.
					</p>
					<div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
						<Link href="/signup?role=founder">
							<Button size="lg" className="w-full sm:w-auto">
								I&apos;m a Founder
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						<Link href="/signup?role=vc">
							<Button size="lg" variant="outline" className="w-full text-black sm:w-auto">
								I&apos;m a VC
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Stats Section */}
			<section className="border-y bg-zinc-50 py-12">
				<div className="container mx-auto px-4">
					<div className="grid gap-8 md:grid-cols-3">
						<div className="text-center">
							<div className="mb-2 text-4xl font-bold text-black">95%</div>
							<div className="text-black">Match Accuracy</div>
						</div>
						<div className="text-center">
							<div className="mb-2 text-4xl font-bold text-black">2min</div>
							<div className="text-black">Average Setup Time</div>
						</div>
						<div className="text-center">
							<div className="mb-2 text-4xl font-bold text-black">10x</div>
							<div className="text-black">Response Rate</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="container mx-auto px-4 py-20">
				<div className="mb-12 text-center">
					<h2 className="mb-4 text-3xl font-bold text-black md:text-4xl">
						How It Works
					</h2>
					<p className="text-lg text-black">Three steps to better deal flow</p>
				</div>

				<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
					<Card className="border-zinc-200">
						<CardHeader>
							<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
								<Target className="h-6 w-6" />
							</div>
							<CardTitle className="text-black">VCs Publish Thesis</CardTitle>
							<CardDescription className="text-black">
								Define your sectors, check size, and investment thesis publicly
							</CardDescription>
						</CardHeader>
					</Card>

					<Card className="border-zinc-200">
						<CardHeader>
							<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
								<Brain className="h-6 w-6" />
							</div>
							<CardTitle className="text-black">AI Matching</CardTitle>
							<CardDescription className="text-black">
								Claude Sonnet 4.5 analyzes your pitch against VC theses for
								perfect fit
							</CardDescription>
						</CardHeader>
					</Card>

					<Card className="border-zinc-200">
						<CardHeader>
							<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
								<Zap className="h-6 w-6" />
							</div>
							<CardTitle className="text-black">Instant Validation</CardTitle>
							<CardDescription className="text-black">
								Get immediate feedback if your startup matches the thesis
							</CardDescription>
						</CardHeader>
					</Card>

					<Card className="border-zinc-200">
						<CardHeader>
							<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
								<TrendingUp className="h-6 w-6" />
							</div>
							<CardTitle className="text-black">Auto-CRM Sync</CardTitle>
							<CardDescription className="text-black">
								Matches flow directly into Monday.com for deal tracking
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</section>

			{/* CTA Section */}
			<section className="border-t bg-zinc-50 py-20">
				<div className="container mx-auto px-4 text-center">
					<h2 className="mb-4 text-3xl font-bold text-black md:text-4xl">
						Ready to stop wasting time?
					</h2>
					<p className="mb-8 text-lg text-black">
						Join the network where matching happens with intent, not luck.
					</p>
					<Link href="/signup">
						<Button size="lg">
							Get Started Now
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t bg-white py-8">
				<div className="container mx-auto px-4 text-center text-sm text-black">
					<p>© 2024 Funnel.vc. The Thesis-Driven Deal Flow Network.</p>
				</div>
			</footer>
		</div>
	);
}

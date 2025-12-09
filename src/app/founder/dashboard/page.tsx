"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Building2,
	DollarSign,
	Target,
	Sparkles,
	ExternalLink,
} from "lucide-react";

interface VCProfile {
	id: string;
	firmName: string;
	thesis: string;
	sectors: string[];
	minCheck: number;
	maxCheck: number;
	slug: string;
	matchScore?: number;
}

export default function FounderDashboard() {
	const [matches, setMatches] = useState<VCProfile[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedVC, setSelectedVC] = useState<VCProfile | null>(null);
	const [isPitching, setIsPitching] = useState(false);
	const [deckLink, setDeckLink] = useState("");
	const [savedDeckLink, setSavedDeckLink] = useState("");
	const [useSavedDeck, setUseSavedDeck] = useState(true);

	useEffect(() => {
		fetchProfile();
		fetchMatches();
	}, []);

	const fetchProfile = async () => {
		try {
			const response = await fetch("/api/founder/profile");
			if (!response.ok) {
				setUseSavedDeck(false);
				return;
			}
			const data = await response.json();
			const existingDeck = data.deckLink || "";
			setSavedDeckLink(existingDeck);
			setUseSavedDeck(Boolean(existingDeck));
			if (existingDeck) {
				setDeckLink(existingDeck);
			}
		} catch (error) {
			console.error("Error fetching profile:", error);
			setUseSavedDeck(false);
		}
	};

	const fetchMatches = async () => {
		try {
			const response = await fetch("/api/founder/matches");
			if (response.ok) {
				const data = await response.json();
				setMatches(data.matches || []);
			}
		} catch (error) {
			console.error("Error fetching matches:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePitch = async (vcId: string) => {
		const finalDeckLink = selectedDeckLink();
		if (!finalDeckLink) {
			alert("Please provide a pitch deck URL.");
			return;
		}

		setIsPitching(true);
		try {
			const response = await fetch("/api/pitch", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					vcId,
					deckLink: finalDeckLink,
				}),
			});

			if (response.ok) {
				const result = await response.json();
				alert(
					result.isMatch
						? "Match! Your pitch has been sent to the VC."
						: `Not a match: ${result.memo}`
				);
				setSelectedVC(null);
				setDeckLink("");
			}
		} catch (error) {
			console.error("Error submitting pitch:", error);
			alert("Failed to submit pitch");
		} finally {
			setIsPitching(false);
		}
	};

	const selectedDeckLink = () => {
		if (useSavedDeck && savedDeckLink) {
			return savedDeckLink;
		}
		return deckLink;
	};

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
			{/* Header */}
			<header className="border-b bg-white">
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
						<Link href="/founder/setup">
							<Button variant="ghost">Profile</Button>
						</Link>
					</div>
				</div>
			</header>

			<div className="container mx-auto px-4 py-12">
				<div className="mb-8">
					<h1 className="mb-2 text-3xl font-bold text-black">
						Your VC Matches
					</h1>
					<p className="text-black">
						AI-powered matches based on your startup profile and thesis fit
					</p>
				</div>

				{isLoading ? (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<Card key={i} className="animate-pulse">
								<CardHeader>
									<div className="h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800"></div>
									<div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800"></div>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800"></div>
										<div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800"></div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : matches.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Target className="mb-4 h-12 w-12 text-blue-600" />
							<h3 className="mb-2 text-lg font-semibold text-black">
								No matches yet
							</h3>
							<p className="mb-4 text-center text-black">
								Complete your profile to start getting matched with VCs
							</p>
							<Link href="/founder/setup">
								<Button>Complete Profile</Button>
							</Link>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{matches.map((vc) => (
							<Card key={vc.id} className="flex flex-col">
								<CardHeader>
									<div className="mb-2 flex items-start justify-between">
										<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
											<Building2 className="h-6 w-6" />
										</div>
										{vc.matchScore && (
											<Badge
												variant="secondary"
												className="flex items-center gap-1 border border-blue-100 bg-blue-50 text-black"
											>
												<Sparkles className="h-3 w-3" />
												{vc.matchScore}% Match
											</Badge>
										)}
									</div>
									<CardTitle className="text-black">{vc.firmName}</CardTitle>
									<CardDescription className="line-clamp-2 text-black">
										{vc.thesis}
									</CardDescription>
								</CardHeader>
								<CardContent className="flex-1 space-y-3">
									<div className="flex items-center gap-2 text-sm">
										<DollarSign className="h-4 w-4 text-blue-600" />
										<span className="text-black">
											{formatCurrency(vc.minCheck)} -{" "}
											{formatCurrency(vc.maxCheck)}
										</span>
									</div>
									<div className="flex flex-wrap gap-1">
										{vc.sectors.slice(0, 3).map((sector) => (
											<Badge
												key={sector}
												variant="outline"
												className="text-xs border-zinc-200 bg-white text-black"
											>
												{sector}
											</Badge>
										))}
										{vc.sectors.length > 3 && (
											<Badge
												variant="outline"
												className="text-xs border-zinc-200 bg-white text-black"
											>
												+{vc.sectors.length - 3} more
											</Badge>
										)}
									</div>
								</CardContent>
								<CardFooter className="flex gap-2">
									<Link href={`/${vc.slug}`} className="flex-1">
										<Button variant="outline" className="w-full text-black">
											<ExternalLink className="mr-2 h-4 w-4" />
											View Profile
										</Button>
									</Link>
									<Dialog>
										<DialogTrigger asChild>
											<Button
												className="flex-1"
												onClick={() => setSelectedVC(vc)}
											>
												Pitch Now
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-[520px] rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
											<DialogHeader className="space-y-2">
												<DialogTitle className="text-black">
													Pitch to {vc.firmName}
												</DialogTitle>
												<DialogDescription className="text-black">
													Choose the deck you want to send. Our AI will validate
													the match before forwarding.
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4 py-2">
												<div className="space-y-3">
													<p className="text-sm font-medium text-black">
														Select deck source
													</p>
													<div
														className={`flex items-start gap-3 rounded-lg border p-3 ${
															useSavedDeck
																? "border-blue-500"
																: "border-zinc-200"
														}`}
													>
														<input
															type="radio"
															id="use-saved-deck"
															name="deck-source"
															className="mt-1 h-4 w-4 text-blue-600"
															checked={useSavedDeck && Boolean(savedDeckLink)}
															onChange={() =>
																savedDeckLink && setUseSavedDeck(true)
															}
															disabled={!savedDeckLink}
														/>
														<div className="space-y-1">
															<div className="flex items-center gap-2">
																<Label
																	htmlFor="use-saved-deck"
																	className="text-black"
																>
																	Use saved deck
																</Label>
																{!savedDeckLink && (
																	<Badge
																		variant="outline"
																		className="text-xs border-zinc-200 bg-white text-black"
																	>
																		Not available
																	</Badge>
																)}
															</div>
															<p className="text-sm text-black">
																We&apos;ll send the deck you uploaded in your
																profile.
															</p>
															{savedDeckLink && (
																<p className="truncate text-sm font-mono text-black">
																	{savedDeckLink}
																</p>
															)}
														</div>
													</div>

													<div
														className={`space-y-2 rounded-lg border p-3 ${
															!useSavedDeck || !savedDeckLink
																? "border-blue-500"
																: "border-zinc-200"
														}`}
													>
														<div className="flex items-center gap-3">
															<input
																type="radio"
																id="use-new-deck"
																name="deck-source"
																className="h-4 w-4 text-blue-600"
																checked={!useSavedDeck || !savedDeckLink}
																onChange={() => setUseSavedDeck(false)}
															/>
															<Label
																htmlFor="use-new-deck"
																className="text-black"
															>
																Paste a different deck URL
															</Label>
														</div>
														<Input
															id="deckLink"
															type="url"
															placeholder="https://docsend.com/your-deck"
															className="text-black placeholder:text-black"
															value={deckLink}
															onChange={(e) => setDeckLink(e.target.value)}
															disabled={isPitching}
														/>
													</div>
												</div>

												<div className="rounded-lg border bg-zinc-50 p-3 text-sm text-black">
													<p className="font-medium">What happens next:</p>
													<ul className="mt-2 space-y-1">
														<li>
															1. AI analyzes your deck against their thesis
														</li>
														<li>
															2. If it&apos;s a match, your pitch goes to their
															Monday.com board
														</li>
														<li>
															3. If not, you&apos;ll get instant feedback on why
														</li>
													</ul>
												</div>
											</div>
											<DialogFooter className="gap-2">
												<Button
													className="w-full"
													onClick={() =>
														selectedVC && handlePitch(selectedVC.id)
													}
													disabled={!selectedDeckLink() || isPitching}
												>
													{isPitching ? "Submitting..." : "Submit Pitch"}
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</CardFooter>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

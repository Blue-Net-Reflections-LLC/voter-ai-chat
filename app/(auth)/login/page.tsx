'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ClipboardList, MapPin, UserCheck, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import useGoogleAnalytics from "@/hooks/useGoogleAnalytics";
import TrackingLink from "@/components/ui/TrackingLink";
import { googleAuthenticate } from '../actions';
import { GridPattern } from '@/components/ui/grid-pattern';
import { cn } from '@/lib/utils';

const fadeInUp = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: 0.5 }
};

export default function LoginPage() {
	const { trackEvent } = useGoogleAnalytics();

	const handleGoogleSignIn = async () => {
		trackEvent("signin", "cta", "Google Sign In", 0);
		await googleAuthenticate();
	};

	return (
		<div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
			<GridPattern
				className={cn(
					"[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)]",
					"opacity-20"
				)}
				width={40}
				height={40}
			/>
			<motion.header
				className="container mx-auto px-4 py-6 flex justify-between items-center"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<Link href="/">
					<Image
						src="/images/original-logo.svg"
						alt="VoterAI Logo"
						width={150}
						height={50}
						className="transition-transform hover:scale-105"
					/>
				</Link>
				<ThemeToggle />
			</motion.header>

			<main className="grow flex items-start justify-center px-4 py-12">
				<div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
					<motion.div
						className="w-full md:w-1/2"
						initial="initial"
						animate="animate"
						variants={fadeInUp}
					>
						<Card className="bg-background shadow-lg">
							<CardHeader>
								<h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center">Sign In</h1>
								<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
									Continue with your Google account
								</p>
							</CardHeader>
							<CardContent className="space-y-4">
								<Button 
									onClick={handleGoogleSignIn} 
									className="w-full flex items-center justify-center gap-2 bg-background hover:bg-muted text-foreground border border-border"
								>
									<Image 
										src="/images/google.svg" 
										alt="Google" 
										width={20} 
										height={20}
									/>
									Sign in with Google
								</Button>
							</CardContent>
						</Card>
					</motion.div>

					<motion.div
						className="w-full md:w-1/2 hidden md:block"
						initial="initial"
						animate="animate"
						variants={fadeInUp}
					>
						<p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 mt-8">
							Your intelligent assistant for accessing accurate, privacy-protected voter registration information in Georgia, USA.
						</p>
						<ul className="space-y-6 md:space-y-8">
							<li className="flex flex-col sm:flex-row sm:items-start">
								<ClipboardList className="size-8 mb-2 sm:mb-0 sm:mr-4 text-[#F74040]" />
								<span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Answer voter registration questions</span>
							</li>
							<li className="flex flex-col sm:flex-row sm:items-start">
								<MapPin className="size-8 mb-2 sm:mb-0 sm:mr-4 text-[#F74040]" />
								<span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Provide district and representative information</span>
							</li>
							<li className="flex flex-col sm:flex-row sm:items-start">
								<UserCheck className="size-8 mb-2 sm:mb-0 sm:mr-4 text-[#F74040]" />
								<span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Assist with Georgia voter registration process</span>
							</li>
							<li className="flex flex-col sm:flex-row sm:items-start">
								<BarChart2 className="size-8 mb-2 sm:mb-0 sm:mr-4 text-[#F74040]" />
								<span className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Identify campaign strengths and weaknesses</span>
							</li>
						</ul>
					</motion.div>
				</div>
			</main>
			<footer className="py-4 text-center text-sm text-gray-600 dark:text-gray-400">
				Developed by <TrackingLink href="mailto:horace.reid@bluenetreflections.com"
																	 category="login" action="developer-link"
																	 className="hover:underline">Horace Reid III</TrackingLink> @ 2024
			</footer>
		</div>
	);
}


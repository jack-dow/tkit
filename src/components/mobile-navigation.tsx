"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet";
import { useSession } from "~/app/providers";
import DogworxPawLogoGradient from "~/assets/dogworx-paw-logo-gradient.svg";
import { api } from "~/lib/trpc/client";
import { cn } from "~/lib/utils";
import { navigation } from "./dark-desktop-sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogOutIcon, MobileMenuIcon, UserIcon } from "./ui/icons";
import { Loader } from "./ui/loader";
import { useToast } from "./ui/use-toast";

function MobileNavigation() {
	const session = useSession();
	const pathname = usePathname();
	const router = useRouter();
	const { toast } = useToast();

	const [isSigningOut, setIsSigningOut] = React.useState(false);

	const signOutMutation = api.auth.user.signOut.useMutation();

	return (
		<Sheet>
			<SheetTrigger asChild className="fixed bottom-6 left-4 z-50 shadow-md lg:hidden">
				<Button variant="outline" size="icon" className="h-14 w-14 rounded-full">
					<MobileMenuIcon className="h-5 w-5" />
					<span className="sr-only">Open mobile navigation</span>
				</Button>
			</SheetTrigger>
			<SheetContent className="flex flex-col sm:max-w-md md:max-w-lg lg:hidden" side="left">
				<Link
					href="/"
					shallow
					className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
				>
					<Image src={DogworxPawLogoGradient as string} alt="Dogworx Paw Logo (Gradient Version)" />
				</Link>
				<SheetHeader>
					<SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
				</SheetHeader>
				<nav className="flex flex-1 flex-col">
					<ul role="list" className="flex flex-1 flex-col gap-y-7">
						<li>
							<ul role="list" className="-mx-2 space-y-1">
								{Object.values(navigation).map((item) => {
									const current =
										item.href === pathname ||
										pathname.startsWith(item.href) ||
										item.subNavigation?.some((subItem) => subItem.href === pathname);

									if (
										item.adminOnly &&
										session.user.organizationRole !== "owner" &&
										session.user.organizationRole !== "admin"
									) {
										return null;
									}

									return (
										<React.Fragment key={item.name}>
											<li>
												<a
													aria-disabled={item.disabled}
													href={item.disabled ? "#" : item.href}
													className={cn(
														current
															? "bg-slate-50 text-indigo-600"
															: !item.disabled
															? "text-slate-700 hover:text-indigo-600 hover:bg-slate-50"
															: "opacity-25 cursor-not-allowed text-slate-700 hover:bg-transparent hover:text-slate-700",
														"group flex gap-x-4 rounded-md p-2 font-medium text-base leading-6 items-center",
														"focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
													)}
												>
													<item.icon
														className={cn(
															current
																? "text-indigo-600"
																: !item.disabled
																? "text-slate-400 group-hover:text-indigo-600"
																: "cursor-not-allowed text-slate-700 hover:text-slate-700",

															"h-5 w-5 shrink-0",
														)}
														aria-hidden="true"
													/>
													{item.name}
												</a>
											</li>
											{current && item.subNavigation && (
												<ul role="list" className="flex flex-1 flex-col gap-y-2">
													{Object.values(item.subNavigation).map((subItem, index) => {
														const current = subItem.href === pathname;

														const isLast = index === item.subNavigation.length - 1;

														return (
															<li key={subItem.name}>
																<div className={cn("relative flex justify-between")}>
																	{!isLast ? (
																		<span
																			className="absolute left-[18px] top-6 -ml-px h-full w-0.5 bg-slate-200"
																			aria-hidden="true"
																		/>
																	) : null}

																	<Link
																		href={subItem.href}
																		className={cn(
																			current
																				? "bg-slate-50 text-indigo-600"
																				: "text-slate-500 hover:text-indigo-600 hover:bg-slate-50",
																			"relative w-full group flex gap-x-3 rounded-md p-2 font-normal text-base leading-6 items-center",
																		)}
																	>
																		<div className="flex h-5 w-5 shrink-0 items-center justify-center">
																			<div className="flex h-2 w-2 items-center justify-center rounded-full border border-input bg-white shadow">
																				<div
																					className={cn(
																						"h-1 w-1 rounded-full transition-colors",
																						current ? "bg-primary" : "bg-muted group-hover:bg-indigo-600",
																					)}
																				/>
																			</div>
																		</div>
																		{subItem.name}
																	</Link>
																</div>
															</li>
														);
													})}
												</ul>
											)}
										</React.Fragment>
									);
								})}
							</ul>
						</li>

						<li className="-mx-2 mt-auto">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="-mb-3 flex h-auto w-full items-center justify-start gap-x-4 px-2 py-3"
									>
										{session.user.profileImageUrl ? (
											<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-gray-100">
												<Image
													src={session.user.profileImageUrl}
													alt="User's profile image"
													width={128}
													height={128}
													className="aspect-square rounded-md object-cover"
												/>
											</div>
										) : (
											<div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 ">
												{session.user.givenName[0]}
												{session.user.familyName?.[0]}
											</div>
										)}
										<div className="flex flex-col justify-start">
											<span className="sr-only">Open user settings</span>
											<span aria-hidden="true" className="block text-left text-xs capitalize text-muted-foreground">
												{session.user.organizationRole}
											</span>
											<span aria-hidden="true" className="mt-0.5 w-full text-left">
												{session.user.givenName} {session.user.familyName}
											</span>
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-[256px]">
									<p className="truncate px-2 py-1.5">
										<span className="block text-xs text-muted-foreground">Signed in as</span>
										<span className="mt-0.5 text-sm font-semibold">{session.user.emailAddress}</span>
									</p>

									<DropdownMenuSeparator />
									<DropdownMenuGroup>
										<DropdownMenuItem asChild>
											<a href="/account">
												<UserIcon className="mr-2 h-4 w-4" />
												<span>Account Settings</span>
											</a>
										</DropdownMenuItem>
									</DropdownMenuGroup>
									<DropdownMenuItem
										onClick={(e) => {
											e.preventDefault();
											setIsSigningOut(true);

											signOutMutation
												.mutateAsync()
												.then(() => {
													router.push("/sign-in");
													router.refresh();
													toast({
														title: "Signed out",
														description: "You have successfully been signed out of your account.",
													});
												})
												.catch(() => {
													toast({
														title: "Sign out failed",
														description: "We had an issue signing you out of your account. Please try again.",
														variant: "destructive",
													});
												})
												.finally(() => {
													setIsSigningOut(false);
												});
										}}
									>
										{isSigningOut ? <Loader size="sm" variant="black" /> : <LogOutIcon className="mr-2 h-4 w-4" />}
										<span>Sign out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</li>
					</ul>
				</nav>
			</SheetContent>
		</Sheet>
	);
}

export { MobileNavigation };

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useSession } from "~/app/providers";
import TKITLogoWhite from "~/assets/tkit-logo-white.svg";
// import TKITLogo from "~/assets/tkit-logo.svg";
import { api } from "~/lib/trpc/client";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
	BookingIcon,
	CalendarDaysIcon,
	ClientsIcon,
	DogIcon,
	LogOutIcon,
	SettingsIcon,
	UserIcon,
	VetClinicIcon,
	VetsIcon,
} from "./ui/icons";
import { Loader } from "./ui/loader";
import { Separator } from "./ui/separator";
import { useToast } from "./ui/use-toast";

type Navigation = {
	name: string;
	href: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: (...args: any[]) => JSX.Element | React.ReactNode;
	disabled: boolean;
	adminOnly?: boolean;
	subNavigation?: Array<{
		name: string;
		href: string;
	}>;
};

export const navigation = [
	{ name: "Calendar", href: "/calendar", icon: CalendarDaysIcon, disabled: false },
	{ name: "Dogs", href: "/dogs", icon: DogIcon, disabled: false },
	{ name: "Clients", href: "/clients", icon: ClientsIcon, disabled: false },
	{ name: "Vets", href: "/vets", icon: VetsIcon, disabled: false },
	{ name: "Vet Clinics", href: "/vet-clinics", icon: VetClinicIcon, disabled: false },
	{ name: "Bookings", href: "/bookings", icon: BookingIcon, disabled: false },
	{
		name: "Settings",
		href: "/settings/organization",
		icon: SettingsIcon,
		disabled: false,
		adminOnly: true,
		subNavigation: [
			{
				name: "Organization",
				href: "/settings/organization",
			},
			{
				name: "Booking types",
				href: "/settings/booking-types",
			},
		],
	},
] satisfies Array<Navigation>;

function DarkDesktopSidebar() {
	const session = useSession();
	const pathname = usePathname();
	const router = useRouter();
	const { toast } = useToast();

	const [isSigningOut, setIsSigningOut] = React.useState(false);

	const signOutMutation = api.auth.user.signOut.useMutation();

	return (
		<div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
			{/* Sidebar component, swap this element with another sidebar if you like */}
			<div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-950 px-6">
				<div className="flex shrink-0 items-center pb-3 pt-6">
					<Link
						href="/"
						shallow
						className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
					>
						<Image
							src={TKITLogoWhite as string}
							priority
							alt="Dogworx Paw Logo (Gradient Version)"
							className="w-10"
							width={40}
							height={40}
						/>
					</Link>
				</div>
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
										<React.Fragment key={`desktop-${item.name}`}>
											<li className="group relative">
												<div className="absolute -left-4 h-full py-2">
													<Separator
														className={cn(
															"h-full w-[2px] pl-[2px] transition duration-75",
															current ? "bg-white" : !item.disabled ? "bg-gray-950 group-hover:bg-white" : "",
														)}
													/>
												</div>

												<Link
													aria-disabled={item.disabled}
													href={item.disabled ? "#" : item.href}
													className={cn(
														current
															? // "bg-gray-900 text-zinc-50 border border-zinc-300/5"
															  "text-white"
															: !item.disabled
															? // "text-zinc-300 hover:bg-gray-900 hover:text-zinc-50 border hover:border-zinc-300/5"
															  "text-zinc-200 hover:text-white"
															: "opacity-40 cursor-not-allowed text-zinc-200",
														"group flex gap-x-3 rounded-md p-2 font-medium text-base leading-6 items-center transition-colors duration-75",
													)}
												>
													<item.icon
														className={cn(
															current
																? "text-white"
																: !item.disabled
																? "text-zinc-500 group-hover:text-white"
																: "cursor-not-allowed text-zinc-700",

															"h-6 w-6 shrink-0 transition-colors duration-75",
														)}
														aria-hidden="true"
													/>
													{item.name}
												</Link>
											</li>

											{current && item.subNavigation && (
												<ul role="list" className="flex flex-1 flex-col gap-y-2">
													{Object.values(item.subNavigation).map((subItem, index) => {
														const current = subItem.href === pathname;

														const isLast = index === item.subNavigation.length - 1;

														return (
															<li key={"desktop-" + subItem.name}>
																<div className={cn("relative flex justify-between")}>
																	{!isLast ? (
																		<span
																			className="absolute left-[18px] top-6 -ml-px h-full w-0.5 bg-slate-700"
																			aria-hidden="true"
																		/>
																	) : null}

																	<Link
																		href={subItem.href}
																		className={cn(
																			current
																				? "border-zinc-300/5 bg-gray-900 text-zinc-50"
																				: "text-zinc-300 hover:border-zinc-300/5 hover:bg-gray-900 hover:text-zinc-50",
																			"group flex w-full gap-x-4 font-medium rounded-md border p-2 text-base leading-6 items-center",
																			"focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
																		)}
																	>
																		<div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
																			<div
																				className={cn(
																					"flex h-2 w-2 items-center justify-center rounded-full border shadow",
																					current ? "bg-white border-white" : "bg-slate-600 border-slate-600",
																				)}
																			>
																				<div
																					className={cn(
																						"h-1 w-1 rounded-full transition-colors bg-slate-900",
																						!current && "group-hover:bg-primary",
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
										className="mb-2 flex h-auto w-full items-center justify-start gap-x-4 border px-2 py-3 text-zinc-300 hover:border-zinc-300/5 hover:bg-gray-900 hover:text-zinc-50"
									>
										{session.user.profileImageUrl ? (
											<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-gray-800">
												<Image
													src={session.user.profileImageUrl}
													alt="User's profile image"
													width={128}
													height={128}
													className="aspect-square rounded-md object-cover"
												/>
											</div>
										) : (
											<div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-800 ">
												{session.user.givenName[0]}
												{session.user.familyName?.[0]}
											</div>
										)}
										<div className="flex flex-col justify-start">
											<span className="sr-only">Open user settings</span>
											<span aria-hidden="true" className="block text-left text-xs capitalize text-zinc-50">
												{session.user.organizationRole}
											</span>
											<span aria-hidden="true" className="mt-0.5 w-full text-left text-zinc-100">
												{session.user.givenName} {session.user.familyName}
											</span>
										</div>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-[256px]" align="center">
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
			</div>
		</div>
	);
}

export { DarkDesktopSidebar };

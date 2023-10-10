// -----------------------------------------------------------------------------
// This layout exists as we don't want these padding and other styles to be applied on certain pages (at time of making mainly the calendar page)
// Although we do want it for all the other dashboard routes. There are other ways to achieve this such as setting a header in middleware and checking for it in the layout
// but I think this is simpler and cleaner. If you have a better way to do this, please let me know.
// -----------------------------------------------------------------------------
interface DashboardLayoutProps {
	children: React.ReactNode;
}

function DashboardWithPaddingLayout({ children }: DashboardLayoutProps) {
	return (
		<div className="mx-auto w-full max-w-screen-2xl overflow-y-auto overflow-x-hidden rounded-md p-6 backdrop-blur-none lg:p-10">
			{children}
		</div>
	);
}

export default DashboardWithPaddingLayout;

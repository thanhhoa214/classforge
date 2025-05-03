import { Sidenav } from "@/app/(dashboard)/sidenav";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen sm:flex-row">
      <aside
        className={cn(
          "sticky top-0 z-30 h-dvh shrink-0 border-r bg-background md:sticky md:block"
        )}
      >
        <Sidenav />
      </aside>
      <main
        className={cn("flex-1 w-full flex flex-col overflow-hidden px-4 py-10")}
      >
        {children}
      </main>
    </div>
  );
}

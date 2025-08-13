"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname?.startsWith(href);
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <div className="flex-1 pb-16">{children}</div>
      <nav className="fixed bottom-0 inset-x-0 h-16 border-t border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur flex items-center justify-around">
        <Link href="/feed" className={`px-4 py-2 text-sm ${isActive("/feed") ? "font-semibold" : "opacity-70"}`}>Feed</Link>
        <Link href="/record" className={`px-4 py-2 text-sm ${isActive("/record") ? "font-semibold" : "opacity-70"}`}>Record</Link>
        <Link href="/me" className={`px-4 py-2 text-sm ${isActive("/me") ? "font-semibold" : "opacity-70"}`}>Me</Link>
      </nav>
    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, Target, CalendarDays, Menu, Sun, Moon, Users, Sparkles, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useI18n, Locale } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

function NavLinks({ onClick, isAdmin }: { onClick?: () => void; isAdmin: boolean }) {
  const pathname = usePathname();
  const { t } = useI18n();

  const navItems = [
    { href: "/", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/projects", label: t.nav.projects, icon: FolderKanban },
    { href: "/goals", label: t.nav.goals, icon: Target },
    { href: "/plans", label: t.nav.plans, icon: CalendarDays },
    { href: "/seed", label: "AI Seed", icon: Sparkles },
    ...(isAdmin ? [{ href: "/admin/users", label: "Users", icon: Users }] : []),
  ];

  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClick}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === href
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      title={resolvedTheme === "dark" ? t.common.lightMode : t.common.darkMode}
    >
      {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function LangToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "pt-BR" : "en")}
      className="text-xs font-semibold px-2 py-1 rounded border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
      title="Switch language / Mudar idioma"
    >
      {locale === "en" ? "PT" : "EN"}
    </button>
  );
}

export function TopNav({ isAdmin, userName }: { isAdmin: boolean; userName: string }) {
  const initials = userName
    ? userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg mr-4">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <span className="hidden sm:inline">MyDashboard</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <NavLinks isAdmin={isAdmin} />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          <LangToggle />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {userName && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground truncate max-w-[200px]">
                  {userName}
                </div>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-64 pt-10">
              <nav className="flex flex-col gap-1">
                <NavLinks isAdmin={isAdmin} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

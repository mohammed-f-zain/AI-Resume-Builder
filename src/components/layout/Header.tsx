"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { localeNames, type TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/types";

const navItems: { href: string; key: TranslationKey }[] = [
  { href: "/", key: "home" },
  { href: "/builder", key: "builder" },
  { href: "/analyzer", key: "analyzer" },
  { href: "/cover-letter", key: "coverLetter" },
];

export function Header() {
  const { t, locale, setLocale, dir } = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleLocale = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <header className="site-header sticky top-0 z-50 bg-[#002b49] shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icon.png"
            alt="Bahath Jobz"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
          />
          <span className="text-lg font-bold text-white">Bahath Jobz</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            aria-label={t("language")}
          >
            <Globe className="h-4 w-4" />
            {localeNames[locale === "en" ? "ar" : ("en" as Locale)]}
          </button>

          <button
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-white/10 px-4 py-3 md:hidden"
          dir={dir}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium",
                pathname === item.href
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10"
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="site-footer mt-auto border-t border-[#e2e8f0] bg-[#f4f7fa]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-icon.png"
              alt="Bahath Jobz"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-md object-contain"
            />
            <span className="font-semibold text-[#141f2e]">Bahath Jobz</span>
          </div>
          <p className="text-sm text-[#6b7c93]">
            © {new Date().getFullYear()} Bahath Jobz. Doha, Qatar.
          </p>
          <div className="flex gap-4 text-sm text-[#6b7c93]">
            <Link href="/builder" className="hover:text-[#1db4ce]">
              {t("builder")}
            </Link>
            <Link href="/analyzer" className="hover:text-[#1db4ce]">
              {t("analyzer")}
            </Link>
            <Link href="/cover-letter" className="hover:text-[#1db4ce]">
              {t("coverLetter")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

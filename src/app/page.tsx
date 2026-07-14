"use client";

import Link from "next/link";
import {
  FileText,
  Search,
  Mail,
  ArrowRight,
  Sparkles,
  Shield,
  Globe,
} from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function HomePage() {
  const { t } = useLocale();

  const features = [
    {
      icon: FileText,
      titleKey: "featureBuilderTitle" as const,
      descKey: "featureBuilderDesc" as const,
      href: "/builder",
      ctaKey: "startBuilding" as const,
    },
    {
      icon: Search,
      titleKey: "featureAnalyzerTitle" as const,
      descKey: "featureAnalyzerDesc" as const,
      href: "/analyzer",
      ctaKey: "analyzeNow" as const,
    },
    {
      icon: Mail,
      titleKey: "featureCoverTitle" as const,
      descKey: "featureCoverDesc" as const,
      href: "/cover-letter",
      ctaKey: "writeCover" as const,
    },
  ];

  const badges = [
    { icon: Sparkles, text: "AI Powered" },
    { icon: Shield, text: "ATS Optimized" },
    { icon: Globe, text: "EN / AR" },
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-[#002b49]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(29,180,206,0.15)_0%,_transparent_60%)]" />
        <div className="absolute -bottom-24 start-0 h-64 w-64 rounded-full bg-[#1db4ce]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              {badges.map(({ icon: Icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur"
                >
                  <Icon className="h-3.5 w-3.5 text-[#1db4ce]" />
                  {text}
                </span>
              ))}
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 text-lg text-white/75 sm:text-xl">
              {t("heroSubtitle")}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/builder">
                <Button size="lg" variant="secondary">
                  {t("getStarted")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/analyzer">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  {t("tryAnalyzer")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map(({ icon: Icon, titleKey, descKey, href, ctaKey }) => (
            <Card
              key={href}
              className="group overflow-hidden transition-shadow hover:shadow-lg hover:border-[#1db4ce]/30"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#002b49] text-white shadow-md">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-[#141f2e]">
                  {t(titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6b7c93]">
                  {t(descKey)}
                </p>
                <Link
                  href={href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#1db4ce] hover:text-[#1799b3]"
                >
                  {t(ctaKey)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client"

import Image from "next/image"
import Link from "next/link"
import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import { NavAppStoreBadge } from "@/components/nav/nav-app-store-badge"
import { ThemeLogo } from "@/components/theme-logo"

function CopyrightBlock({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Link
        href="https://socialproof.foundation"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs text-muted-foreground transition-colors hover:font-medium hover:underline"
      >
        The Social Proof Foundation, LLC.
      </Link>
      <p className="text-xs text-muted-foreground">
        © Copyright {new Date().getFullYear()}. All Rights Reserved.
      </p>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-card">
      {/* Brand watermark — pinned to bottom, decorative only */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-[-6%] left-1/2 w-[min(118vw,720px)] max-w-none -translate-x-1/2 sm:bottom-[-18%] sm:w-[min(92vw,1180px)]">
          <Image
            src="/dripdrop-horizontal-gray-sm.png"
            alt=""
            width={1180}
            height={472}
            className="h-auto w-full select-none opacity-20 sm:opacity-20"
            priority={false}
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.25) 100%)',
              maskImage:
                'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.25) 100%)',
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, hsl(var(--card) / 0.35) 50%, hsl(var(--card)) 88%)',
            }}
          />
        </div>
      </div>

      <div className="relative z-10 flex w-full justify-center px-[clamp(1.25rem,4vw,3rem)]">
        <div className="flex w-full max-w-8xl flex-col pb-8 pt-8 sm:min-h-[196px] sm:pb-6 sm:pt-8">
          {/* Top — logo lockup */}
          <div className="flex flex-col items-center gap-4 sm:pb-14">
            <ThemeLogo type="silhouette" size={32} alt="DripDrop Logo" />
            <ThemeLogo
              type="horizontal"
              size={120}
              horizontalVariant="black"
              className="hidden sm:block"
              alt="DripDrop Brand"
            />
            <ThemeLogo
              type="horizontal"
              size={96}
              horizontalVariant="black"
              className="sm:hidden"
              alt="DripDrop Brand"
            />
            <div className="mt-3 mb-8 sm:hidden">
              <AnimatedThemeToggle />
            </div>
          </div>

          {/* Mobile — centered app store + copyright */}
          <div className="flex flex-col items-center gap-3 pb-1 sm:hidden">
            <NavAppStoreBadge imageClassName="h-10 w-auto" />
            <CopyrightBlock className="text-center" />
          </div>

          {/* Mobile — legal links */}
          <div className="mt-3 flex items-center justify-center gap-x-3 whitespace-nowrap sm:hidden">
            <Link
              href="https://docs.google.com/document/d/1qxKECZAOfgaZxl49Y3PhP9oAxB1yOsKJLasPEU-b6GY/"
              className="text-xs font-medium text-muted-foreground transition-colors hover:font-semibold hover:text-foreground hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="https://docs.google.com/document/d/1_lFu0GsqmcsyiuKrlGF-RBz6nd4Gm3vGluxhALiXYQA/"
              className="text-xs font-medium text-muted-foreground transition-colors hover:font-semibold hover:text-foreground hover:underline"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Desktop — toggle + app store at edges, legal links at true center */}
          <div className="relative mt-auto hidden w-full sm:block">
            <div className="flex items-end justify-between">
              <AnimatedThemeToggle />
              <div className="flex flex-col items-end gap-4">
                <NavAppStoreBadge imageClassName="h-10 w-auto sm:h-11" />
                <CopyrightBlock className="text-right" />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
              <div className="pointer-events-auto flex items-center gap-x-3 whitespace-nowrap">
                <Link
                  href="https://docs.google.com/document/d/1qxKECZAOfgaZxl49Y3PhP9oAxB1yOsKJLasPEU-b6GY/"
                  className="text-xs font-medium text-muted-foreground transition-colors hover:font-semibold hover:text-foreground hover:underline"
                >
                  Terms of Service
                </Link>
                <Link
                  href="https://docs.google.com/document/d/1_lFu0GsqmcsyiuKrlGF-RBz6nd4Gm3vGluxhALiXYQA/"
                  className="text-xs font-medium text-muted-foreground transition-colors hover:font-semibold hover:text-foreground hover:underline"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

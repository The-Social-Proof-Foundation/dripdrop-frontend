"use client"

import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import Link from "next/link"
import { ThemeLogo } from "@/components/theme-logo"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="w-full py-6 px-8">
        <div className="flex flex-col mb-4 lg:mb-6">
          {/* Logo centered at top */}
          <div className="flex flex-col items-center mb-2 gap-2 md:mb-0">
              {/* Silhouette logo - always visible */}
              <ThemeLogo 
                type="silhouette"
                size={28}
                className="mb-1"
                alt="DripDrop Logo"
              />
              
              {/* Horizontal logo - hidden on mobile */}
              <ThemeLogo 
                type="horizontal"
                size={110}
                className="hidden sm:block"
                alt="DripDrop Brand"
              />
          </div>
        </div>

        <div className="mt-4">
          <div className="relative flex flex-col sm:flex-row sm:justify-between items-center">
             {/* Left side - Theme Toggle */}
             <div className="pb-6 sm:pb-0 order-1 sm:order-1">
               <AnimatedThemeToggle />
             </div>

             {/* Center - Terms and Privacy - Mobile: centered, Desktop: absolutely centered */}
             <div className="flex flex-col items-center sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 order-2 sm:order-2">
               <div className="flex gap-4 text-xs mb-2 md:mb-0 translate-y-0 md:translate-y-2">
                 <Link href="https://docs.google.com/document/d/1qxKECZAOfgaZxl49Y3PhP9oAxB1yOsKJLasPEU-b6GY/" className="hover:underline text-muted-foreground transition-colors duration-300 font-medium hover:font-semibold">
                   Terms of Service
                 </Link>
                 <Link href="https://docs.google.com/document/d/1_lFu0GsqmcsyiuKrlGF-RBz6nd4Gm3vGluxhALiXYQA/" className="hover:underline text-muted-foreground transition-colors duration-300 font-medium hover:font-semibold">
                   Privacy Policy
                 </Link>
               </div>

               {/* Mobile: Show copyright info centered below terms */}
               <div className="text-center sm:hidden">
                 <Link href="https://socialproof.foundation" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline hover:font-medium block">
                   The Social Proof Foundation, LLC.
                 </Link>
                 <p className="text-xs text-muted-foreground">
                   © Copyright {new Date().getFullYear()}. All Rights Reserved.
                 </p>
               </div>
             </div>

             {/* Right side - Copyright info (Desktop only) */}
             <div className="hidden sm:flex sm:flex-col sm:items-end order-3 sm:order-3">
               <Link href="https://socialproof.foundation" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline hover:font-medium block">
                 The Social Proof Foundation, LLC.
               </Link>
               <p className="text-xs text-muted-foreground">
                 © Copyright {new Date().getFullYear()}. All Rights Reserved.
               </p>
             </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 
"use client"

import { AnimatedThemeToggle } from "@/components/animated-theme-toggle"
import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="w-full py-6 px-8">
        <div className="flex flex-col mb-8 lg:mb-6">
          {/* Logo centered at top */}
          <div className="flex justify-center items-center mb-2">
            <Link href="/" className="flex flex-col items-center space-y-2 group">
              <Image 
                src="/DripDrop-logo-readme.png" 
                alt="DripDrop Logo" 
                width={42}
                height={42}
                className="object-contain"
              />
              <span className="hidden lg:inline text-xl font-quicksand font-bold transition-all">
                DripDrop
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative flex flex-col sm:flex-row sm:justify-between items-center">
             {/* Left side - Theme Toggle */}
             <div className="pb-4 sm:pb-0 order-1 sm:order-1">
               <AnimatedThemeToggle />
             </div>

             {/* Social Icons - Above center content on mobile, right side on desktop */}
             {/* <div className="flex gap-6 pb-4 sm:pt-0 order-2 sm:order-3">
               <Link 
                 href="https://t.me/dripdrop_social"
                 className="transition-colors duration-300 hover:text-foreground"
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-current">
                   <title>Telegram</title>
                   <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
                 </svg>
               </Link>

               <Link 
                 href="https://x.com/dripdrop_social"
                 className="transition-colors duration-300 hover:text-foreground"
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px] fill-current">
                   <title>X</title>
                   <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                 </svg>
               </Link>
             </div> */}

             {/* Center - Terms and Privacy - Absolutely centered */}
             <div className="flex flex-col items-center sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 order-3 sm:order-2">
               <div className="flex gap-4 text-xs mb-1">
                 <Link href="/terms" className="hover:underline text-primary transition-colors duration-300 font-medium hover:font-semibold">
                   Terms of Service
                 </Link>
                 <Link href="/privacy" className="hover:underline text-primary transition-colors duration-300 font-medium hover:font-semibold">
                   Privacy Policy
                 </Link>
               </div>

               <div className="text-center">
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
      </div>
    </footer>
  )
} 
"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { Footer } from "@/components/footer"
import { CountdownTimer } from "@/components/countdown-timer"
import { EmailSignup } from "@/components/email-signup"
import { HeroBadge } from "@/components/ui/hero-badge"
import { Sparkle } from "lucide-react"

export default function Home() {
  const titleRef = useRef<HTMLHeadingElement>(null)

  // Set launch date (30 days from now for demo)
  const launchDate = new Date()
  launchDate.setDate(launchDate.getDate() + 30)

  useEffect(() => {
    // Initial hero animation
    if (titleRef.current) {
      gsap.set(titleRef.current, { y: 100, opacity: 0 })
      gsap.to(titleRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out"
      })
    }
  }, [])

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-background" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Coming Soon Badge - Fixed at top */}
        <div className="mt-[5vh] mb-16 text-center">
          <HeroBadge
            href="https://www.mysocial.network/MySocial.pdf"
            text="Coming Soon"
            endIcon={<Sparkle className="ml-2 w-4 h-4 arrow-icon" />}
            variant="default"
            size="md"
            className="shadow-lg shadow-black/20 hero-badge"
            showCountdown={true}
            targetDate={launchDate}
          />
        </div>
        
        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto min-h-[75vh]">
          {/* Logo/Brand Area */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto flex items-center justify-center">
              <Image
                src="/DripDrop-logo-readme.png"
                alt="DripDrop Logo"
                width={80}
                height={80}
                className="rounded-lg"
                priority
              />
            </div>
          </div>

          {/* Hero Text */}
          <h1 ref={titleRef} className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
            Something Amazing
            <br />
            <span className="text-3xl md:text-5xl lg:text-6xl">is Coming Soon</span>
          </h1>

          <p className="text-sm md:text-base text-muted-foreground mb-12 max-w-md md:max-w-xl mx-auto leading-relaxed">
            We&apos;re crafting an extraordinary experience that will revolutionize the way you think about digital innovation.
          </p>

          {/* Email Signup */}
          <div className="mb-[30vh] mt-12">
            <EmailSignup />
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  )
}
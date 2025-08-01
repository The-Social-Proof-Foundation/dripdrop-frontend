"use client"

import { useState } from "react"
import Script from "next/script"
import { motion } from "framer-motion"
import { Footer } from "@/components/footer"
import { EmailSignup } from "@/components/email-signup"
import { ScrollSmootherWrapper } from "@/components/scroll-smoother"

export default function Home() {
  const [splineLoaded, setSplineLoaded] = useState(false)
  const [splineError, setSplineError] = useState(false)



  return (
    <ScrollSmootherWrapper>
      <main className="min-h-screen relative">
        {/* Spline 3D Scene - Hugging the top */}
        <div className="w-full h-screen relative">
          <Script 
            type="module" 
            src="https://cdn.spline.design/@splinetool/hana-viewer@1.0.57/hana-viewer.js"
            strategy="afterInteractive"
            crossOrigin="anonymous"
            onLoad={() => {
              setSplineLoaded(true);
              // Add error handling for the hana-viewer element
              setTimeout(() => {
                const viewer = document.querySelector('hana-viewer');
                if (viewer) {
                  viewer.addEventListener('error', () => setSplineError(true));
                }
              }, 1000);
            }}
            onError={() => {
              setSplineError(true);
            }}
          />
          {!splineError && splineLoaded ? (
            <div 
              className="w-full h-full"
              dangerouslySetInnerHTML={{ 
                __html: '<hana-viewer url="https://prod.spline.design/ZzY5p7kxLBdROiqY-hxL/scene.hanacode" style="width: 100%; height: 100%; display: block;"></hana-viewer>' 
              }} 
            />
          ) : null}
          
          {/* Content Overlaid on Spline Scene */}
          <motion.div 
            className="absolute inset-0 -translate-y-[2vh] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ 
              duration: 1.2, 
              ease: "easeOut",
              delay: 0.6
            }}
          >
            <div className="flex flex-col items-center justify-center text-center px-4 h-full">
              {/* Hero Text */}
              <motion.div 
                className="mb-8 md:mb-12 lg:mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  ease: "easeOut",
                  delay: 0.9
                }}
              >
                  {/* <h1 className="font-quicksand font-bold text-3xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 md:mb-6 lg:mb-8 text-foreground select-text pointer-events-auto">
                    Short-form videos,
                    <br />  
                    <span className="font-quicksand font-bold text-3xl md:text-5xl lg:text-6xl xl:text-7xl">that you actually own.</span>
                  </h1> */}

                  <p className="font-quicksand font-semibold pt-[140px] md:pt-0 text-sm md:text-base text-muted-foreground mb-6 max-w-sm md:max-w-xl lg:max-w-2xl mx-auto select-text pointer-events-auto">
                    We&apos;re building the most fun 12-second video economy, all on-chain. <br className="hidden md:inline" />Featuring Social Proof Tokens, fair ownership, & unlimited ways to earn.
                  </p>
              </motion.div>

              {/* Email Signup */}
              <motion.div 
                className="pointer-events-auto"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  ease: "easeOut",
                  delay: 1.1
                }}
              >
                <EmailSignup />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </ScrollSmootherWrapper>
  )
}
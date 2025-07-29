import './globals.css';
import type { Metadata } from 'next';
import { Quicksand, Inter } from 'next/font/google';
import GoogleAnalytics from '@/lib/googleAnalytics'
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from '@/components/theme-provider';
import { ApolloWrapper } from '@/lib/apollo-provider';
import { CookieConsent } from '@/components/cookie-consent';
import ThemeFavicon from '@/components/theme-favicon';

// Configure Google Fonts with proper loading optimization
const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
  preload: true,
  fallback: ['Inter', 'system-ui', 'sans-serif'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'DripDrop - Coming Soon',
  description: 'A new 12-second video platform that pays, on-chain.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${quicksand.variable} ${inter.variable}`} suppressHydrationWarning>
        {/* <ApolloWrapper> */}
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange={false}
            >
              {children}
              <Toaster />
              <CookieConsent/>
              <ThemeFavicon/>
            </ThemeProvider>
          <GoogleAnalytics />
        {/* </ApolloWrapper> */}
      </body>
    </html>
  );
}
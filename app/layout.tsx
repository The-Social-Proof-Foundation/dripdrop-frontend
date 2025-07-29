import './globals.css';
import type { Metadata } from 'next';
import GoogleAnalytics from '@/lib/googleAnalytics'
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from '@/components/theme-provider';
import { ApolloWrapper } from '@/lib/apollo-provider';
import { CookieConsent } from '@/components/cookie-consent';
import ThemeFavicon from '@/components/theme-favicon';

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
      <body suppressHydrationWarning>
        {/* <ApolloWrapper> */}
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
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
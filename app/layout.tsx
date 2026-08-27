import './globals.css';
import type { Metadata } from 'next';
import { AppProviders } from '@/components/app-providers';
import { fontVariables } from '@/lib/fonts';
import { getVideoDurationLabel } from '@/lib/video-config';

export const metadata: Metadata = {
  title: 'DripDrop - Join the Waitlist',
  description: `Join the early access waitlist for the most fun ${getVideoDurationLabel()} video economy, all on-chain.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} font-sans antialiased`} suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

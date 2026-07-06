import type { Metadata } from 'next';

const APP_NAME = 'Your App Name';
const APP_DESCRIPTION = 'Your app description here';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const baseMetadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

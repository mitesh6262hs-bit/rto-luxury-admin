
// app/layout.js
import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import { AppProvider } from './context/AppContext';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
});

export const metadata = {
    title: 'RTO Luxury Admin Panel',
    description: 'Premium device management dashboard',
    manifest: '/manifest.json',
    themeColor: '#0c0e14',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
            <head>
                <link 
                    rel="stylesheet" 
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" 
                />
            </head>
            <body>
                <AppProvider>
                    {children}
                    <Analytics />
                </AppProvider>
            </body>
        </html>
    );
}

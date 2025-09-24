import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

// Load the Outfit variable font from local files
const outfit = localFont({
  src: '../../public/fonts/Outfit-VariableFont_wght.ttf',
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Advertising Agency Dashboard",
  description: "A modern dashboard for advertising campaigns and agency news",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning
        className={`${outfit.variable} font-sans antialiased min-h-screen text-gray-900 dark:text-gray-100`}
      >
        <AuthProvider>
          <div className="relative">
            <div className="p-6">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 
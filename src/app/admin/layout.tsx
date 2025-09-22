import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

// Load the Outfit variable font from local files
const outfit = localFont({
  src: '../../../public/fonts/Outfit-VariableFont_wght.ttf',
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Advertising Agency Dashboard - Admin",
  description: "Advertising agency dashboard with admin settings",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning
        className={`${outfit.variable} font-sans antialiased min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}
      >
        <div className="relative">
          {children}
        </div>
      </body>
    </html>
  );
}

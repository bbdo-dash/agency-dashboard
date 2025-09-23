import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertising Agency Dashboard - Admin",
  description: "Advertising agency dashboard with admin settings",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Simply pass through to children - use root layout
  return children;
}

import type { Metadata } from "next";
import "@/styles/globals.scss";
import BootstrapClient from "@/components/BootstrapClient";

export const metadata: Metadata = {
  title: "Inventory & Invoice Management System",
  description: "Professional Inventory, Sales, and Invoice Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body>
        {children}
        <BootstrapClient />
      </body>
    </html>
  );
}

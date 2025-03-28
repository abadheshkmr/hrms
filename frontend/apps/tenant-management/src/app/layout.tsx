import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HRMS - Tenant Management System",
  description: "Manage tenants for your HRMS SaaS application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-40 border-b bg-background">
            <div className="container flex h-16 items-center justify-between py-4">
              <div className="flex items-center gap-6 md:gap-10">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="font-bold text-xl">HRMS</span>
                </Link>
                <nav className="flex gap-6">
                  <Link
                    href="/tenants"
                    className="text-sm font-medium transition-colors hover:text-primary"
                  >
                    Tenants
                  </Link>
                  <Link
                    href="/users"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    Users
                  </Link>
                  <Link
                    href="/settings"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    Settings
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex">
                  <div className="rounded-full h-8 w-8 bg-primary text-white flex items-center justify-center">
                    A
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">
            <div className="container py-6">{children}</div>
          </main>
          <footer className="border-t py-6">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <div className="text-center text-sm text-muted-foreground md:text-left">
                © {new Date().getFullYear()} HRMS. All rights reserved.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

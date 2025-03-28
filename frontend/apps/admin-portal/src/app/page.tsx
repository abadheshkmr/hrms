import Link from "next/link";
import { Button } from "@repo/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          HRMS Admin Portal
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Central administration for the HRMS SaaS application. Manage users, tenants, and system settings.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/dashboard">
            <Button>Dashboard</Button>
          </Link>
          <Link href="/users">
            <Button variant="outline">Manage Users</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 w-full max-w-5xl mt-8">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <h3 className="font-semibold">User Management</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, permissions, and access controls across the system.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
              <line x1="3" x2="21" y1="9" y2="9"></line>
              <line x1="9" x2="9" y1="21" y2="9"></line>
            </svg>
            <h3 className="font-semibold">System Settings</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure global system settings, authentication methods, and integration options.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M3 3v18h18"></path>
              <path d="m19 9-5 5-4-4-3 3"></path>
            </svg>
            <h3 className="font-semibold">Analytics</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor system usage, view tenant statistics, and generate reports.
          </p>
        </div>
      </div>
    </div>
  );
}

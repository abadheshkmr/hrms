import Link from "next/link";
import { Button } from "@repo/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Tenant Management System
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Easily manage your HRMS SaaS tenants from a centralized dashboard. Create, update,
          and monitor tenant details, addresses, and contact information.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/tenants">
            <Button size="lg">View All Tenants</Button>
          </Link>
          <Link href="/tenants/create">
            <Button variant="outline" size="lg">Create New Tenant</Button>
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
              <path d="M2 22h20"></path>
              <path d="M6.87 2h10.26L22 6.87v10.26L17.13 22H6.87L2 17.13V6.87L6.87 2z"></path>
            </svg>
            <h3 className="font-semibold">Tenant Management</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Create and manage tenants with custom subdomains, status tracking, and detailed
            information.
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
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <h3 className="font-semibold">Address Management</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Add multiple addresses for each tenant, including head office locations and
            regional offices.
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
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <h3 className="font-semibold">Contact Information</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Maintain primary contacts, support contacts, and other essential communication
            channels for each tenant.
          </p>
        </div>
      </div>
    </div>
  );
}

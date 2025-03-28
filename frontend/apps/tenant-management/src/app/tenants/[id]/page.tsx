"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Tenant, tenantApi } from "@repo/api-client/tenant";

interface TenantDetailPageProps {
  params: {
    id: string;
  };
}

export default function TenantDetailPage({ params }: TenantDetailPageProps) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const data = await tenantApi.getTenantById(params.id);
        setTenant(data);
      } catch (err) {
        console.error("Failed to fetch tenant:", err);
        setError("Failed to load tenant details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [params.id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      try {
        await tenantApi.deleteTenant(params.id);
        router.push("/tenants");
      } catch (err) {
        console.error("Failed to delete tenant:", err);
        setError("Failed to delete tenant. Please try again.");
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading tenant details...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8 gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center py-8 gap-4">
        <p>Tenant not found.</p>
        <Link href="/tenants">
          <Button>Back to Tenants</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/tenants" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to Tenants
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-muted-foreground">
            Tenant Details
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/tenants/${params.id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </Button>
          </Link>
          <Button variant="destructive" className="flex items-center gap-2" onClick={handleDelete}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Tenant Information</h3>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                  <dd className="mt-1 text-sm">{tenant.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Subdomain</dt>
                  <dd className="mt-1 text-sm">{tenant.subdomain}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd className="mt-1 text-sm flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-2 ${
                      tenant.status === "active"
                        ? "bg-green-500"
                        : tenant.status === "suspended"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`} />
                    <span className="capitalize">{tenant.status}</span>
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Additional Details</h3>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                  <dd className="mt-1 text-sm">{tenant.description || "No description provided."}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd className="mt-1 text-sm">
                    {tenant.createdAt ? new Date(tenant.createdAt).toLocaleString() : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                  <dd className="mt-1 text-sm">
                    {tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleString() : "N/A"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* We can add additional sections here for addresses and contact info */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium">Addresses</h3>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">No addresses found for this tenant.</p>
            <Button variant="outline" className="mt-4">Add Address</Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium">Contact Information</h3>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">No contact information found for this tenant.</p>
            <Button variant="outline" className="mt-4">Add Contact</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

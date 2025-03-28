"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { DataTable } from "@repo/ui/data-table";
import { Tenant, tenantApi } from "@repo/api-client/tenant";
import { ColumnDef } from "@tanstack/react-table";
// Icons replaced with inline SVGs

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await tenantApi.getAllTenants();
        setTenants(data);
      } catch (err) {
        console.error("Failed to fetch tenants:", err);
        setError("Failed to load tenants. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "subdomain",
      header: "Subdomain",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="flex items-center">
            <span
              className={`h-2 w-2 rounded-full mr-2 ${
                status === "active"
                  ? "bg-green-500"
                  : status === "suspended"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            />
            <span className="capitalize">{status}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return <span>{date.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link href={`/tenants/${tenant.id}`}>
              <Button variant="ghost" size="sm">
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
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </Button>
            </Link>
            <Link href={`/tenants/${tenant.id}/edit`}>
              <Button variant="ghost" size="sm">
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
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(tenant.id)}>
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
            </Button>
          </div>
        );
      },
    },
  ];

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      try {
        await tenantApi.deleteTenant(id);
        setTenants(tenants.filter((tenant) => tenant.id !== id));
      } catch (err) {
        console.error("Failed to delete tenant:", err);
        setError("Failed to delete tenant. Please try again.");
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading tenants...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8 gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Manage your organization's tenants
          </p>
        </div>
        <Link href="/tenants/create">
          <Button>Add New Tenant</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={columns}
          data={tenants}
          searchKey="name"
          searchPlaceholder="Search tenants..."
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/form";
import { Tenant, tenantApi, updateTenantSchema } from "@repo/api-client/tenant";

// Extract the form schema from our API client
type FormSchema = z.infer<typeof updateTenantSchema>;

interface EditTenantPageProps {
  params: {
    id: string;
  };
}

export default function EditTenantPage({ params }: EditTenantPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormSchema>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      status: "pending",
      description: "",
    },
  });

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const data = await tenantApi.getTenantById(params.id);
        
        // Reset form with tenant data
        form.reset({
          name: data.name,
          subdomain: data.subdomain,
          status: data.status,
          description: data.description || "",
        });
      } catch (err) {
        console.error("Failed to fetch tenant:", err);
        setError("Failed to load tenant details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [params.id, form]);

  const onSubmit = async (data: FormSchema) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await tenantApi.updateTenant(params.id, data);
      router.push(`/tenants/${params.id}`);
    } catch (err) {
      console.error("Failed to update tenant:", err);
      setError("Failed to update tenant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading tenant details...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/tenants/${params.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
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
          Back to Tenant Details
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Tenant</h1>
        <p className="text-muted-foreground">
          Update tenant information
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                  <div>
                    <Input placeholder="Acme Corporation" {...field} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The company or organization name for this tenant.
                  </p>
                  <div className="text-sm font-medium text-destructive" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subdomain"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Subdomain</label>
                  <div>
                    <Input placeholder="acme" {...field} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This will be used for the tenant-specific URL (e.g., acme.example.com).
                  </p>
                  <div className="text-sm font-medium text-destructive" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Status</label>
                  <div>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(e) => field.onChange(e.target.value)}
                      value={field.value as string}
                    >
                      <option value="" disabled>Select tenant status</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The current status of this tenant in the system.
                  </p>
                  <div className="text-sm font-medium text-destructive" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                  <div>
                    <Textarea
                      placeholder="Provide a brief description of this tenant"
                      className="min-h-[120px]"
                      value={field.value as string}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Additional information about this tenant.
                  </p>
                  <div className="text-sm font-medium text-destructive" />
                </FormItem>
              )}
            />

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/tenants/${params.id}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Tenant"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

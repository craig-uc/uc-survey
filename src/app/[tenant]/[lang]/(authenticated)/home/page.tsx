"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BreadcrumbBar } from "@/components/layout/BreadcrumbBar";
import { useTenant } from "@/features/tenant";

interface Application {
  appId: string;
  name: string;
  application_id: string;
  description?: string;
  image?: string;
  url?: string;
}

export default function RootPage() {
  const { tenant, tenantCode } = useTenant();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = [
    { label: "Home", href: "/home", active: true },
  ];

  useEffect(() => {
    if (!tenant) return;
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: tenantCode }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch applications");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setApplications(data);
        } else if (data && Array.isArray(data.applications)) {
          setApplications(data.applications);
        } else {
          setApplications([]);
        }
      } catch (err) {
        console.error("Error loading applications:", err);
        setError("Could not load applications. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [tenant, tenantCode]);

  return (
    <div className="flex flex-col min-h-full">
      <BreadcrumbBar items={breadcrumbs} />

      <div className="container mx-auto px-6 py-12 grow">
        <section className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-light mb-6 font-custom tracking-tight">
            Welcome to <span className="text-primary border-b-2 border-primary/30">U.R.UP Connect Survey App</span>
          </h1>
          <p className="text-light/70 text-lg max-w-2xl mx-auto">
            Select an application to get started with your data analysis.
          </p>
        </section>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10 bg-red-900/20 rounded-xl border border-red-900/30">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {applications.map((app) => (
              <Link
                key={app.appId || app.application_id}
                href={`/dashboard/${app.appId}?name=${encodeURIComponent(app.name)}&application_id=${app.application_id}`}
                className="group bg-dark/40 backdrop-blur-sm border border-light/10 rounded-xl p-4 text-center hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 flex flex-col items-center justify-center min-h-[100px]"
              >
                <h3 className="text-sm font-bold text-light group-hover:text-primary transition-colors line-clamp-2">
                  {app.name}
                </h3>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div className="text-center text-light/50 py-20 bg-dark/20 rounded-xl border border-light/5">
            No applications available for this tenant.
          </div>
        )}
      </div>
    </div>
  );
}

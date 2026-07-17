"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassPanel from "@/components/GlassPanel";
import { Survey, SurveyStatus } from "@/features/survey";
import { canEdit, canDelete } from "./permissions";
import { createSurvey } from "./createSurvey";
import { createNewVersion } from "./createNewVersion";

interface SurveyListingProps {
  tenantCode: string;
}

const SECTIONS: { key: SurveyStatus; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "closed", label: "Closed" },
  { key: "deleted", label: "Deleted" },
];

export default function SurveyListing({ tenantCode }: SurveyListingProps) {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/survey/list?tenantCode=${encodeURIComponent(tenantCode)}`)
      .then((res) => (res.ok ? res.json() : { surveys: [] }))
      .then((data) => {
        if (!cancelled) setSurveys(data.surveys ?? []);
      })
      .catch(() => {
        if (!cancelled) setSurveys([]);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantCode]);

  function goToEditor(survey: Survey) {
    router.push(`/admin/surveys/${survey.id}`);
  }

  function handleAdd() {
    const survey = createSurvey(tenantCode);
    setSurveys((prev) => [...prev, survey]);
    goToEditor(survey);
  }

  function handleEdit(survey: Survey) {
    if (survey.status === "active") {
      const next = createNewVersion(survey);
      setSurveys((prev) => [...prev, next]);
      goToEditor(next);
      return;
    }
    goToEditor(survey);
  }

  function handleDelete(survey: Survey) {
    setSurveys((prev) => prev.map((s) => (s.id === survey.id ? { ...s, status: "deleted" as const } : s)));
  }

  return (
    <GlassPanel>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-light">Surveys</h2>
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 rounded-full bg-primary text-on-primary font-medium uppercase tracking-wide"
        >
          Add new survey
        </button>
      </div>

      {SECTIONS.map((section) => {
        const items = surveys.filter((s) => s.status === section.key);
        return (
          <section key={section.key} className="mb-8" data-testid={`section-${section.key}`}>
            <h3 className="text-lg font-semibold text-light mb-2">{section.label}</h3>
            {items.length === 0 ? (
              <p className="text-light/50 text-sm">No {section.label.toLowerCase()} surveys.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((survey) => (
                  <li
                    key={survey.id}
                    data-testid={`row-${survey.id}`}
                    className="flex items-center justify-between bg-dark/30 rounded-lg px-4 py-2"
                  >
                    <span>
                      {survey.name} (v{survey.version}
                      {survey.status === "pending" && survey.pendingSubState ? `, ${survey.pendingSubState}` : ""})
                    </span>
                    <span className="flex gap-2">
                      {canEdit(survey) && (
                        <button type="button" onClick={() => handleEdit(survey)}>
                          Edit
                        </button>
                      )}
                      {canDelete(survey) && (
                        <button type="button" onClick={() => handleDelete(survey)}>
                          Delete
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </GlassPanel>
  );
}

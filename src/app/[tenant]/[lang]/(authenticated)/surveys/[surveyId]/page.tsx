import GlassPanel from "@/components/GlassPanel";

interface SurveyEditorPageProps {
  params: { tenant: string; lang: string; surveyId: string };
}

export default function SurveyEditorPage({ params }: SurveyEditorPageProps) {
  return (
    <GlassPanel>
      <div className="flex flex-col items-center justify-center min-h-full gap-4 text-center">
        <h1 className="text-3xl font-bold">Survey editor coming soon</h1>
        <p>Editing survey {params.surveyId}.</p>
      </div>
    </GlassPanel>
  );
}

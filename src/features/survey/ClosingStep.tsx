import GlassPanel from "@/components/GlassPanel";

export default function ClosingStep() {
  return (
    <GlassPanel>
      <div className="flex flex-col items-center justify-center min-h-full gap-4 text-center">
        <h1 className="text-3xl font-bold">This survey is now closed</h1>
        <p>Thank you for your interest. Responses are no longer being accepted for this survey.</p>
      </div>
    </GlassPanel>
  );
}

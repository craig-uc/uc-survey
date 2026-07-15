import GlassPanel from "@/components/GlassPanel";

export default function NotFoundStep() {
  return (
    <GlassPanel>
      <div className="flex flex-col items-center justify-center min-h-full gap-4 text-center">
        <h1 className="text-3xl font-bold">Survey Not Found</h1>
        <p>We couldn&apos;t find a survey matching this link. Please check the URL and try again.</p>
      </div>
    </GlassPanel>
  );
}

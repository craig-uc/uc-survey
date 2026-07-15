import GlassPanel from "@/components/GlassPanel";
import Button from "@/components/ui/Button";

export default function IntroStep() {
  return (
    <GlassPanel>
      <div className="flex flex-col items-center justify-center min-h-full gap-4 text-center">
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p>Thank you for taking part in this survey.</p>
        <Button label="Continue" type="submit" onClick={() => {}} />
      </div>
    </GlassPanel>
  );
}

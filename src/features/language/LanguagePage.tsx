import GlassPanel from "@/components/GlassPanel";
import { IdentityInitializer } from "@/features/identity";
import { Suspense } from "react";
import LanguageSelector from "./LanguageSelector";

export interface EnLabels {
  selectLanguage: string;
  siteTranslation: string;
}

const page = "languageOptions";
const version = "1";
const destination = "auth";

export default function LanguagePage({ enLabels }: { enLabels?: EnLabels }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Suspense fallback={null}>
        <IdentityInitializer />
      </Suspense>
      <GlassPanel showTitle>
        <div className="min-h-full flex items-center justify-center">
          <Suspense fallback={<div>Loading...</div>}>
            <LanguageSelector page={page} version={version} destination={destination} showSiteTranslation enLabels={enLabels} />
          </Suspense>
        </div>
      </GlassPanel>
    </div>
  );
}

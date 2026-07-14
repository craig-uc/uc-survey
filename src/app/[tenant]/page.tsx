import { fetchField } from "@/features/language/api/field";
import LanguagePage from "@/features/language/LanguagePage";

export default async function TenantPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const [selectLanguage, siteTranslation] = await Promise.all([
    fetchField(tenant, "en", "selectLanguage"),
    fetchField(tenant, "en", "siteTranslation"),
  ]);
  return <LanguagePage enLabels={{ selectLanguage, siteTranslation }} />;
}

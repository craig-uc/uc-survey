import { Footer } from "@/components/layout/Footer";
import { IdentityGuard } from "@/features/identity";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen flex flex-col py-12 px-4 sm:px-6 lg:px-8">
        <IdentityGuard>
          {children}
        </IdentityGuard>
      </div>
      <Footer />
    </>
  );
}

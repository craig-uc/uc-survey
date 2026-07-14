import type { Metadata } from "next";
import "./globals.css";
import {GlobalStateProvider} from "./context/GlobalStateContext";
import { ThemeProvider } from "next-themes";
import { TenantProvider } from "@/features/tenant";

export const metadata: Metadata = {
  title: "UC Survey",
  description: "Flexible reporting on your data",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.webp", sizes: "96x96", type: "image/webp" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.webp", type: "image/webp" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "UC Survey App",
    description: "Flexible survey for your business",
    images: [
      {
        url: "/1200x627.webp",
        width: 1200,
        height: 627,
        alt: "U.R.UP Connect Survey App",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body className="bg-(image:--bg-image) bg-no-repeat bg-cover bg-center font-custom min-h-screen bg-fixed flex flex-col">
      <ThemeProvider attribute="data-theme" enableSystem={true} defaultTheme="dark" >
        <TenantProvider>
          <GlobalStateProvider>
              {children}
          </GlobalStateProvider>
        </TenantProvider>
      </ThemeProvider>
      </body>
    </html>
  );
}

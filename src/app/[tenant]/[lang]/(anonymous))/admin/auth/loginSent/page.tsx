"use client";

import { useParams } from "next/navigation";
import DisplayBlock from "@/components/ui/DisplayBlock";
import { DynamicImage } from "@/components/ui/DynamicImage";

export default function Home() {
  const { tenant } = useParams<{ tenant: string }>();

  return (
    <>
      <div className="flex justify-center align-middle mt-16">
        <div className={`w-96`} style={{minWidth: "30%"}}>
          <DisplayBlock>
            <div className="flex justify-center">
              <DynamicImage
                width={120}
                account={tenant}
                imageName="system-image.webp"
                alt="Beautiful Landscape"
              />
            </div>
            <p className={`pt-5`}>An email with the login link has been sent to your email address.</p>
            <p>Please check your inbox.</p>
          </DisplayBlock>
        </div>
      </div>
    </>
  );
}

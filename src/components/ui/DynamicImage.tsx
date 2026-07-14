"use client";

import { Suspense, memo, use } from "react";
import Image from "next/image";
import { importAccountImage } from "@/utils/imageImporter";

interface DynamicImageProps {
  account: string;
  imageName: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

// Component to load the image asynchronously
const AsyncImage = ({
  account,
  imageName,
  alt,
  width = "auto",
  height = "auto",
  className,
}: DynamicImageProps) => {
  const imageUrl = use(importAccountImage(account, imageName));
  
  if (!imageUrl) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center rounded-lg ${className}`} 
        style={{ width, height }}
      >
        <span className="text-gray-400 text-xs">Image not found</span>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={typeof width === "number" ? width : undefined}
      height={typeof height === "number" ? height : undefined}
      className={`rounded-lg shadow-md ${className || ""}`}
      style={{
        width: typeof width === "string" ? width : "auto",
        height: typeof height === "string" ? height : "auto",
      }}
    />
  );
};

// Wrapper with Suspense for loading state
export const DynamicImage = memo(function DynamicImage(props: DynamicImageProps) {
  const { width = "auto", height = "auto" } = props;
  return (
    <Suspense
      fallback={
        <div
          className={`bg-gray-100 animate-pulse rounded-lg ${props.className || ""}`}
          style={{ width, height }}
        />
      }
    >
      <AsyncImage {...props} />
    </Suspense>
  );
});

import Image from "next/image";
import React from "react";

interface ImageCardProps {
  src: string;       // Image source path or URL
  alt: string;       // Alt text for accessibility
  width?: number;    // Optional width
  height?: number;   // Optional height
  rounded?: boolean; // Whether to apply rounded corners
  shadow?: boolean;  // Whether to apply shadow
  className?: string; // Additional Tailwind classes
}

const ImageCard: React.FC<ImageCardProps> = ({
                                               src,
                                               alt,
                                               width = 400,
                                               height = 300,
                                               rounded = true,
                                               shadow = true,
                                               className = "",
                                             }) => {
  return (
    <div
      className={`overflow-hidden ${rounded ? "rounded-lg" : ""} ${
        shadow ? "shadow-lg" : ""
      } ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="object-cover w-full h-full"
        priority // Loads image faster for above-the-fold content
      />
    </div>
  );
};

export default ImageCard;

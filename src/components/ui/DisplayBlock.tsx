import React from "react";


// A reusable display block component
export default function DisplayBlock({
                                       children,
                                     }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full shadow-lg flex-1 flex-col justify-center px-6 py-12 lg:px-8 opacity-70 bg-light text-dark rounded-3xl">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {children}
      </div>
    </div>
  );
}

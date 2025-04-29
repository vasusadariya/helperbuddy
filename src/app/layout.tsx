"use client";
import "./globals.css";
import { Providers } from "./provider";
import { CartProvider } from "./context/CartContext";
import { EdgeStoreProvider } from "../lib/edgestore";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Dynamically load the Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <html lang="en">
      <Providers>
        <head>
            <meta name="google-site-verification" content="ICqDJUuF_ho7F2zt6-zIxLm4XSmBptH9co5w4DhXq3k" />
        </head>
        <body className="antialiased">
          <EdgeStoreProvider>
            <CartProvider>
              <Toaster position="top-center" />
              {children}
            </CartProvider>
          </EdgeStoreProvider>
        </body>
      </Providers>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayoutClient>{children}</RootLayoutClient>;
}

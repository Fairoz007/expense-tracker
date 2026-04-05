"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

// Create Convex client only if URL is available
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    if (convexUrl) {
      return new ConvexReactClient(convexUrl);
    }
    return null;
  }, []);

  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // If no Clerk key, just render children (demo mode)
  if (!clerkKey) {
    return <>{children}</>;
  }

  // If we have Clerk but no Convex, just use Clerk
  if (!convex) {
    return (
      <ClerkProvider publishableKey={clerkKey}>
        {children}
      </ClerkProvider>
    );
  }

  // Full setup with both Clerk and Convex
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

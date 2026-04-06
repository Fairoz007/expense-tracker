import { clerkMiddleware, createRouteMatcher, auth } from "@clerk/nextjs/server";

// Using the new Next.js 16 terminology: 'proxy' instead of 'middleware'
const isPublicRoute = createRouteMatcher(["/"]);

export const proxy = clerkMiddleware(async (authHelper, request) => {
  if (!isPublicRoute(request)) {
    // In v6, await auth.protect() is directly available from the imported auth
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

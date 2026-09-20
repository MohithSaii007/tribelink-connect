import { createStart, createMiddleware } from "@tanstack/react-start";

import { attachSupabaseAuth } from "./integrations/supabase/auth-attacher";
import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next, handlerType }) => {
  try {
    return await next();
  } catch (error) {
    // Server functions have their own typed error transport. Returning an HTML
    // error page here corrupts that RPC response and can replace the app with a
    // blank screen instead of letting the calling query render its error state.
    if (handlerType === "serverFn") {
      throw error;
    }
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Origin-based request blocking is disabled so the app works on any host
// (Lovable preview, published site, and external deployments like Vercel).
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));

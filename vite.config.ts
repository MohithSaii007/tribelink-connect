// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Public, non-secret backend settings are baked in so the app also works on
// hosts (e.g. Vercel) where no environment variables are configured.
const PUBLIC_SUPABASE_URL = "https://igujmcpqaykwlakcbckx.supabase.co";
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Y47ZPNwOaNX6Z-9phztHGA_bWzrP6B5";
const PUBLIC_SUPABASE_PROJECT_ID = "igujmcpqaykwlakcbckx";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        process.env["VITE_SUPABASE_URL"] || PUBLIC_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        process.env["VITE_SUPABASE_PROJECT_ID"] || PUBLIC_SUPABASE_PROJECT_ID,
      ),
    },
  },
});

import { createClient } from "@supabase/supabase-js";

// Admin client uses service role key — bypasses RLS.
// We use `any` for the generic because admin routes handle
// their own validation and the full Database type generates
// false type errors with the service role client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient() {
  return createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

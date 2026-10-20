import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  throw new Error("SUPABASE_URL or SUPABASE_SECRET_KEY missing in .env.local");
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { count, error } = await db
  .from("leads")
  .select("*", { count: "exact", head: true });

if (error) throw error;
console.log(`Connected. Leads: ${count}`);
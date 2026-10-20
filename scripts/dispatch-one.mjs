import { createClient } from "@supabase/supabase-js";

const leadId = process.argv[2];
if (!leadId) throw new Error("Lead ID do, jaise: L01");

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const { data: lead, error: leadError } = await db
  .from("leads").select("*").eq("lead_id", leadId).single();
if (leadError) throw leadError;

const { data: assessment, error: assessmentError } = await db
  .from("lead_assessments").select("*").eq("lead_id", leadId).single();
if (assessmentError) throw assessmentError;

if (
  !["hot", "warm"].includes(assessment.category) ||
  assessment.duplicate_of ||
  !lead.email ||
  !assessment.follow_up_draft ||
  (assessment.category === "hot" && !assessment.alert_draft)
) {
  throw new Error(`${leadId} is not eligible for a Make draft.`);
}

const payload = {
  lead_id: leadId,
  first_name: lead.first_name,
  email: lead.email,
  score: assessment.score,
  category: assessment.category,
  recommended_service: assessment.recommended_service,
  follow_up_draft: assessment.follow_up_draft,
  alert_draft: assessment.alert_draft ?? "",
};

console.log(`Ready: ${leadId}, ${payload.category}, recipient ${payload.email}`);

if (!process.argv.includes("--dispatch")) {
  console.log("Preview only. Nothing sent to Make.");
  process.exit(0);
}

if (!process.env.MAKE_WEBHOOK_URL) {
  throw new Error("MAKE_WEBHOOK_URL missing from .env.local");
}

const response = await fetch(process.env.MAKE_WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  throw new Error(`Make returned ${response.status}: ${await response.text()}`);
}

console.log(`Make accepted ${leadId}: ${response.status}`);
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const services = {
  roi_calculator: "LinkedIn Outreach & Automation",
  icp_builder: "ICP Mapping & Lead Scoring",
  profile_optimizer: "Personal Branding",
  battle_card_generator: "Account-Based Marketing",
  dm_angle_generator: "LinkedIn Outreach & Automation",
  posting_rhythm_builder: "Personal Branding",
  founder_presence_analyzer: "Personal Branding",
  case_study_generator: "Cold Email Infrastructure",
  lead_magnet_ideas: "AI Lead Generation",
};

function assess(row, duplicateOf) {
  const input = (row.tool_input ?? "").trim();
  const text = `${row.designation ?? ""} ${input}`.toLowerCase();
  const email = (row.email ?? "").trim();
  const company = (row.company ?? "").trim();
  let score;
  let reason;

  if (
    /^test$/i.test(company) ||
    /^test@/i.test(email) ||
    input.toLowerCase() === "asdf"
  ) {
    score = 1;
    reason = "Test record; not a sales prospect";
  } else if (/ignore all previous instructions|set the score to 10/i.test(input)) {
    score = 1;
    reason = "Prompt-injection text; no trustworthy buying details";
  } else if (/aspiring data analyst|looking for an? (sdr|bdr)|open to work/i.test(text)) {
    score = 1;
    reason = "Job seeker, not a buyer";
  } else if (!input) {
    score = 2;
    reason = "No tool input; insufficient information to qualify";
  } else {
    const signals = [];
    score = 2;

    if (/founder|ceo|chief revenue|vp sales|head of sales|managing director/i.test(row.designation ?? "")) {
      score += 2;
      signals.push("decision-maker role");
    }
    if (/\b(b2b|cfo|cto|hr heads?|procurement|importers|finance heads?|mid-market)\b/i.test(input)) {
      score += 2;
      signals.push("business buyer or ICP identified");
    }
    if (/\d|target|icp|competitor/i.test(input)) {
      score += 1;
      signals.push("specific business details");
    }
    if ((row.company_website ?? "").trim()) {
      score += 1;
      signals.push("company website provided");
    }
    if (/connection|reply|pipeline|posting|engagement|outbound|prospect|selling/i.test(input)) {
      score += 1;
      signals.push("growth or outreach context");
    }
    score += 1; // Substantive tool input

    if (/parents of|d2c skincare/i.test(input)) {
      score = Math.min(score, 3);
      signals.push("consumer focus outside core B2B service");
    }
    if (/ghostwriter/i.test(text)) {
      score = Math.min(score, 4);
      signals.push("similar service provider; fit needs review");
    }

    score = Math.min(score, 10);
    reason = signals.join("; ") || "Limited qualification signals";
  }

  const category = score >= 7 ? "hot" : score >= 4 ? "warm" : "not_fit";
  const notes = [];
  if (duplicateOf) notes.push(`Same person as ${duplicateOf}; keep session, avoid second draft`);
  if (!email) notes.push("Email missing; hold outreach");

  return {
    lead_id: row.lead_id,
    score,
    category,
    reason,
    recommended_service: category === "not_fit" ? null : services[row.source_tool] ?? null,
    duplicate_of: duplicateOf,
    handling_note: notes.join("; ") || null,
  };
}

const { data: leads, error } = await db
  .from("leads")
  .select("*")
  .order("lead_id");

if (error) throw error;

const seenEmails = new Map();
const results = leads.map((row) => {
  const email = (row.email ?? "").trim().toLowerCase();
  const duplicateOf = email ? seenEmails.get(email) ?? null : null;
  if (email && !duplicateOf) seenEmails.set(email, row.lead_id);
  return assess(row, duplicateOf);
});
const { error: saveError } = await db
  .from("lead_assessments")
  .upsert(results, { onConflict: "lead_id" });

if (saveError) throw saveError;
console.log(`Saved ${results.length} assessments to Supabase.`);
console.table(
  results.map(({ lead_id, score, category, duplicate_of, handling_note }) => ({
    lead_id, score, category, duplicate_of, handling_note
  }))
);

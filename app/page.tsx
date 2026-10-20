"use client";

import { useState } from "react";
import { gradeHook } from "../lib/gradeHook";
export default function Home() {
  const [showTool, setShowTool] = useState(false);
  const [hook, setHook] = useState("");
  const [result, setResult] = useState<ReturnType<typeof gradeHook> | null>(null);

  const [rewrites, setRewrites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contact, setContact] = useState({
    full_name: "",
    designation: "",
    email: "",
  });
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm text-teal-400">
          LinkedIn Writing Tool
        </p>

        <h1 className="mb-6 text-4xl font-bold">
          LinkedIn Hook Grader
        </h1>

        <p className="text-lg text-slate-300">
          Check the opening two lines of your LinkedIn post.
          Get a score, clear feedback, and three AI rewrites.
        </p>
        <form
          className="mt-10 space-y-5"
          hidden={showTool}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setContact({
              full_name: String(form.get("name") ?? "").trim(),
              designation: String(form.get("designation") ?? "").trim(),
              email: String(form.get("email") ?? "").trim(),
            });
            setShowTool(true);
          }}
        >
          <div>
            <label htmlFor="name" className="mb-2 block">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white"
            />
          </div>

          <div>
            <label htmlFor="designation" className="mb-2 block">
              Designation
            </label>
            <input
              id="designation"
              name="designation"
              type="text"
              placeholder="Example: Founder, Marketing Manager"
              required
              maxLength={100}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-teal-400 px-6 py-3 font-semibold text-slate-950"
          >
            Continue
          </button>
        </form>
        <section className="mt-10" hidden={!showTool}>
          <label htmlFor="hook" className="mb-2 block">
            Paste the opening two lines of your LinkedIn post
          </label>

          <textarea
            id="hook"
            name="hook"
            value={hook}
            onChange={(event) => {
              setHook(event.target.value);
              setResult(null);
            }}
            rows={4}
            maxLength={500}
            placeholder="Write your opening lines here..."
            className="w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white"
          />

          <button
            type="button"
            disabled={!hook.trim() || loading}
            onClick={async () => {
              setResult(gradeHook(hook));
              setRewrites([]);
              setError("");
              setLoading(true);

              try {
                const response = await fetch("/api/grade", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ hook, ...contact }),
                });
                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error ?? "Could not generate rewrites.");
                }
                setRewrites(data.rewrites);
              } catch (cause) {
                setError(
                  cause instanceof Error ? cause.message : "Could not generate rewrites.",
                );
              } finally {
                setLoading(false);
              }
            }}
            className="mt-4 rounded-lg bg-teal-400 px-6 py-3 font-semibold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Generating rewrites..." : "Grade my hook"}
          </button>

          {result && (
            <div className="mt-6 rounded-lg border border-slate-700 p-5">
              <h2 className="text-2xl font-bold">Score: {result.score}/100</h2>
              {result.feedback.length > 0 ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
                  {result.feedback.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-slate-300">All five checks passed.</p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowTool(false)}
            className="mt-4 block text-teal-400 underline"
          >
          {error && (
            <p role="alert" className="mt-4 text-red-300">
              {error}
            </p>
          )}

          {rewrites.length === 3 && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold">Three AI rewrites</h2>
              <ol className="mt-4 space-y-4">
                {rewrites.map((rewrite, index) => (
                  <li key={index} className="rounded-lg border border-slate-700 p-4">
                    <span className="text-sm text-teal-400">Option {index + 1}</span>
                    <p className="mt-2 whitespace-pre-line text-slate-200">
                      {rewrite}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
            Edit contact details

          </button>
        </section>
      </div>
    </main>
  );
}
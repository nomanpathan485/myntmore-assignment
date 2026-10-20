export function gradeHook(hook: string) {
  const lines = hook
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLine = lines[0] ?? "";
  const text = lines.join(" ");
  const words = text.split(/\s+/).filter(Boolean);

  const rules = [
    {
      passes: lines.length === 2,
      feedback: "Use exactly two opening lines.",
    },
    {
      passes: firstLine.length >= 20 && firstLine.length <= 100,
      feedback: "Keep the first line between 20 and 100 characters.",
    },
    {
      passes: words.length >= 10 && words.length <= 45,
      feedback: "Keep the two lines between 10 and 45 words.",
    },
    {
      passes: /\d/.test(text),
      feedback: "Add a specific number or measurable detail.",
    },
    {
      passes:
        !/game.chang|revolutionary|unlock the secret|you won't believe|🚀/i.test(
          text,
        ),
      feedback: "Remove clickbait or vague hype.",
    },
  ];

  return {
    score: rules.filter((rule) => rule.passes).length * 20,
    feedback: rules
      .filter((rule) => !rule.passes)
      .map((rule) => rule.feedback),
  };
}
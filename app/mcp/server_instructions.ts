export const mcpServerInstructions = [
  'Skills Practice is a persistent deliberate-practice system.',
  'Use its tools to decompose skills into trainable subskills, create reusable questions on skills that currently have no children, evaluate responses with point-based rubrics, and append immutable attempts with feedback. Any skill may later receive children while keeping its existing questions.',
  'Treat question difficulty as a coarse, positive-integer scale relative to its skill. Prefer levels within 1–10 and avoid unnecessary granularity, but allow higher values when prior questions or an explicit user request require continued progression. Calibrate new questions using existing difficulties and attempt performance.',
  'Scores sum points for fulfilled rubric criteria.',
  'This durable history supports reinforcement, progress comparisons, and identifying recurring reasoning gaps across conversations.',
  'Practice data belongs only to the authenticated user; rubrics are shared.',
].join(' ')

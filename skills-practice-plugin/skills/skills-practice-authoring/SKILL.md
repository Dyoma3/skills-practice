---
name: skills-practice-authoring
description: Design and create a complete Skills Practice starter bundle containing a skill tree, reusable rubric, and first question. Use when the user wants all three parts together from a learning goal or modeling exercise. Do not use when the user only wants to define or create a practice skill, answer an existing question, or score an attempt.
---

# Skills Practice Authoring

Create the smallest useful practice setup while keeping the interaction lightweight. Here,
"practice skill" means a domain record in Skills Practice, not this agent skill.

## Shape the exercise

- Work in the user's language.
- Use the supplied brief, learning goal, and learner context when they are sufficient. Ask one
  compact question only when a missing choice would materially change the practice skill or first
  exercise; group related missing details together.
- Make each leaf skill independently trainable. Use a root with children only when the capability
  genuinely needs decomposition. A narrow capability may be a root leaf with no parent.
- Keep the initial tree minimal. Do not create speculative future branches merely to make the tree
  look complete.
- Create new questions only on skills that currently have no children. Existing questions do not
  prevent a skill from receiving children later and remain attached after that decomposition.

## Draft the first bundle

Prepare a compact proposal containing:

1. The minimal practice-skill tree, with a short description for every node.
2. One first question assigned to exactly one leaf skill.
3. Its relative difficulty, normally on a coarse 1-10 scale and calibrated against existing
   questions for that leaf when any exist.
4. Optional scenario context and an optional reference answer. Include reasoning in a reference
   answer, not only the final result.
5. A reusable rubric whose criteria describe observable evidence and map that evidence to positive
   integer points. Use `criteria` for independently scorable evidence and `binary` only for a true
   all-or-nothing check.

The rubric must make scoring mechanical: a later evaluator should be able to mark fulfilled
criteria and sum their points without inventing a holistic score. Do not include `maxScore`; Skills
Practice derives it from the criterion points.

If the user is exploring or asks for help designing the setup, show this proposal and request one
confirmation for the complete bundle. If the user explicitly asks to create a sufficiently defined
bundle, that request is authorization to proceed without another confirmation. Do not create
records while material product choices remain unresolved.

## Reuse before creating

Use the connected Skills Practice MCP server for persistence.

- Search practice skills by the proposed names and descriptions before creating duplicates.
- Search the shared rubric catalog for an equivalent scoring contract. Reuse only when its
  semantics and point mapping match, not merely because its name is similar.
- Search questions for the selected leaf before choosing difficulty or creating a near-duplicate.
- When an existing record is a plausible but imperfect match, explain the difference and let the
  user choose between reuse and creation if that choice changes historical comparability.

## Persist safely

After approval or an explicit create request:

1. Create missing practice-skill nodes from parent to child and retain every returned ID.
2. Reuse the selected rubric or create the new rubric and retain its ID.
3. Create the question with the leaf `skillId`, the `rubricId`, difficulty, prompt, context, and
   reference answer.
4. Read back the created question and related records when the tools permit it.
5. Report what was created or reused, including names and IDs, and mention any requested item that
   could not be persisted.

Never mutate an existing rubric's scoring criteria after it has been used for attempts. Create a
new rubric when scoring evidence or points must change. Do not create an attempt as part of this
authoring workflow.

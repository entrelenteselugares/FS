---
name: gsd-feedback-usuarios
description: "Process user feedback with empathy, identifying UX issues, bugs, and usability flaws."
---

<objective>
Analyze user feedback (text, screenshots, annotations) with a focus on UI/UX, usability, and technical details. "Think like a user" to figure out why an interface failed them, and produce an action plan (FEEDBACK-ANALYSIS.md) to fix or clarify the product.
</objective>

<execution_context>
@.agent/get-shit-done/workflows/feedback-usuarios.md
</execution_context>

<context>
Feedback input: $ARGUMENTS — the raw user feedback, issue text, or path to a screenshot.
</context>

<process>
Execute @.agent/get-shit-done/workflows/feedback-usuarios.md end-to-end.
Preserve all workflow gates.
</process>

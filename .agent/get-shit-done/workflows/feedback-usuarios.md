<purpose>
Systematically analyze user feedback to translate customer friction into actionable engineering/design tasks. Output is a FEEDBACK-ANALYSIS.md.
</purpose>

<process>

## 0. Initialize

Extract the feedback content from the arguments.
If the feedback refers to screenshots, use vision capabilities to analyze the visual context.

Display banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► FEEDBACK ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 1. Empathy & Usability Analysis

Analyze the feedback from the user's perspective. Ask:

- What was the user trying to achieve?
- Where did the interface fail to guide them?
- Is this a technical bug, a missing feature, or a usability/clarity issue?

## 2. Generate Action Plan

Create `FEEDBACK-ANALYSIS.md` in the current directory or workspace root with:

- **User Intent**: What the user wanted to do.
- **Friction Point**: Why they couldn't do it.
- **Diagnosis**: The root cause (e.g. missing text, confusing button name, technical error).
- **Action Plan**: Concrete steps to resolve the issue (code changes, UI tweaks, or documentation/explanation to the user).

## 3. Present Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► FEEDBACK ANALYSIS COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analysis saved to FEEDBACK-ANALYSIS.md

Top Recommendations:
1. {rec 1}
2. {rec 2}

▶ Next:
- /gsd-fast — to fix simple issues inline
- /gsd-plan-phase {N} — to plan a larger phase for the fixes
```

</process>

<success_criteria>

- [ ] User feedback analyzed with UX empathy
- [ ] Root cause identified (bug vs. usability)
- [ ] Actionable FEEDBACK-ANALYSIS.md generated

</success_criteria>

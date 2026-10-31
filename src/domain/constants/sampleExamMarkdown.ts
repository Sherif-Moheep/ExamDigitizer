export const SAMPLE_EXAM_MARKDOWN = `# [University / Institution Name]
## [Department / Faculty Name]
* **Course:** [Course Name] ([Course Code])
* **Date:** [Semester / Academic Year]
* **Duration:** 2 Hours
* **Total Marks:** 100 Marks
---

## Part I: Multiple Choice Questions (40 Marks)

**1.** Which of the following functions asymptotically grows the fastest as $n \\to \\infty$?
* (a) $f(n) = n^2 \\log_2(n)$
* (b) $g(n) = 2^n$
* (c) $h(n) = n!$
* (d) $k(n) = n^{\\log_2(n)}$

[SOLVE_SPACE_HERE]

**2.** For any connected planar graph with $V$ vertices, $E$ edges, and $F$ faces, Euler's formula states that $V - E + F = 2$.
* (a) True
* (b) False

[SOLVE_SPACE:3]

[PAGE_BREAK]

## Part II: Problem Solving (60 Marks)

**Question 3:** Consider the recurrence relation defined by:

$$T(n) = 2T\\left(\\frac{n}{2}\\right) + \\Theta(n)$$

Apply the Master Theorem to find the asymptotic tight bound $\\Theta$ of $T(n)$. Show each step of your derivation.

[SOLVE_SPACE:8]

**Question 4:** Complete the truth table for the logical propositions below:

| $p$ | $q$ | $p \\land q$ | $p \\to q$ | $\\neg(p \\leftrightarrow q)$ |
| :---: | :---: | :---: | :---: | :---: |
| T | T | T | T | F |
| T | F | F | F | T |
| F | T | F | T | T |
| F | F | F | T | F |

[SOLVE_SPACE:6]

<!--
=== Exam Formatting Quick Reference ===
- Headers & Meta: Use # for institution, ## for faculty/dept, bullet list (* **Key:** Value) for info, and --- underneath.
- Question Labels: Use bold prefix (**1.**, **Question 1:**, **Problem (1)**) so question styling is applied.
- Math Formulas: $...$ for inline math, $$...$$ for centered block math equations.
- Dynamic Lines: [SOLVE_SPACE_HERE] inserts answer lines matching the "Answer Lines" slider in the preview bar.
- Fixed Lines: [SOLVE_SPACE:n] inserts exactly n answer lines (e.g., [SOLVE_SPACE:6]).
- Page Breaks: [PAGE_BREAK] or \\pagebreak forces a print page break.
-->
`;

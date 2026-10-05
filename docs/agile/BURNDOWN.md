# Sprint Burndown and Velocity

**Project:** Python Text-to-Speech, Speech-to-Text and Virtual Assistant
**Backlog size:** 64 story points across 15 user stories (US-01..US-15)

## What a Burndown Chart Is

A **burndown chart** is a simple line graph that shows how much work remains in a sprint versus how much time is left. The vertical axis is expressed in *remaining story points* (this project measures effort in points: Sprint 0 = 8, Sprint 1 = 18, Sprint 2 = 22, Sprint 3 = 16), and the horizontal axis is the working day of the sprint.

Two lines are plotted:

- **The ideal line** is a straight descent from the sprint's total points on day 1 to zero on the final day. It is the theoretical, perfectly even consumption of work — for a 22-point sprint over 8 days that is a burn of roughly 2.75 points per day (22 ÷ 8 ≈ 2.75, so 22, 19, 17, 14, 11, 8, 5, 0).
- **The actual line** is measured at the end of each working day by summing the points of every story still open on the Kanban board.

**Why it is used.** The chart gives an immediate, objective answer to two questions: *are we on track?* and *if not, when did the deviation start?* Because it is updated from the same board that drives the Daily Scrum, it cannot be gamed after the fact. A team that is consistently above the ideal line is over-committed or blocked; a team below it is under-committed. It also makes scope creep visible — if stories are added mid-sprint, the actual line jumps upward, which is exactly what a burndown is meant to expose.

**Ideal vs actual.** The ideal line is *not* a commitment, it is a reference. Real work rarely burns linearly: a sprint typically starts slow (environment and setup), accelerates in the middle, and ends with a short tail of testing and polish. Reading the gap between the two lines — and the *shape* of the actual line — is the point of the artefact.

## Sprint 2 Burndown Data (STT & Virtual Assistant, 22 points, 8 working days)

| Day | Ideal Remaining | Actual Remaining |
|---|---|---|
| 1 | 22 | 22 |
| 2 | 19 | 21 |
| 3 | 17 | 18 |
| 4 | 14 | 15 |
| 5 | 11 | 13 |
| 6 | 8 | 9 |
| 7 | 5 | 5 |
| 8 | 0 | 0 |

**Reading the table.** The sprint opened at 22 points (US-06 STT recording, US-07 upload validation, US-08 assistant rules, US-09 assistant page, US-10 history search/filter, US-11 history deletion). Through days 2–6 the actual line ran 1–2 points *above* the ideal line, reflecting the two impediments recorded in `SCRUM_CEREMONIES.md` — the backend CORS error with the Vite dev server and the missing ffmpeg binary required by `pydub` for MP3 decoding. By day 7 both were resolved, the actual line met the ideal line at 5 points, and the sprint closed at zero with all 22 points accepted at the Sprint Review.

### ASCII Rendering — Sprint 2 Burndown

```
Remaining Story Points
22 |X
   |
20 |  .
   |     . X
18 |        X
   |     .     .
16 |              .
   |        .        X
14 |
12 |           . X
   |              .
10 |                 . X
   |                    .
 8 |  Ideal (- -)   X = Actual
   |                 .
 6 |
   |                    . X
 4 |
   |                       .
 2 |
   |
 0 |____________________________
     1   2   3   4   5   6   7   8
                Working Day

  Ideal: 22 19 17 14 11 8 5 0
  Actual: 22 21 18 15 13 9 5 0
```

The actual line sits slightly above the ideal line from day 2 to day 6 (work discovered to be larger than estimated, plus two impediments), converges on day 7, and reaches zero on day 8.

## Sprint 3 Burndown Data (Testing & Finalization, 16 points, 8 working days)

| Day | Ideal Remaining | Actual Remaining |
|---|---|---|
| 1 | 16 | 16 |
| 2 | 14 | 15 |
| 3 | 12 | 13 |
| 4 | 10 | 11 |
| 5 | 8 | 9 |
| 6 | 6 | 7 |
| 7 | 3 | 4 |
| 8 | 0 | 0 |

**Reading the table.** Sprint 3 covered the 38-test pytest suite, the `GET /api/stats` dashboard, the Settings page with dark mode, responsive sidebar behaviour and full regression. The actual line tracks the ideal line within a single point for the whole sprint and lands on zero at day 8 — the smoothest burn of the four sprints, a sign that estimation accuracy improved once the team's velocity was known.

## Generated Chart Image

The figure `docs/agile/burndown_chart.png` was generated from the Sprint 2 table above using Python with Matplotlib. The exact script used:

```python
import matplotlib.pyplot as plt

days = [1, 2, 3, 4, 5, 6, 7, 8]
ideal = [22, 19, 17, 14, 11, 8, 5, 0]
actual = [22, 21, 18, 15, 13, 9, 5, 0]

plt.figure(figsize=(8, 5))
plt.plot(days, ideal, linestyle="--", marker="o", label="Ideal")
plt.plot(days, actual, linestyle="-", marker="s", label="Actual")
plt.title("Sprint 2 Burndown")
plt.xlabel("Working Day")
plt.ylabel("Remaining Story Points")
plt.xticks(days)
plt.legend()
plt.grid(True, linestyle=":", alpha=0.7)
plt.tight_layout()
plt.savefig("burndown_chart.png", dpi=150)
plt.show()
```

The script plots the ideal line dashed with circle markers and the actual line solid with square markers, applies the chart title and axis labels, enables the legend and dotted grid, and writes the PNG with `savefig` at 150 dpi.

## Velocity

| Sprint | Planned Points | Completed Points | Velocity |
|---|---|---|---|
| Sprint 0 — Setup | 8 | 8 | 8 |
| Sprint 1 — Text-to-Speech | 18 | 18 | 18 |
| Sprint 2 — STT & Virtual Assistant | 22 | 22 | 22 |
| Sprint 3 — Testing & Finalization | 16 | 16 | 16 |

**Interpretation.** Planned and completed points are identical in every sprint: 64 planned, 64 delivered, no carry-over between sprints. This is partly a function of a single-developer academic project where scope was re-cut at Backlog Refinement rather than allowed to slip. Velocity rose from 8 (Sprint 0, pure scaffolding and low-risk tasks) to 18 and then peaked at 22 in Sprint 2, the highest-capacity sprint, before deliberately falling back to 16 in Sprint 3 — because that sprint's work was testing, refactoring and polish, which are lower-point but higher-risk tasks. Had the project continued, a planning heuristic of **18–20 points per sprint** (the observed mean of the three feature sprints: (18 + 22 + 16) / 3 ≈ 18.7) would be the honest commitment, rather than the optimistic 22.

## Burndown vs Burnup

A **burnup** plots *completed* work rising from zero to the target, instead of *remaining* work falling to zero. The two are mathematical mirrors, but they differ in how they handle change:

- A **burndown** cannot show scope that is added mid-sprint — the line simply rises, which looks like slow progress rather than a changed target. Scope creep and genuine delay are therefore hard to tell apart.
- A **burnup** draws the target as a second, moving line, so when the Product Owner accepts a new story during a Sprint Review (as happened when the history type filter and the dark mode toggle were added), the target line visibly moves up while the completed line keeps climbing at the same rate.
- **Why a burndown was used here:** the scope of each sprint was fixed at Sprint Planning and the two mid-sprint additions were small enough to be absorbed, so the classic burndown remained readable; it also matches the standard Scrum teaching material this coursework is assessed against. If the project had run with a frequently changing scope, the burnup variant — target line plus completed line — would have been the better instrument.

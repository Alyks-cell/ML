# Study Buddy rule catalog

## Rule form and precedence

Rules are condition–action entries. The engine evaluates them in this order:

1. **Subject rule:** `IF subject = S AND challenge = P THEN method = M, reason = R, steps = [..]`.
2. **General rule:** `IF challenge = P THEN method = M, reason = R, steps = [..]` when no subject rule exists.
3. **Starter rule:** `IF no rule matches THEN use a short active-recall plan` and label it **Starting point**.
4. **Time policy:** `IF time = 15 min THEN show 2 steps`; `30 min` and `60+ min` show up to 4 steps. Time changes plan scope and the time note; it does not currently select a different method.

“Strong match” means a subject-specific rule matched. “Good match” means a general challenge rule matched. These are rule-coverage labels, not probabilities or measured success rates. Feedback is stored in the student's browser. After two or more “not helpful” ratings for the same rule and method, the next plan promotes a backup method; the rule is not silently rewritten for other students.

## Subject and challenge table

| Subject | Challenge | Rule route | Recommended method |
|---|---|---|---|
| Math | Memorizing formulas | Subject rule | Formula Deconstruction |
| Math | Solving word problems | Subject rule | Translate → Plan → Solve |
| Math | Understanding concepts | Subject rule | Concept Mapping |
| Math | Showing work / steps | Subject rule | Narrated Solution Practice |
| Math | Preparing for a test | General rule | Self-Test & Target Review |
| Math | Staying focused | General rule | Single-Task Sprint |
| Math | Getting started | General rule | Two-Minute Launch |
| Science | Memorizing terms & definitions | Subject rule | Term–Example Flashcards |
| Science | Understanding concepts | General rule | Read → Recall → Check |
| Science | Connecting theory to experiments | Subject rule | Hypothesis–Evidence Bridge |
| Science | Interpreting graphs & data | Subject rule | Graph Narration |
| Science | Preparing for a test | General rule | Self-Test & Target Review |
| Science | Staying focused | General rule | Single-Task Sprint |
| Science | Getting started | General rule | Two-Minute Launch |
| History | Remembering dates & events | Subject rule | Timeline Story Building |
| History | Understanding cause & effect | Subject rule | Because → Therefore Chain |
| History | Writing essays | General rule | Thesis → Outline → Draft |
| History | Connecting themes across eras | Subject rule | Theme Comparison Table |
| History | Preparing for a test | General rule | Self-Test & Target Review |
| History | Staying focused | General rule | Single-Task Sprint |
| History | Getting started | General rule | Two-Minute Launch |
| English | Writing essays | General rule | Thesis → Outline → Draft |
| English | Understanding literature | Subject rule | Close Reading + Annotation |
| English | Grammar & sentence structure | Subject rule | Error Hunt + Rewrite |
| English | Building vocabulary | Subject rule | Context–Use–Review Cycle |
| English | Preparing for a test | General rule | Self-Test & Target Review |
| English | Staying focused | General rule | Single-Task Sprint |
| English | Getting started | General rule | Two-Minute Launch |
| Programming | Understanding concepts | Subject rule | Code → Explain → Modify |
| Programming | Debugging code | Subject rule | Isolate → Reproduce → Fix |
| Programming | Solving problems | Subject rule | Pseudocode First |
| Programming | Remembering syntax | Subject rule | Cheat Sheet + Drill |
| Programming | Building projects | Subject rule | Feature Slice Approach |
| Programming | Preparing for a test | General rule | Self-Test & Target Review |
| Programming | Staying focused | General rule | Single-Task Sprint |
| Programming | Getting started | General rule | Two-Minute Launch |
| Other | Understanding concepts | General rule | Read → Recall → Check |
| Other | Remembering facts | General rule | Active Recall Flashcards |
| Other | Writing essays | General rule | Thesis → Outline → Draft |
| Other | Preparing for a test | General rule | Self-Test & Target Review |
| Other | Staying focused | General rule | Single-Task Sprint |
| Other | Getting started | General rule | Two-Minute Launch |

## Time policies

| Input | Display label | Maximum steps | Guidance |
|---|---|---:|---|
| `short` | ~15 minutes | 2 | Prioritize the first two steps. |
| `medium` | ~30 minutes | 4 | Complete the plan; take a short break if needed. |
| `long` | 60+ minutes | 4 | Repeat the method on another topic or problem set. |

## Coverage check

`test_app.py` enumerates each listed subject–challenge pair at all three time settings (42 × 3 = 126 paths), checks that each returns a complete plan, and checks that unknown challenges receive the labeled starter rule.

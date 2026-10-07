# Study Buddy — Expert System Study Method Recommender

A study method recommender powered by an **Expert System inference engine**. Built with vanilla HTML, modern CSS, JavaScript, and a zero-dependency Python backend using only the standard library.

---

## 🌟 Key Features

1. **Rule-Based Expert System**:
   - 18 subject-specific rules plus 7 general challenge rules across Math, Science, History, English, Programming, and general topics.
   - Dynamic struggle filtering: selecting a subject only presents challenges relevant to that domain.
   - Inference transparency: explains the matched challenge and labels rule coverage as Strong, Good, or a Starting point. These labels are not success probabilities.
   - See [RULES.md](RULES.md) for the full condition-action table, fallback paths, time policies, and coverage notes.

2. **Time-Aware Inference Engine**:
   - Adapts the recommended steps and study strategy according to available time (15-min sprint, 30-min session, 60+ min deep dive).

3. **Interactive Study Experience**:
   - **Interactive Step Checklist**: Students can click on recommended steps to check them off in real-time as they work.
   - **Built-in Focus Sprint Timer**: Countdown timer (with start/pause/reset) synchronized to the user's selected study duration.
   - **One-Click Plan Copy**: Easily copy the formatted study plan and steps to clipboard for notes or sharing.
   - **Plan Feedback**: After completing a session, rate whether the recommendation helped. Repeated negative feedback promotes an untried backup method for that challenge; feedback stays in the browser.
   - **Research Notes**: The page links to research on practice testing and distributed practice, and explains the limits of its rule-fit labels.

4. **Modern Design Aesthetics**:
   - Deep dark theme with glassmorphism backdrop filters and ambient mesh glow.
   - Micro-interactions, animated badges, and responsive layouts for mobile and desktop.

---

## 🚀 How to Run

1. Ensure **Python 3** is installed.
2. In this folder, launch the server:
   ```bash
   python app.py
   ```
3. Open your browser and navigate to:
   ```
   http://127.0.0.1:8000
   ```

## Rule coverage

Run the exhaustive coverage checks from this directory:

```bash
python -m unittest test_app.py
```

The suite checks all 126 listed subject–challenge–time paths and the unknown-challenge fallback.

---

## 📐 Expert System Architecture

- **Knowledge Base (`RULES`, `GENERIC_RULES`)**: Stores condition-action pairs: `(Subject, Struggle) -> (Method, Reason, Steps[])`.
- **Inference Engine (`recommend()`)**: Uses ordered lookup: subject-and-challenge rule, general challenge rule, then a safe recall starter. Time policies limit the number of displayed steps.
- **Explanation Facility (`fit`, `reason`)**: Explains the matched challenge and distinguishes subject-specific matches from general fallbacks; labels are rule coverage, not probabilities.
- **Feedback adaptation**: Two or more negative ratings for a method promote an available backup for that same subject and challenge in that browser.

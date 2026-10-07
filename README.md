# Study Buddy — Expert System Study Method Recommender

A study method recommender powered by an **Expert System inference engine**. Built with vanilla HTML, modern CSS, JavaScript, and a zero-dependency Python backend using only the standard library.

---

## 🌟 Key Features

1. **Rule-Based Expert System**:
   - Over 30+ domain-specific rules (Math, Science, History, English, Programming, and general topics).
   - Dynamic struggle filtering: selecting a subject only presents challenges relevant to that domain.
   - Inference transparency: displays which rule fired in the knowledge base (e.g., `math + solving word problems`).

2. **Time-Aware Inference Engine**:
   - Adapts the recommended steps and study strategy according to available time (15-min sprint, 30-min session, 60+ min deep dive).

3. **Interactive Study Experience**:
   - **Interactive Step Checklist**: Students can click on recommended steps to check them off in real-time as they work.
   - **Built-in Focus Sprint Timer**: Countdown timer (with start/pause/reset) synchronized to the user's selected study duration.
   - **One-Click Plan Copy**: Easily copy the formatted study plan and steps to clipboard for notes or sharing.

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

---

## 📐 Expert System Architecture

- **Knowledge Base (`RULES`, `GENERIC_RULES`)**: Stores condition-action pairs: `(Subject, Struggle) -> (Method, Reason, Steps[])`.
- **Inference Engine (`recommend()`)**: Evaluates forward-chaining rules with domain specificity precedence, falling back gracefully to generalized learning strategies when appropriate.
- **Explanation Facility (`rule_trace`, `reason`)**: Explains *why* the recommendation was made and *which* rule triggered.

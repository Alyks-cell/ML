/* ---------------------------------------------------------------
   app.js — Study Buddy Expert System Frontend
   --------------------------------------------------------------- */

const subjectGrid = document.getElementById("subject-grid");
const struggleSelect = document.getElementById("struggle");
const timeGrid = document.getElementById("time-grid");
const result = document.getElementById("result");
const errorEl = document.getElementById("error");
const recommendBtn = document.getElementById("recommend");

let selectedSubject = "";
let selectedTime = "medium";

/* ── Subject selection (card grid) ─────────────────────────────── */
subjectGrid.addEventListener("click", async (e) => {
  const btn = e.target.closest(".subject");
  if (!btn) return;

  // Toggle active state
  subjectGrid.querySelectorAll(".subject").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedSubject = btn.dataset.value;

  // Hide any previous result
  result.hidden = true;
  errorEl.textContent = "";

  // Fetch relevant struggles from backend
  struggleSelect.disabled = true;
  struggleSelect.innerHTML = '<option value="" disabled selected>Loading…</option>';

  try {
    const res = await fetch("/struggles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: selectedSubject }),
    });
    if (!res.ok) throw new Error("Couldn't load struggles");
    const data = await res.json();

    struggleSelect.innerHTML = '<option value="" disabled selected>Pick the closest one…</option>';
    data.struggles.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      struggleSelect.appendChild(opt);
    });
    struggleSelect.disabled = false;
  } catch {
    struggleSelect.innerHTML = '<option value="" disabled selected>Error — try again</option>';
  }
});

/* ── Time selection ────────────────────────────────────────────── */
timeGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".time-btn");
  if (!btn) return;
  timeGrid.querySelectorAll(".time-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedTime = btn.dataset.value;
});

/* ── Recommend button ──────────────────────────────────────────── */
recommendBtn.addEventListener("click", async () => {
  errorEl.textContent = "";

  // Validate
  if (!selectedSubject) {
    errorEl.textContent = "Pick a subject first.";
    return;
  }
  if (!struggleSelect.value) {
    errorEl.textContent = "Tell us what's tripping you up.";
    struggleSelect.focus();
    return;
  }

  recommendBtn.disabled = true;
  recommendBtn.innerHTML = 'Finding a good fit <span>…</span>';

  try {
    const response = await fetch("/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: selectedSubject,
        struggle: struggleSelect.value,
        time: selectedTime,
      }),
    });
    if (!response.ok) throw new Error("Couldn't get a tip just now. Try again.");
    const data = await response.json();

    // Populate result
    document.getElementById("method-name").textContent = data.method;
    document.getElementById("method-reason").textContent = data.reason;
    document.getElementById("time-note").textContent = data.time_note;
    document.getElementById("result-meta").textContent =
      `${data.subject} · ${data.struggle} · ${data.time_label}`;

    // Steps
    const stepsList = document.getElementById("steps-list");
    stepsList.innerHTML = "";
    data.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      stepsList.appendChild(li);
    });

    // Rule trace (expert system transparency)
    document.getElementById("rule-trace").textContent =
      `Rule fired: ${data.rule_used}`;

    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    recommendBtn.disabled = false;
    recommendBtn.innerHTML = 'Find my study method <span>→</span>';
  }
});

/* ── Reset button ──────────────────────────────────────────────── */
document.getElementById("again").addEventListener("click", () => {
  result.hidden = true;
  // Reset subject
  subjectGrid.querySelectorAll(".subject").forEach((b) => b.classList.remove("active"));
  selectedSubject = "";
  // Reset struggle
  struggleSelect.innerHTML = '<option value="" disabled selected>Choose a subject first…</option>';
  struggleSelect.disabled = true;
  // Reset time to medium
  timeGrid.querySelectorAll(".time-btn").forEach((b) => b.classList.remove("active"));
  timeGrid.querySelector('[data-value="medium"]').classList.add("active");
  selectedTime = "medium";
  // Clear error
  errorEl.textContent = "";
  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
});

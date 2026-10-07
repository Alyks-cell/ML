/* ---------------------------------------------------------------
   app.js — Study Buddy Expert System Frontend
   --------------------------------------------------------------- */

/* ── DOM Elements ─────────────────────────────────────────────── */
const themeToggle = document.getElementById("theme-toggle");
const subjectGrid = document.getElementById("subject-grid");
const struggleSelect = document.getElementById("struggle");
const timeGrid = document.getElementById("time-grid");
const result = document.getElementById("result");
const errorEl = document.getElementById("error");
const recommendBtn = document.getElementById("recommend");

// Timer elements
const timerBox = document.getElementById("timer-box");
const timerDisplay = document.getElementById("timer-display");
const timerStatus = document.getElementById("timer-status");
const timerToggle = document.getElementById("timer-toggle");
const timerReset = document.getElementById("timer-reset");
const timerBtnText = document.getElementById("timer-btn-text");
const timerPlayIcon = document.getElementById("timer-play-icon");

// Steps & Action elements
const stepsList = document.getElementById("steps-list");
const stepsProgress = document.getElementById("steps-progress");
const copyBtn = document.getElementById("copy-btn");
const copyText = document.getElementById("copy-text");

/* ── State ────────────────────────────────────────────────────── */
let selectedSubject = "";
let selectedTime = "medium";

// Timer state
let timerInterval = null;
let timerTotalSeconds = 25 * 60;
let timerRemainingSeconds = 25 * 60;
let isTimerRunning = false;

// Cached recommendation data for copying
let currentPlanData = null;

/* ── Theme Switcher (Light / Dark Mode) ────────────────────────── */
function initTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("study-buddy-theme", nextTheme);
  });
}

initTheme();

/* ── Step 1: Subject Selection (Card Grid) ────────────────────── */
subjectGrid.addEventListener("click", async (e) => {
  const btn = e.target.closest(".subject");
  if (!btn) return;

  // Toggle active styling
  subjectGrid.querySelectorAll(".subject").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedSubject = btn.dataset.value;

  // Hide any previous result
  result.hidden = true;
  errorEl.textContent = "";

  // Fetch relevant struggles from backend
  struggleSelect.disabled = true;
  struggleSelect.innerHTML = '<option value="" disabled selected>Loading challenges…</option>';

  try {
    const res = await fetch("/struggles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: selectedSubject }),
    });
    if (!res.ok) throw new Error("Couldn't load challenges");
    const data = await res.json();

    struggleSelect.innerHTML = '<option value="" disabled selected>Pick what’s tripping you up…</option>';
    data.struggles.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      struggleSelect.appendChild(opt);
    });
    struggleSelect.disabled = false;
  } catch {
    struggleSelect.innerHTML = '<option value="" disabled selected>Error loading options — try again</option>';
  }
});

/* ── Step 2: Time Selection ───────────────────────────────────── */
timeGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".time-btn");
  if (!btn) return;
  timeGrid.querySelectorAll(".time-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  selectedTime = btn.dataset.value;
});

/* ── Step 3: Recommend Button ─────────────────────────────────── */
recommendBtn.addEventListener("click", async () => {
  errorEl.textContent = "";

  // Validation
  if (!selectedSubject) {
    errorEl.textContent = "Please pick a subject first.";
    return;
  }
  if (!struggleSelect.value) {
    errorEl.textContent = "Please select what’s tripping you up.";
    struggleSelect.focus();
    return;
  }

  recommendBtn.disabled = true;
  const originalHtml = recommendBtn.innerHTML;
  recommendBtn.innerHTML = 'Finding your fit <span>…</span>';

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
    if (!response.ok) throw new Error("Couldn't get a plan right now. Please try again.");
    const data = await response.json();
    currentPlanData = data;

    // Populate recommendation content
    document.getElementById("method-name").textContent = data.method;
    document.getElementById("method-reason").textContent = data.reason;
    document.getElementById("time-note").textContent = data.time_note;
    document.getElementById("result-meta").textContent =
      `${data.subject} · ${data.struggle} · ${data.time_label}`;

    // Populate actionable steps checklist
    stepsList.innerHTML = "";
    data.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      li.setAttribute("role", "checkbox");
      li.setAttribute("aria-checked", "false");
      stepsList.appendChild(li);
    });
    updateProgress();

    // Rule trace for transparency
    document.getElementById("rule-trace").textContent =
      `Inference engine rule fired: ${data.rule_used}`;

    // Setup focus timer based on selected duration
    setupTimer(selectedTime);

    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    recommendBtn.disabled = false;
    recommendBtn.innerHTML = 'Find my study method <span>→</span>';
  }
});

/* ── Interactive Checklist ─────────────────────────────────────── */
stepsList.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  li.classList.toggle("completed");
  const isCompleted = li.classList.contains("completed");
  li.setAttribute("aria-checked", isCompleted ? "true" : "false");
  updateProgress();
});

function updateProgress() {
  if (!stepsProgress) return;
  const all = stepsList.querySelectorAll("li");
  const done = stepsList.querySelectorAll("li.completed");
  stepsProgress.textContent = `${done.length}/${all.length} done`;
  if (all.length > 0 && done.length === all.length) {
    stepsProgress.textContent = "All steps complete! 🎉";
  }
}

/* ── Focus Sprint Timer ────────────────────────────────────────── */
function setupTimer(timeChoice) {
  if (!timerBox) return;
  stopTimer();
  let minutes = 25;
  if (timeChoice === "short") minutes = 15;
  else if (timeChoice === "medium") minutes = 30;
  else if (timeChoice === "long") minutes = 50;

  timerTotalSeconds = minutes * 60;
  timerRemainingSeconds = timerTotalSeconds;
  renderTimer();
  if (timerStatus) {
    timerStatus.textContent = "Ready";
    timerStatus.classList.remove("running");
  }
  timerBox.classList.remove("running");
  setTimerButtonState(false);
}

function renderTimer() {
  if (!timerDisplay) return;
  const m = Math.floor(timerRemainingSeconds / 60);
  const s = timerRemainingSeconds % 60;
  timerDisplay.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  if (timerStatus) {
    timerStatus.textContent = "Focusing";
    timerStatus.classList.add("running");
  }
  if (timerBox) timerBox.classList.add("running");
  setTimerButtonState(true);

  timerInterval = setInterval(() => {
    if (timerRemainingSeconds > 0) {
      timerRemainingSeconds--;
      renderTimer();
    } else {
      stopTimer();
      if (timerStatus) {
        timerStatus.textContent = "Session complete! 🎉";
        timerStatus.classList.remove("running");
      }
      if (timerBox) timerBox.classList.remove("running");
      setTimerButtonState(false);
    }
  }, 1000);
}

function pauseTimer() {
  if (!isTimerRunning) return;
  clearInterval(timerInterval);
  isTimerRunning = false;
  if (timerStatus) {
    timerStatus.textContent = "Paused";
    timerStatus.classList.remove("running");
  }
  if (timerBox) timerBox.classList.remove("running");
  setTimerButtonState(false);
}

function stopTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
}

function setTimerButtonState(running) {
  if (!timerBtnText || !timerPlayIcon) return;
  if (running) {
    timerBtnText.textContent = "Pause Timer";
    timerPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  } else {
    timerBtnText.textContent = timerRemainingSeconds < timerTotalSeconds ? "Resume Timer" : "Start Focus Timer";
    timerPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  }
}

if (timerToggle) {
  timerToggle.addEventListener("click", () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });
}

if (timerReset) {
  timerReset.addEventListener("click", () => {
    stopTimer();
    timerRemainingSeconds = timerTotalSeconds;
    renderTimer();
    if (timerStatus) {
      timerStatus.textContent = "Ready";
      timerStatus.classList.remove("running");
    }
    if (timerBox) timerBox.classList.remove("running");
    setTimerButtonState(false);
  });
}

/* ── Copy Plan to Clipboard ────────────────────────────────────── */
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    if (!currentPlanData) return;
    const formattedSteps = currentPlanData.steps
      .map((step, idx) => `${idx + 1}. ${step}`)
      .join("\n");

    const textToCopy = `📚 Study Plan: ${currentPlanData.method}\n` +
      `Subject: ${currentPlanData.subject} (${currentPlanData.struggle})\n` +
      `Duration: ${currentPlanData.time_label}\n\n` +
      `Why it helps:\n${currentPlanData.reason}\n\n` +
      `Actionable Steps:\n${formattedSteps}\n\n` +
      `Time Tip:\n${currentPlanData.time_note}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      copyBtn.classList.add("copied");
      if (copyText) copyText.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.classList.remove("copied");
        if (copyText) copyText.textContent = "Copy Plan";
      }, 2000);
    } catch {
      if (copyText) copyText.textContent = "Press Ctrl+C to copy";
    }
  });
}

/* ── Reset Button ──────────────────────────────────────────────── */
document.getElementById("again").addEventListener("click", () => {
  result.hidden = true;
  stopTimer();

  // Reset subject
  subjectGrid.querySelectorAll(".subject").forEach((b) => b.classList.remove("active"));
  selectedSubject = "";

  // Reset struggle dropdown
  struggleSelect.innerHTML = '<option value="" disabled selected>Choose a subject first…</option>';
  struggleSelect.disabled = true;

  // Reset time to medium
  timeGrid.querySelectorAll(".time-btn").forEach((b) => b.classList.remove("active"));
  const defaultTimeBtn = timeGrid.querySelector('[data-value="medium"]');
  if (defaultTimeBtn) defaultTimeBtn.classList.add("active");
  selectedTime = "medium";

  // Clear errors and scroll up
  errorEl.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

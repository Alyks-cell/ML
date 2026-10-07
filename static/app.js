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
const alternativesList = document.getElementById("alternatives-list");
const markDoneBtn = document.getElementById("mark-done");
const streakSummary = document.getElementById("streak-summary");
const feedbackPanel = document.getElementById("feedback-panel");

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
  subjectGrid.querySelectorAll(".subject").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed", "false");
  });
  btn.classList.add("active");
  btn.setAttribute("aria-pressed", "true");
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
  timeGrid.querySelectorAll(".time-btn").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed", "false");
  });
  btn.classList.add("active");
  btn.setAttribute("aria-pressed", "true");
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
  recommendBtn.classList.add("is-loading");
  recommendBtn.setAttribute("aria-busy", "true");
  recommendBtn.textContent = "Matching your best method…";

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
    normalizeRecommendation(data);
    applyPriorFeedback(data);
    currentPlanData = data;

    // Populate recommendation content
    document.getElementById("method-name").textContent = data.method;
    const timePhrase = selectedTime === "short" ? "about 15 minutes" : selectedTime === "long" ? "an hour or more" : "about 30 minutes";
    document.getElementById("method-reason").textContent =
      `Because you said you're struggling with ${data.struggle.toLowerCase()} in ${data.subject}, and you have ${timePhrase}, ${data.method} gives you a focused way to practice. ${data.reason}`;
    document.getElementById("time-note").textContent = data.time_note;
    document.getElementById("result-meta").textContent =
      `${data.subject} · ${data.struggle} · ${data.time_label}`;
    document.getElementById("fit-label").textContent = data.feedbackAdjusted
      ? "Feedback-guided · based on your history"
      : `${data.fit.label} · rule fit, not a probability`;
    document.getElementById("fit-basis").textContent = data.feedbackAdjusted
      ? data.fit.basis
      : data.fit.basis;

    alternativesList.replaceChildren();
    (data.alternatives || []).forEach((alternative) => {
      const item = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = alternative.method;
      item.append(name, document.createTextNode(` — ${alternative.description}`));
      alternativesList.appendChild(item);
    });
    markDoneBtn.disabled = false;
    markDoneBtn.textContent = "Mark session done";
    feedbackPanel.hidden = true;
    document.querySelectorAll(".feedback-btn").forEach((button) => { button.disabled = false; });
    document.getElementById("feedback-status").textContent = "";
    renderStreak();

    // Populate actionable steps checklist
    stepsList.innerHTML = "";
    data.steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      li.setAttribute("role", "checkbox");
      li.setAttribute("aria-checked", "false");
      li.tabIndex = 0;
      stepsList.appendChild(li);
    });
    data.time_breakdown = renderTimeBreakdown(selectedTime, data.steps);
    updateProgress();

    // Rule trace for transparency
    document.getElementById("rule-trace").textContent =
      `Matched to your ${data.subject.toLowerCase()} challenge: ${data.struggle.toLowerCase()}.`;

    // Setup focus timer based on selected duration
    setupTimer(selectedTime);

    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    recommendBtn.disabled = false;
    recommendBtn.innerHTML = 'Find my study method <span>→</span>';
    recommendBtn.classList.remove("is-loading");
    recommendBtn.setAttribute("aria-busy", "false");
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

stepsList.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("li[role='checkbox']")) {
    e.preventDefault();
    e.target.click();
  }
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

function renderTimeBreakdown(timeChoice, steps) {
  const total = timeChoice === "short" ? 15 : timeChoice === "long" ? 60 : 30;
  const setup = timeChoice === "short" ? 2 : timeChoice === "long" ? 5 : 3;
  const review = timeChoice === "short" ? 2 : timeChoice === "long" ? 10 : 3;
  const work = total - setup - review;
  const basePerStep = Math.floor(work / steps.length);
  let extraMinutes = work % steps.length;
  let minute = setup;
  const items = [`0–${setup} min: Get your materials ready and set one focus goal.`];

  steps.forEach((step, index) => {
    const duration = basePerStep + (extraMinutes > 0 ? 1 : 0);
    extraMinutes -= extraMinutes > 0 ? 1 : 0;
    items.push(`${minute}–${minute + duration} min: ${step}`);
    minute += duration;
  });
  items.push(`${minute}–${total} min: Check what you remember and note what to review next.`);

  const list = document.getElementById("time-breakdown-list");
  list.replaceChildren();
  items.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    list.appendChild(item);
  });
  return items;
}

function renderStreak() {
  if (!streakSummary) return;
  const saved = JSON.parse(localStorage.getItem("study-buddy-progress") || "{}");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const streak = [dateKey(today), dateKey(yesterday)].includes(saved.lastCompleted) ? Number(saved.streak) || 0 : 0;
  const sessions = Number(saved.sessions) || 0;
  streakSummary.textContent = sessions
    ? `${sessions} ${sessions === 1 ? "session" : "sessions"} completed · ${streak}-day streak`
    : "No sessions completed yet. Your progress is saved on this device.";
}

function feedbackKey(data) {
  return `${data.subject.toLowerCase()}|${data.struggle.toLowerCase()}`;
}

function normalizeRecommendation(data) {
  const incomingFit = data.fit && typeof data.fit === "object" ? data.fit : {};
  const firedRule = String(data.rule_used || "");
  let label = incomingFit.label;
  let basis = incomingFit.basis;

  // Keep the page compatible with older or partially deployed API responses.
  if (!label) {
    if (firedRule === "default fallback") {
      label = "Starting point";
      basis = basis || "No specific rule matched; using a general recall plan";
    } else if (firedRule.startsWith("generic:")) {
      label = "Good match";
      basis = basis || "A general study rule matched this challenge";
    } else if (firedRule) {
      label = "Strong match";
      basis = basis || "A subject-specific rule matched";
    } else {
      label = "Good match";
      basis = basis || "Fit details are unavailable for this recommendation.";
    }
  }

  data.fit = { label, basis: basis || "Fit details are unavailable for this recommendation." };
  data.alternatives = Array.isArray(data.alternatives) ? data.alternatives : [];
}

function readRuleFeedback() {
  return JSON.parse(localStorage.getItem("study-buddy-rule-feedback") || "{}");
}

function applyPriorFeedback(data) {
  const record = readRuleFeedback()[feedbackKey(data)];
  const methodVotes = record && record.methods && record.methods[data.method];
  if (!methodVotes || methodVotes.notHelped < 2 || methodVotes.notHelped <= methodVotes.helped || !data.alternatives.length) return;

  const preferredIndex = data.alternatives.findIndex((alternative) => {
    if (!Array.isArray(alternative.steps) || !alternative.method) return false;
    const votes = record.methods[alternative.method] || { helped: 0, notHelped: 0 };
    return votes.notHelped < 2 || votes.notHelped <= votes.helped;
  });
  if (preferredIndex < 0) return;
  const previous = { method: data.method, description: "Your previous recommendation", steps: data.steps };
  const preferred = data.alternatives.splice(preferredIndex, 1)[0];
  data.method = preferred.method;
  data.reason = `You previously said this challenge’s last method did not help, so this plan tries ${preferred.method}. ${preferred.description}`;
  data.steps = preferred.steps.slice(0, data.time_label.startsWith("~15") ? 2 : 4);
  data.alternatives.unshift(previous);
  data.feedbackAdjusted = true;
  data.fit.label = "Feedback-guided";
  data.fit.basis = "A backup method was promoted after repeated negative feedback for this challenge.";
}

if (markDoneBtn) {
  markDoneBtn.addEventListener("click", () => {
    const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const today = dateKey(new Date());
    const progress = JSON.parse(localStorage.getItem("study-buddy-progress") || "{}");
    if (progress.lastCompleted !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = dateKey(yesterday);
      progress.streak = progress.lastCompleted === yesterdayKey ? (Number(progress.streak) || 0) + 1 : 1;
      progress.lastCompleted = today;
    }
    progress.sessions = (Number(progress.sessions) || 0) + 1;
    localStorage.setItem("study-buddy-progress", JSON.stringify(progress));
    renderStreak();
    markDoneBtn.disabled = true;
    markDoneBtn.textContent = "Session done";
    feedbackPanel.hidden = false;
  });
}

document.querySelectorAll(".feedback-btn").forEach((button) => {
  button.addEventListener("click", () => {
    if (!currentPlanData) return;
    const records = readRuleFeedback();
    const key = feedbackKey(currentPlanData);
    const record = records[key] || { methods: {} };
    const method = record.methods[currentPlanData.method] || { helped: 0, notHelped: 0 };
    method[button.dataset.rating === "helped" ? "helped" : "notHelped"] += 1;
    record.methods[currentPlanData.method] = method;
    records[key] = record;
    localStorage.setItem("study-buddy-rule-feedback", JSON.stringify(records));
    document.querySelectorAll(".feedback-btn").forEach((item) => { item.disabled = true; });
    document.getElementById("feedback-status").textContent = button.dataset.rating === "helped"
      ? "Thanks — we’ll keep this match in mind."
      : "Thanks — after repeated feedback, we’ll prioritize a backup method for this challenge.";
  });
});

/* ── Focus Sprint Timer ────────────────────────────────────────── */
function setupTimer(timeChoice) {
  if (!timerBox) return;
  stopTimer();
  let minutes = 25;
  if (timeChoice === "short") minutes = 15;
  else if (timeChoice === "medium") minutes = 30;
  else if (timeChoice === "long") minutes = 60;

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
    timerBtnText.textContent = timerRemainingSeconds < timerTotalSeconds ? "Resume Timer" : "Start Timer";
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

    const textToCopy = `Study Plan: ${currentPlanData.method}\n` +
      `Subject: ${currentPlanData.subject} (${currentPlanData.struggle})\n` +
      `Duration: ${currentPlanData.time_label}\n\n` +
      `Why this method:\n${document.getElementById("method-reason").textContent}\n\n` +
      `Other methods to try:\n${(currentPlanData.alternatives || []).map((item) => `${item.method}: ${item.description}`).join("\n")}\n\n` +
      `Actionable Steps:\n${formattedSteps}\n\n` +
      `Time Breakdown:\n${(currentPlanData.time_breakdown || []).map((item, idx) => `${idx + 1}. ${item}`).join("\n")}\n\n` +
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
  subjectGrid.querySelectorAll(".subject").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed", "false");
  });
  selectedSubject = "";

  // Reset struggle dropdown
  struggleSelect.innerHTML = '<option value="" disabled selected>Choose a subject first…</option>';
  struggleSelect.disabled = true;

  // Reset time to medium
  timeGrid.querySelectorAll(".time-btn").forEach((b) => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed", "false");
  });
  const defaultTimeBtn = timeGrid.querySelector('[data-value="medium"]');
  if (defaultTimeBtn) {
    defaultTimeBtn.classList.add("active");
    defaultTimeBtn.setAttribute("aria-pressed", "true");
  }
  selectedTime = "medium";

  // Clear errors and scroll up
  errorEl.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json

ROOT = Path(__file__).parent

# ---------------------------------------------------------------------------
# Expert System Knowledge Base
# ---------------------------------------------------------------------------
# Each rule maps (subject, struggle) -> recommendation with method, reason,
# and actionable steps. Subject-specific rules override generic ones.
# Time modifiers adjust recommendations for available study time.
# ---------------------------------------------------------------------------

# Which struggles are relevant per subject
SUBJECT_STRUGGLES = {
    "math": [
        "Memorizing formulas",
        "Solving word problems",
        "Understanding concepts",
        "Showing work / steps",
        "Preparing for a test",
        "Staying focused",
        "Getting started",
    ],
    "science": [
        "Memorizing terms & definitions",
        "Understanding concepts",
        "Connecting theory to experiments",
        "Interpreting graphs & data",
        "Preparing for a test",
        "Staying focused",
        "Getting started",
    ],
    "history": [
        "Remembering dates & events",
        "Understanding cause & effect",
        "Writing essays",
        "Connecting themes across eras",
        "Preparing for a test",
        "Staying focused",
        "Getting started",
    ],
    "english": [
        "Writing essays",
        "Understanding literature",
        "Grammar & sentence structure",
        "Building vocabulary",
        "Preparing for a test",
        "Staying focused",
        "Getting started",
    ],
    "programming": [
        "Understanding concepts",
        "Debugging code",
        "Solving problems",
        "Remembering syntax",
        "Building projects",
        "Preparing for a test",
        "Staying focused",
        "Getting started",
    ],
    "other": [
        "Understanding concepts",
        "Remembering facts",
        "Writing essays",
        "Preparing for a test",
        "Staying focused",
        "Getting started",
    ],
}

# (subject, struggle) -> (method, reason, steps[])
# Specific rules take priority; generic struggle rules are the fallback.
RULES = {
    # ── Math ───────────────────────────────────────────────────────────────
    ("math", "memorizing formulas"): (
        "Formula Deconstruction",
        "Breaking a formula into named parts and practicing it in context builds both understanding and recall.",
        [
            "Write the formula and label what each symbol means.",
            "Solve five practice problems without looking at the formula or solution.",
            "Check your answers and note which formulas or steps you forgot.",
            "Retry the missed problems from memory, then explain when the formula applies.",
        ],
    ),
    ("math", "solving word problems"): (
        "Translate → Plan → Solve",
        "Word problems are hard because they hide the math in language. Translating first removes that barrier.",
        [
            "Read the problem and underline the key numbers and what you're asked to find.",
            "Rewrite the problem as a math equation or expression.",
            "Solve the equation step by step.",
            "Check: does your answer make sense in the original context?",
        ],
    ),
    ("math", "understanding concepts"): (
        "Concept Mapping",
        "Math concepts connect to each other. Mapping them reveals the logic you're missing.",
        [
            "Read the definition or theorem in your textbook.",
            "In your own words, explain what it means and when you'd use it.",
            "Draw a simple diagram or example that illustrates the idea.",
            "Connect it to a concept you already understand.",
        ],
    ),
    ("math", "showing work / steps"): (
        "Narrated Solution Practice",
        "Writing out every step forces your brain to make the implicit reasoning explicit.",
        [
            "Pick a practice problem and write each step on a new line.",
            "Next to each step, write a short reason why you did it.",
            "Compare your steps to a textbook solution — did you skip anything?",
            "Redo the problem, this time filling in any missing steps.",
        ],
    ),

    # ── Science ────────────────────────────────────────────────────────────
    ("science", "memorizing terms & definitions"): (
        "Term–Example Flashcards",
        "Connecting a term to a real example helps you remember what it means and when it applies.",
        [
            "Write the term on one side of a card, the definition + a real example on the other.",
            "Quiz yourself: see the term, recall the definition and example.",
            "Sort cards into 'got it' and 'missed it' piles.",
            "Repeat the missed pile until you clear it.",
        ],
    ),
    ("science", "connecting theory to experiments"): (
        "Hypothesis–Evidence Bridge",
        "Linking what you expected to happen with what actually happened makes lab work meaningful.",
        [
            "State the theory or principle the experiment tests.",
            "Write your hypothesis — what should happen if the theory is true?",
            "Summarize your actual observations or data in one sentence.",
            "Explain whether the data supports or contradicts the hypothesis and why.",
        ],
    ),
    ("science", "interpreting graphs & data"): (
        "Graph Narration",
        "Describing a graph in plain language forces you to understand what the data is showing.",
        [
            "Read the title, axis labels, and units first.",
            "Describe the overall trend in one sentence (rising, falling, steady).",
            "Identify any outliers or turning points.",
            "Write one sentence connecting the trend to the scientific concept.",
        ],
    ),

    # ── History ────────────────────────────────────────────────────────────
    ("history", "remembering dates & events"): (
        "Timeline Story Building",
        "Putting events in sequence and linking cause/effect turns isolated dates into a story.",
        [
            "Pick 5–8 key events and arrange them on a timeline.",
            "For each event, write: what happened, what caused it, and what changed after.",
            "Cover the timeline and try to recreate it from memory.",
            "Check your version — add back anything you forgot.",
        ],
    ),
    ("history", "understanding cause & effect"): (
        "Because → Therefore Chain",
        "Tracing a chain of causes shows how events lead into each other instead of seeming random.",
        [
            "Make a timeline of five key events in this topic.",
            "For each event, write one cause and one effect.",
            "Cover your notes and quiz yourself on what caused each event and what followed.",
            "Check your answers and explain the strongest cause-and-effect link in your own words.",
        ],
    ),
    ("history", "connecting themes across eras"): (
        "Theme Comparison Table",
        "A table makes it easy to spot how the same theme (power, economy, culture) played out differently.",
        [
            "Choose a theme (e.g., democracy, trade, conflict).",
            "Create a simple table with one column per era or region.",
            "Fill in how the theme appeared in each era with a specific example.",
            "Write one sentence about what changed over time and why.",
        ],
    ),

    # ── English ────────────────────────────────────────────────────────────
    ("english", "understanding literature"): (
        "Close Reading + Annotation",
        "Marking up a passage forces you to slow down and notice the author's choices.",
        [
            "Pick a short passage (1–2 paragraphs).",
            "Read it once for the overall meaning.",
            "Read again and underline key words, imagery, or tone shifts.",
            "Write 2–3 sentences: what is the author doing here and why?",
        ],
    ),
    ("english", "grammar & sentence structure"): (
        "Error Hunt + Rewrite",
        "Finding and fixing grammar errors in context builds intuition faster than memorizing rules.",
        [
            "Take a paragraph from your own writing.",
            "Read each sentence aloud — mark anything that sounds off.",
            "Look up the specific grammar rule for each issue.",
            "Rewrite the sentences correctly and note the rule you applied.",
        ],
    ),
    ("english", "building vocabulary"): (
        "Context–Use–Review Cycle",
        "Using a new word in your own sentence cements it far better than just reading a definition.",
        [
            "Pick 5 new words from your reading.",
            "Write each word's definition in your own words.",
            "Use each word in a sentence about something in your life.",
            "Review your sentences the next day — can you recall the meanings?",
        ],
    ),

    # ── Programming ────────────────────────────────────────────────────────
    ("programming", "understanding concepts"): (
        "Code → Explain → Modify",
        "Running code and explaining what it does line-by-line builds real comprehension.",
        [
            "Find or write a small code example that uses the concept.",
            "Add a comment to every line explaining what it does.",
            "Predict what happens if you change one part, then test it.",
            "Summarize the concept in your own words based on what you learned.",
        ],
    ),
    ("programming", "debugging code"): (
        "Isolate → Reproduce → Fix",
        "Systematic debugging beats random guessing every time.",
        [
            "Read the error message carefully — note the line number and error type.",
            "Create the smallest possible code that reproduces the bug.",
            "Add print statements or use a debugger to trace variable values.",
            "Fix the issue, then explain why the bug happened to avoid it next time.",
        ],
    ),
    ("programming", "solving problems"): (
        "Pseudocode First",
        "Planning in plain language before coding prevents getting lost in syntax.",
        [
            "Read the problem and restate it in one sentence.",
            "List the inputs, outputs, and any constraints.",
            "Write step-by-step pseudocode in plain language.",
            "Translate each pseudocode step into real code one at a time.",
        ],
    ),
    ("programming", "remembering syntax"): (
        "Cheat Sheet + Drill",
        "Building your own reference and using it actively is more effective than memorizing.",
        [
            "Create a one-page cheat sheet of the syntax you keep forgetting.",
            "Write 3 small code snippets that use that syntax.",
            "Try to write them again tomorrow without looking.",
            "Update your cheat sheet with anything you missed.",
        ],
    ),
    ("programming", "building projects"): (
        "Feature Slice Approach",
        "Breaking a project into tiny vertical slices makes it less overwhelming.",
        [
            "Write a one-sentence description of the simplest possible version.",
            "List 3–5 features, ordered from essential to nice-to-have.",
            "Build only the first feature until it works end-to-end.",
            "Commit, then move to the next feature.",
        ],
    ),
}

# Generic fallback rules (keyed by struggle only)
GENERIC_RULES = {
    "understanding concepts": (
        "Read → Recall → Check",
        "Explaining from memory reveals which parts you truly understand.",
        [
            "Read a short section of your material.",
            "Close your notes and explain the idea in plain language.",
            "Check your notes and fill in any gaps you missed.",
            "Repeat with the next section.",
        ],
    ),
    "remembering facts": (
        "Active Recall Flashcards",
        "Retrieving information from memory strengthens it more than rereading.",
        [
            "Turn key facts into question-and-answer cards.",
            "Quiz yourself — don't flip until you've tried to answer.",
            "Sort into 'know' and 'don't know' piles.",
            "Repeat the 'don't know' pile until you clear it.",
        ],
    ),
    "writing essays": (
        "Thesis → Outline → Draft",
        "Planning the argument first gives your writing a clear structure.",
        [
            "Write a one-sentence thesis that states your main claim.",
            "List 2–3 supporting points with evidence for each.",
            "Outline each paragraph: claim → evidence → explanation.",
            "Draft one paragraph at a time from your outline.",
        ],
    ),
    "preparing for a test": (
        "Self-Test & Target Review",
        "A quick self-test reveals what you know so you can focus review where it matters most.",
        [
            "Try a short closed-notes practice quiz.",
            "Mark every question you weren't confident about.",
            "Review the material for those weak topics.",
            "Retake a similar quiz and compare your results.",
        ],
    ),
    "staying focused": (
        "Single-Task Sprint",
        "A single clear task with a defined endpoint makes it easier to begin and stay engaged.",
        [
            "Pick one specific task (e.g., 'solve problems 1–5').",
            "Put away your phone and close unrelated tabs.",
            "Work on that single task for 25 minutes.",
            "Take a 5-minute break, then decide your next task.",
        ],
    ),
    "getting started": (
        "Two-Minute Launch",
        "Starting with a tiny action lowers the effort it takes to begin.",
        [
            "Open your material and set a 2-minute timer.",
            "Do the smallest useful thing: read one paragraph or answer one question.",
            "When the timer ends, decide whether to continue or take a break.",
            "Most of the time, you'll keep going — starting is the hardest part.",
        ],
    ),
    "solving problems": (
        "Worked Example → Solo Attempt",
        "Studying a solution first, then trying independently, bridges the gap between knowing and doing.",
        [
            "Study a worked solution step by step.",
            "Cover the solution and attempt a similar problem.",
            "Compare your solution to the reference.",
            "Note any steps you missed and retry.",
        ],
    ),
}

# Time modifiers adjust the steps based on available time
TIME_MODIFIERS = {
    "short": {
        "label": "~15 minutes",
        "note": "With limited time, focus on the first 2 steps. Even a short session builds momentum.",
        "max_steps": 2,
    },
    "medium": {
        "label": "~30 minutes",
        "note": "You have enough time to complete the full method. Take a short break if needed.",
        "max_steps": 4,
    },
    "long": {
        "label": "60+ minutes",
        "note": "Great — you can complete the full method and repeat it with a second topic or problem set.",
        "max_steps": 4,
    },
}

ALTERNATIVE_METHODS = {
    "Spaced Repetition": {
        "description": "Review the same ideas again after a short delay to strengthen long-term recall.",
        "steps": ["Turn the key ideas into questions.", "Try to answer each question from memory.", "Check your notes and mark missed answers.", "Review missed questions tomorrow, then again in a few days."],
    },
    "Active Recall": {
        "description": "Close your notes and retrieve the answer from memory before checking it.",
        "steps": ["Choose one small topic or idea.", "Close your notes and write what you remember.", "Check your notes and correct missing details.", "Repeat with a new question, then revisit missed parts later."],
    },
    "Feynman Technique": {
        "description": "Explain the idea in plain language, then revisit any part you cannot explain.",
        "steps": ["Choose one idea you want to understand.", "Explain it aloud in plain language without notes.", "Check your notes for gaps or jargon you could not explain.", "Rewrite the explanation simply and try again."],
    },
    "Cornell Notes": {
        "description": "Turn your notes into cue questions and use them to quiz yourself later.",
        "steps": ["Divide a page into notes, cue questions, and summary areas.", "Write concise notes while studying.", "Add recall questions in the cue column and summarize the page.", "Cover the notes and answer the cue questions from memory."],
    },
    "Pomodoro": {
        "description": "Focus on one task for a timed sprint, then take a short break.",
        "steps": ["Choose one specific task and define what done means.", "Set a timer for a focused work sprint.", "Work only on that task until the timer ends.", "Take a short break and decide the next task."],
    },
}

METHOD_ALTERNATIVES = {
    "active recall": ["Spaced Repetition", "Feynman Technique"],
    "spaced repetition": ["Active Recall", "Cornell Notes"],
    "feynman technique": ["Active Recall", "Cornell Notes"],
    "cornell notes": ["Active Recall", "Spaced Repetition"],
    "pomodoro": ["Active Recall", "Spaced Repetition"],
}


def get_struggles(subject):
    """Return the list of struggles relevant to a subject."""
    return SUBJECT_STRUGGLES.get(subject.lower().strip(), SUBJECT_STRUGGLES["other"])


def recommend(subject, struggle, time_available="medium"):
    """Return a study recommendation using the expert system rules."""
    subject = subject.lower().strip()
    struggle = struggle.lower().strip()
    time_available = time_available.lower().strip()

    # 1. Try subject-specific rule
    result = RULES.get((subject, struggle))
    fired_rule = f"{subject} + {struggle}" if result else None

    # 2. Fall back to generic struggle rule
    if not result:
        result = GENERIC_RULES.get(struggle)
        fired_rule = f"generic: {struggle}" if result else None

    # 3. Ultimate fallback
    if not result:
        result = (
            "Active Recall Check",
            "A short recall attempt helps you find a clear next step instead of rereading everything.",
            [
                "Pick one small part of the topic.",
                "Try to explain it from memory.",
                "Check your notes and fill in the gaps.",
                "Repeat with the next part.",
            ],
        )
        fired_rule = "default fallback"

    method, reason, steps = result

    # Apply time modifier
    time_info = TIME_MODIFIERS.get(time_available, TIME_MODIFIERS["medium"])
    adjusted_steps = steps[: time_info["max_steps"]]
    alternatives = [
        {"method": name, **ALTERNATIVE_METHODS[name]}
        for name in METHOD_ALTERNATIVES.get(method.lower(), ["Active Recall", "Spaced Repetition"])
        if not method.lower().startswith(name.lower())
    ][:2]
    if fired_rule == "default fallback":
        fit = {"label": "Starting point", "basis": "No specific rule matched; using a general recall plan"}
    elif fired_rule.startswith("generic:"):
        fit = {"label": "Good match", "basis": "A general study rule matched this challenge"}
    else:
        fit = {"label": "Strong match", "basis": "A subject-specific rule matched"}

    return {
        "method": method,
        "reason": reason,
        "alternatives": alternatives,
        "steps": adjusted_steps,
        "time_note": time_info["note"],
        "time_label": time_info["label"],
        "rule_used": fired_rule,
        "fit": fit,
        "subject": subject.title(),
        "struggle": struggle.title(),
    }


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path == "/struggles":
            self._handle_struggles()
        elif self.path == "/recommend":
            self._handle_recommend()
        else:
            self.send_error(404)

    def _read_json(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length <= 0:
                raise ValueError
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError
            return data
        except (json.JSONDecodeError, ValueError, UnicodeDecodeError):
            return None

    def _send_json(self, obj, status=200):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_struggles(self):
        data = self._read_json()
        if data is None:
            self.send_error(400, "Please send valid JSON")
            return
        subject = str(data.get("subject", "")).strip().lower()
        if not subject:
            self.send_error(400, "Choose a subject")
            return
        self._send_json({"struggles": get_struggles(subject)})

    def _handle_recommend(self):
        data = self._read_json()
        if data is None:
            self.send_error(400, "Please send valid JSON")
            return
        subject = str(data.get("subject", "")).strip().lower()
        struggle = str(data.get("struggle", "")).strip().lower()
        time_available = str(data.get("time", "medium")).strip().lower()
        if not subject or not struggle:
            self.send_error(400, "Choose a subject and study challenge")
            return
        self._send_json(recommend(subject, struggle, time_available))


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8000), AppHandler)
    print("Study Buddy is running at http://127.0.0.1:8000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()

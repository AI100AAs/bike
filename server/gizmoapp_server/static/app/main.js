import { requestJson } from "./api.js";

const guides = {
  "rear-wheel": { tag: "REAR WHEEL", title: "Fix a flat tire", description: "Get back on the road with a simple tube repair.", keywords: "rear wheel flat tire puncture tube", icon: "◎", time: "20 min", difficulty: "Beginner", tools: "Tire levers, pump", tip: "Never use a screwdriver to remove a tire. It can pinch the tube and damage the rim.", steps: [["Find the puncture", "Remove the wheel and inflate the tube to listen and feel for escaping air."], ["Remove and inspect", "Use tire levers to lift one side of the tire off the rim. Check the tire for glass or thorns."], ["Patch and refit", "Roughen the spot, apply the patch, then refit the tube and inflate gradually."]] },
  "front-wheel": { tag: "FRONT WHEEL", title: "Check wheel safety", description: "Find wobble, loose axles, and tire problems before they become a ride-ending issue.", keywords: "front wheel tire wobble loose axle", icon: "◎", time: "10 min", difficulty: "Beginner", tools: "Pump, hex key", tip: "Lift the wheel and spin it. A small, even gap at the brake is a quick way to spot a wobble.", steps: [["Check tire pressure", "Press the tire and compare it with the pressure range printed on the sidewall."], ["Test for play", "Hold the fork and rock the wheel side to side. Tighten the axle if you feel a knock."], ["Spin and inspect", "Watch the rim pass the brake. Look for side-to-side wobble, bulges, or damaged spokes."]] },
  brakes: { tag: "BRAKES", title: "Tune your brakes", description: "Get smooth, confident stopping power before your next commute.", icon: "⊙", time: "15 min", difficulty: "Beginner", tools: "5mm hex key, rag", tip: "Test your brakes at walking speed first. A lever should never touch the handlebar.", steps: [["Clean the brake track", "Wipe the rim or rotor with a clean, dry rag to remove grit and oil."], ["Check pad alignment", "Make sure pads meet the rim squarely and sit above the tire, not against it."], ["Adjust the cable", "Turn the barrel adjuster until the lever feels firm, then spin the wheel to check for rub."]] },
  chain: { tag: "CHAIN", title: "Clean & lube your chain", description: "A quieter, happier drivetrain starts with five minutes of care.", keywords: "chain slipping squeak lube clean", icon: "∞", time: "10 min", difficulty: "Easy", tools: "Degreaser, chain lube", tip: "Lube the inside of the chain, then wipe off the excess. A wet chain attracts grit.", steps: [["Brush away grit", "Backpedal slowly while brushing the chain with a dry rag to loosen surface dirt."], ["Degrease", "Apply degreaser to a rag, then backpedal the chain through it until it runs clean."], ["Add fresh lube", "Place one drop on each roller, backpedal a few turns, and wipe away the extra."]] },
  gears: { tag: "GEARS", title: "Set up shifting", description: "Quiet, crisp shifts make every hill feel a little smaller.", icon: "✣", time: "25 min", difficulty: "Intermediate", tools: "4mm hex key, screwdriver", tip: "Make one adjustment at a time and test-shift after each change.", steps: [["Inspect the cable", "Shift through the gears and look for fraying, rust, or a housing that has slipped out."], ["Set the limit screws", "Use small turns to keep the chain centered over the smallest and largest cogs."], ["Fine-tune indexing", "Use the barrel adjuster in quarter turns until every shift lands cleanly."]] },
  saddle: { tag: "SADDLE", title: "Set your saddle", description: "A few small adjustments can make a daily commute much more comfortable.", keywords: "saddle seat uncomfortable height comfort", icon: "⌒", time: "10 min", difficulty: "Easy", tools: "4mm or 5mm hex key", tip: "Your knee should keep a slight bend when the pedal is at its lowest point.", steps: [["Set the height", "Sit on the bike and adjust until your knee has a slight bend with your heel on the pedal."], ["Level the saddle", "Use the top of the saddle as a guide and keep it roughly parallel with the ground."], ["Tighten and test", "Tighten the clamp evenly, then ride for a few minutes and make one change at a time."]] },
  handlebar: { tag: "HANDLEBAR", title: "Align your handlebar", description: "Keep steering predictable and your hands comfortable on every ride.", keywords: "handlebar bars steering alignment grips", icon: "⌁", time: "10 min", difficulty: "Easy", tools: "4mm or 5mm hex key", tip: "Stand in front of the bike and check that the bar is centered with the front wheel.", steps: [["Check alignment", "Point the front wheel straight ahead and compare the handlebar with the front axle."], ["Loosen carefully", "Loosen the stem faceplate or clamp just enough to reposition the bar."], ["Center and tighten", "Center the controls, tighten bolts in a cross pattern, and test the steering."]] },
  pedals: { tag: "PEDALS", title: "Check your pedals", description: "Keep the contact points secure and your crank turning smoothly.", keywords: "pedals crank loose clicking", icon: "⊛", time: "10 min", difficulty: "Beginner", tools: "15mm pedal wrench", tip: "Pedals are side-specific. The left pedal tightens counter-clockwise.", steps: [["Check for looseness", "Hold each pedal and rock it. Also check whether the crank arm moves independently."], ["Inspect the threads", "Remove the pedal if needed and look for crossed or damaged threads."], ["Tighten securely", "Grease clean threads, install the correct side, and tighten firmly without overdoing it."]] },
};
const bookmarks = new Set();
let activeComponent = null;
let activeStep = null;
let coachImageUrl = "";
let coachHistory = [];

function bootstrap() {
  const runtime = window.GizmoAppRuntime;
  if (!runtime) {
    throw new Error("The shared app runtime did not load.");
  }
  runtime.readConfig();
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-mode");
    themeToggle.textContent = isDark ? "☀" : "☾";
    themeToggle.title = isDark ? "Use light mode" : "Use dark mode";
    themeToggle.setAttribute("aria-label", themeToggle.title);
  });
  document.querySelectorAll("[data-component]").forEach((element) => {
    element.addEventListener("click", () => selectComponent(element.dataset.component));
    element.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectComponent(element.dataset.component); } });
  });
  const search = document.getElementById("component-search-input");
  search.addEventListener("input", () => renderComponentResults(search.value));
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== search && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) { event.preventDefault(); search.focus(); }
  });
  document.getElementById("coach-form").addEventListener("submit", askMechanic);
  document.getElementById("coach-image").addEventListener("change", previewCoachImage);
  document.getElementById("coach-image-clear").addEventListener("click", clearCoachImage);
  document.getElementById("bookmark-guide").addEventListener("click", () => toggleBookmark(`guide:${activeComponent}`));
  document.getElementById("print-guide").addEventListener("click", () => window.print());
  document.querySelectorAll(".ride-check-item input").forEach((input) => input.addEventListener("change", renderRideCheck));
  renderGuide();
  renderComponentResults("");
  renderBookmarks();
  renderRideCheck();
  runtime.markReady();
}

function renderRideCheck() {
  const checks = [...document.querySelectorAll(".ride-check-item input")];
  const complete = checks.filter((check) => check.checked).length;
  document.getElementById("ride-check-count").textContent = `${complete} / ${checks.length}`;
  document.getElementById("ride-check-progress").style.width = `${(complete / checks.length) * 100}%`;
  document.getElementById("ride-check-note").textContent = complete === checks.length ? "You are ready to roll." : "Small checks make confident rides.";
}

function selectComponent(component) {
  if (!guides[component]) return;
  activeComponent = component;
  activeStep = null;
  coachHistory = [];
  document.getElementById("coach-history").innerHTML = '<p class="coach-answer coach-empty" id="coach-answer">Ask a question about this component and get a focused tip.</p>';
  document.body.classList.remove("guide-unselected");
  document.querySelector(".guide-column").hidden = false;
  renderGuide();
  document.querySelector(".guide-card")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function renderComponentResults(query) {
  const results = document.getElementById("component-results");
  const term = query.trim().toLowerCase();
  const matches = Object.entries(guides).filter(([key, guide]) => !term || `${key} ${guide.tag} ${guide.title} ${guide.keywords || ""}`.toLowerCase().includes(term)).slice(0, 5);
  results.replaceChildren(...matches.map(([key, guide]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "component-result";
    button.dataset.component = key;
    button.innerHTML = `<span class="result-icon">${guide.icon}</span><span><b>${guide.tag}</b><small>${guide.title}</small></span><span class="result-arrow">↗</span>`;
    button.addEventListener("click", () => selectComponent(key));
    return button;
  }));
  results.hidden = !term;
  if (term && !matches.length) results.textContent = "No matching component yet. Try “brakes”, “tire”, or “chain”.";
}
function toggleBookmark(key) {
  if (bookmarks.has(key)) bookmarks.delete(key);
  else bookmarks.add(key);
  renderGuide();
  renderBookmarks();
}
function renderBookmarks() {
  const list = document.getElementById("bookmarks-list");
  const entries = [...bookmarks];
  list.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "bookmarks-empty";
    empty.textContent = "Bookmark a guide or step to find it here.";
    list.append(empty);
  } else {
    entries.forEach((key) => {
      const [type, component, index] = key.split(":");
      const guide = guides[component];
      if (!guide) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bookmark-item";
      const label = type === "step" ? `Step ${Number(index) + 1}: ${guide.steps[index][0]}` : guide.title;
      button.innerHTML = `<span>★</span><span><b>${guide.tag}</b><small>${label}</small></span><span>↗</span>`;
      button.addEventListener("click", () => {
        selectComponent(component);
        if (type === "step") focusStepHelp(Number(index), guide.steps[index][0], guide.steps[index][1]);
      });
      list.append(button);
    });
  }
  document.getElementById("bookmarks-count").textContent = `${entries.length} saved`;
}
async function askMechanic(event) {
  event.preventDefault();
  const questionInput = document.getElementById("coach-question");
  const imageInput = document.getElementById("coach-image");
  const question = questionInput.value.trim();
  const button = document.getElementById("coach-submit");
  if (!question) return;
  button.disabled = true;
  const pending = appendCoachMessage("mechanic", "Thinking through it...");
  try {
    const { apiBase } = window.GizmoAppRuntime.readConfig();
    const body = new FormData();
   body.append("component", activeComponent);
   body.append("question", question);
   body.append("history", JSON.stringify(coachHistory));
   if (activeStep) {
     body.append("step_title", activeStep.title);
     body.append("step_instruction", activeStep.copy);
   }
    if (imageInput.files[0]) body.append("image", imageInput.files[0]);
    const result = await requestJson(`${apiBase}/coach`, { method: "POST", body, timeoutMs: 60000 });
    pending.remove();
    coachHistory.push({ role: "user", content: question }, { role: "assistant", content: result.answer });
    appendCoachMessage("user", question);
    appendCoachMessage("mechanic", result.answer);
    questionInput.value = "";
    clearCoachImage();
  } catch (error) {
    pending.textContent = error.message || "The mechanic is unavailable right now.";
  } finally {
    button.disabled = false;
  }
}

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(new RegExp(String.fromCharCode(34), "g"), "&quot;").replace(new RegExp(String.fromCharCode(39), "g"), "&#39;");
}

function renderMarkdown(markdown) {
  const lines = escapeHtml(markdown).split("\n");
  const output = [];
  let listType = null;
  const closeList = () => { if (listType) { output.push(`</${listType}>`); listType = null; } };
  const inline = (line) => line.replace(new RegExp("\\x60([^\\x60]+)\\x60", "g"), "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/_([^_]+)_/g, "<em>$1</em>");
  lines.forEach((line) => {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^[-*]\s+(.+)$/);
    const numbered = line.match(/^\d+[.]?\s+(.+)$/);
    if (heading) { closeList(); output.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`); }
    else if (bullet || numbered) { const nextType = bullet ? "ul" : "ol"; if (listType !== nextType) { closeList(); output.push(`<${nextType}>`); listType = nextType; } output.push(`<li>${inline((bullet || numbered)[1])}</li>`); }
    else if (line.trim()) { closeList(); output.push(`<p>${inline(line)}</p>`); }
    else closeList();
  });
  closeList();
  return output.join("");
}

function appendCoachMessage(role, content) {
  document.querySelector(".coach-empty")?.remove();
  const message = document.createElement("div");
  message.className = `coach-message coach-message-${role}`;
  if (role === "mechanic") message.innerHTML = renderMarkdown(content);
  else message.textContent = content;
  document.getElementById("coach-history").append(message);
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
  return message;
}

function previewCoachImage(event) {
  const file = event.target.files[0];
  const name = document.getElementById("coach-image-name");
  const preview = document.getElementById("coach-image-preview");
  const clear = document.getElementById("coach-image-clear");
  if (!file) return clearCoachImage();
  if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
    clearCoachImage();
    name.textContent = "Choose a JPEG, PNG, WebP, or GIF under 8 MB";
    return;
  }
  if (coachImageUrl) URL.revokeObjectURL(coachImageUrl);
  name.textContent = file.name;
  coachImageUrl = URL.createObjectURL(file);
  preview.src = coachImageUrl;
  preview.hidden = false;
  clear.hidden = false;
}

function clearCoachImage() {
  if (coachImageUrl) URL.revokeObjectURL(coachImageUrl);
  coachImageUrl = "";
  document.getElementById("coach-image").value = "";
  document.getElementById("coach-image-name").textContent = "Optional: show the mechanic what you see";
  const preview = document.getElementById("coach-image-preview");
  preview.removeAttribute("src");
  preview.hidden = true;
  document.getElementById("coach-image-clear").hidden = true;
}

function renderGuide() {
  const guide = guides[activeComponent];
  document.querySelectorAll(".component-hotspot").forEach((node) => node.classList.toggle("active", node.dataset.component === activeComponent));
  if (!guide) return;
   document.getElementById("guide-count").textContent = `${Object.keys(guides).indexOf(activeComponent) + 1} / ${Object.keys(guides).length}`;
  ["tag", "title", "description", "time", "difficulty", "tools", "tip"].forEach((key) => document.getElementById(`guide-${key}`).textContent = guide[key]);
  document.getElementById("guide-icon").textContent = guide.icon;
  const guideBookmark = document.getElementById("bookmark-guide");
  const guideIsBookmarked = bookmarks.has(`guide:${activeComponent}`);
  guideBookmark.textContent = guideIsBookmarked ? "★" : "☆";
  guideBookmark.classList.toggle("is-bookmarked", guideIsBookmarked);
  guideBookmark.title = guideIsBookmarked ? "Remove guide bookmark" : "Bookmark this guide";
  guideBookmark.setAttribute("aria-label", guideBookmark.title);
  const steps = document.getElementById("steps-list");
  steps.replaceChildren(...guide.steps.map(([title, copy], index) => {
    const key = `${activeComponent}-${index}`;
    const row = document.createElement("div");
     row.className = "step";
      const bookmarkKey = `step:${activeComponent}:${index}`;
      row.innerHTML = `<div class="step-check"><span class="step-number">${String(index + 1).padStart(2, "0")}</span><span class="step-copy"><b>${title}</b><small>${copy}</small></span></div><button class="step-help" type="button">Ask about this</button><button class="step-bookmark${bookmarks.has(bookmarkKey) ? " is-bookmarked" : ""}" type="button" aria-label="${bookmarks.has(bookmarkKey) ? "Remove" : "Bookmark"} step ${index + 1}" title="${bookmarks.has(bookmarkKey) ? "Remove bookmark" : "Bookmark step"}">${bookmarks.has(bookmarkKey) ? "★" : "☆"}</button>`;
     row.querySelector(".step-help").addEventListener("click", () => focusStepHelp(index, title, copy));
     row.querySelector(".step-bookmark").addEventListener("click", () => toggleBookmark(bookmarkKey));
     return row;
  }));
   if (!activeStep) {
    document.getElementById("coach-context").textContent = "About this repair";
    document.getElementById("coach-question").placeholder = "What should I check first?";
  }
  }

function focusStepHelp(index, title, copy) {
  activeStep = { index, title, copy };
  coachHistory = [];
  document.getElementById("coach-history").innerHTML = '<p class="coach-answer coach-empty" id="coach-answer">Ask a question about this step and get a focused tip.</p>';
  document.getElementById("coach-context").textContent = `Step ${index + 1}: ${title}`;
  const question = document.getElementById("coach-question");
  question.placeholder = `What is confusing about "${title}"?`;
  question.focus({ preventScroll: true });
  document.getElementById("coach-form")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}


try {
  bootstrap();
} catch (error) {
  window.GizmoAppRuntime?.showFatalError(error);
}

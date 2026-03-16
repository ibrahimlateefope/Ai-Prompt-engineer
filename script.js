"use strict";

const KEY_PROVIDER = "ape_provider";
const KEY_GROQ_KEY = "ape_groq_key";
const DEFAULT_GROQ_KEY =
    "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";
const KEY_GEMINI_KEY = "ape_gemini_key";
const KEY_OPENAI_KEY = "ape_openai_key";
const KEY_ANTHROPIC_KEY = "ape_anthropic_key";
const KEY_THEME = "ape_theme";
const KEY_SESSIONS = "ape_sessions";
const KEY_ACTIVE = "ape_active_session";

const dom = {
    html: document.documentElement,
    apiModal: document.getElementById("api-modal"),
    saveApiKey: document.getElementById("save-api-key"),
    groqKeyInput: document.getElementById("groq-key-input"),
    geminiKeyInput: document.getElementById("gemini-key-input"),
    openaiKeyInput: document.getElementById("openai-key-input"),
    anthropicKeyInput: document.getElementById("anthropic-key-input"),
    providerTabs: document.querySelectorAll(".provider-tab"),
    providerPanels: {
        groq: document.getElementById("panel-groq"),
        gemini: document.getElementById("panel-gemini"),
        openai: document.getElementById("panel-openai"),
        anthropic: document.getElementById("panel-anthropic")
    },
    toggleVis: document.querySelectorAll(".toggle-vis"),
    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),
    sidebarToggle: document.getElementById("sidebar-toggle"),
    newChatBtn: document.getElementById("new-chat-btn"),
    chatHistoryList: document.getElementById("chat-history-list"),
    topbarTitle: document.getElementById("topbar-title"),
    clearBtn: document.getElementById("clear-btn"),
    themeBtn: document.getElementById("theme-btn"),
    themeIcon: document.getElementById("theme-icon"),
    themeLabel: document.getElementById("theme-label"),
    settingsBtn: document.getElementById("settings-btn"),
    chatArea: document.getElementById("chat-area"),
    welcomeScreen: document.getElementById("welcome-screen"),
    messagesContainer: document.getElementById("messages-container"),
    userInput: document.getElementById("user-input"),
    sendBtn: document.getElementById("send-btn"),
    suggestionChips: document.querySelectorAll(".suggestion-chip"),
    providerDot: document.getElementById("provider-dot"),
    providerLabel: document.getElementById("provider-label")
};

const PROVIDER_INFO = {
    groq: { name: "Groq — Llama 3.3 70B", dotClass: "groq" },
    gemini: { name: "Gemini 2.0 Flash", dotClass: "gemini" },
    openai: { name: "GPT-4o", dotClass: "openai" },
    anthropic: { name: "Claude Sonnet 4.5", dotClass: "anthropic" }
};

let state = {
    provider: "groq",
    keys: { groq: "", gemini: "", openai: "", anthropic: "" },
    modalTab: "groq",
    theme: "light",
    sessions: [],
    activeSession: null,
    isLoading: false
};

function init() {
    loadState();
    applyTheme(state.theme);
    renderSidebarHistory();
    updateProviderBadge();
    loadOrCreateSession();
    bindEvents();
    if (
        !state.keys.groq &&
        !state.keys.gemini &&
        !state.keys.openai &&
        !state.keys.anthropic
    ) {
        openModal();
    }
}

function loadState() {
    state.provider = localStorage.getItem(KEY_PROVIDER) || "groq";
    state.keys.groq = localStorage.getItem(KEY_GROQ_KEY) || "";
    state.keys.gemini = localStorage.getItem(KEY_GEMINI_KEY) || "";
    state.keys.openai = localStorage.getItem(KEY_OPENAI_KEY) || "";
    state.keys.anthropic = localStorage.getItem(KEY_ANTHROPIC_KEY) || "";
    const storedTheme = localStorage.getItem(KEY_THEME);
    state.theme =
        storedTheme ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light");
    try {
        state.sessions = JSON.parse(localStorage.getItem(KEY_SESSIONS)) || [];
    } catch {
        state.sessions = [];
    }
    state.activeSession = localStorage.getItem(KEY_ACTIVE) || null;
}

function saveProviderState() {
    localStorage.setItem(KEY_PROVIDER, state.provider);
    localStorage.setItem(KEY_GROQ_KEY, state.keys.groq);
    localStorage.setItem(KEY_GEMINI_KEY, state.keys.gemini);
    localStorage.setItem(KEY_OPENAI_KEY, state.keys.openai);
    localStorage.setItem(KEY_ANTHROPIC_KEY, state.keys.anthropic);
}

function saveSessionsToStorage() {
    localStorage.setItem(KEY_SESSIONS, JSON.stringify(state.sessions));
    localStorage.setItem(KEY_ACTIVE, state.activeSession || "");
}

function updateProviderBadge() {
    const p = PROVIDER_INFO[state.provider];
    dom.providerLabel.textContent = p.name;
    dom.providerDot.className = `provider-dot ${p.dotClass}`;
}

function createSession() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const s = { id, title: "New Chat", messages: [], createdAt: Date.now() };
    state.sessions.unshift(s);
    state.activeSession = id;
    saveSessionsToStorage();
    renderSidebarHistory();
    return s;
}
function getActiveSession() {
    return state.sessions.find(s => s.id === state.activeSession) || null;
}
function loadOrCreateSession() {
    if (!getActiveSession()) createSession();
    renderMessages();
}
function switchSession(id) {
    state.activeSession = id;
    saveSessionsToStorage();
    renderSidebarHistory();
    renderMessages();
    closeSidebarMobile();
}
function startNewChat() {
    createSession();
    renderMessages();
    dom.userInput.focus();
    closeSidebarMobile();
}

const MOON = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
const SUN = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
function applyTheme(theme) {
    state.theme = theme;
    dom.html.setAttribute("data-theme", theme);
    localStorage.setItem(KEY_THEME, theme);
    dom.themeIcon.innerHTML = theme === "dark" ? SUN : MOON;
    dom.themeLabel.textContent = theme === "dark" ? "Dark mode" : "Light mode";
}

function renderSidebarHistory() {
    dom.chatHistoryList.innerHTML = "";
    if (!state.sessions.length) {
        dom.chatHistoryList.innerHTML =
            '<p style="padding:8px 14px;font-size:12px;color:var(--text-tertiary)">No chats yet</p>';
        return;
    }
    state.sessions.forEach(s => {
        const btn = document.createElement("button");
        btn.className =
            "chat-history-item" +
            (s.id === state.activeSession ? " active" : "");
        btn.textContent = s.title;
        btn.addEventListener("click", () => switchSession(s.id));
        dom.chatHistoryList.appendChild(btn);
    });
}
function toggleSidebar() {
    dom.sidebar.classList.toggle("open");
    dom.sidebarOverlay.classList.toggle("open");
}
function closeSidebarMobile() {
    dom.sidebar.classList.remove("open");
    dom.sidebarOverlay.classList.remove("open");
}

function renderMessages() {
    const session = getActiveSession();
    dom.messagesContainer.innerHTML = "";
    if (!session || !session.messages.length) {
        dom.welcomeScreen.classList.remove("hidden");
        dom.messagesContainer.classList.add("hidden");
        dom.topbarTitle.textContent = "AI Prompt Engineer";
        return;
    }
    dom.welcomeScreen.classList.add("hidden");
    dom.messagesContainer.classList.remove("hidden");
    dom.topbarTitle.textContent = session.title;
    session.messages.forEach(m => appendMessageToDOM(m, false));
    scrollToBottom();
}
function appendMessageToDOM(msg, animate = true) {
  const row = document.createElement('div');
  row.className = `message-row ${msg.role}`;
  if (!animate) row.style.animation = 'none';

  if (msg.role === 'user') {
    row.innerHTML = `<div class="user-bubble">${escapeHTML(msg.content)}</div>`;
  } else {
    row.innerHTML = `
      <div class="ai-avatar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div class="message-content ai-text">${msg.html || escapeHTML(msg.content)}</div>`;
  }

  dom.messagesContainer.appendChild(row);

  if (msg.role === 'ai' && animate && msg.html) {
    const promptEl = row.querySelector('.prompt-text');
    if (promptEl && msg.content) {
      const original = promptEl.textContent;
      typeText(promptEl, original, 12).then(() => scrollToBottom());
    }
  }
}

function showThinking() {
    const row = document.createElement("div");
    row.className = "thinking-row";
    row.id = "thinking-indicator";
    row.innerHTML = `
    <div class="ai-avatar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <div class="thinking-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
    dom.messagesContainer.appendChild(row);
    scrollToBottom();
}
function hideThinking() {
    const el = document.getElementById("thinking-indicator");
    if (el) el.remove();
}

const KEYWORDS = {
    coding: [
        "code",
        "program",
        "debug",
        "function",
        "api",
        "script",
        "bug",
        "javascript",
        "python",
        "java",
        "typescript",
        "react",
        "css",
        "html",
        "database",
        "sql",
        "git",
        "algorithm",
        "refactor",
        "compile",
        "backend",
        "frontend",
        "async"
    ],
    math: [
        "math",
        "calculate",
        "equation",
        "algebra",
        "calculus",
        "geometry",
        "statistics",
        "probability",
        "integral",
        "derivative",
        "formula",
        "solve",
        "proof",
        "theorem",
        "matrix",
        "arithmetic",
        "percentage"
    ],
    reasoning: [
        "reason",
        "analyze",
        "logic",
        "argument",
        "debate",
        "philosophy",
        "evaluate",
        "assess",
        "critique",
        "compare",
        "contrast",
        "decision",
        "ethics",
        "moral",
        "strategy",
        "hypothesis"
    ],
    creative: [
        "write",
        "story",
        "poem",
        "essay",
        "blog",
        "fiction",
        "narrative",
        "character",
        "plot",
        "creative",
        "screenplay",
        "lyrics",
        "describe",
        "imagine",
        "invent",
        "brainstorm",
        "novel",
        "haiku",
        "sonnet",
        "slogan"
    ]
};
function classifyTask(text) {
    const t = text.toLowerCase();
    const scores = Object.entries(KEYWORDS).map(([cat, kws]) => [
        cat,
        kws.filter(k => t.includes(k)).length
    ]);
    const best = scores.sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : "general";
}

const MODELS = {
    coding: [
        {
            name: "Claude Opus 4",
            company: "Anthropic",
            desc: "Tops SWE-Bench with deep multi-step code reasoning",
            stats: ["SWE-Bench: 72.5%", "HumanEval: 96%", "1M ctx"],
            price: "$15 / $75",
            unit: "per M tokens in/out"
        },
        {
            name: "GPT-4o",
            company: "OpenAI",
            desc: "Versatile multimodal model, strong code generation",
            stats: ["SWE-Bench: 48.9%", "HumanEval: 90.2%", "128K ctx"],
            price: "$2.50 / $10",
            unit: "per M tokens in/out"
        },
        {
            name: "Gemini 2.5 Pro",
            company: "Google",
            desc: "Long-context leader with excellent code comprehension",
            stats: ["HumanEval: 87%", "SWE-Bench: 63.2%", "1M ctx"],
            price: "$1.25 / $10",
            unit: "per M tokens in/out"
        }
    ],
    math: [
        {
            name: "o3",
            company: "OpenAI",
            desc: "Record-breaking on AIME & competition math",
            stats: ["AIME 2024: 96.7%", "MATH: 97.8%", "GPQA: 87.7%"],
            price: "$10 / $40",
            unit: "per M tokens in/out"
        },
        {
            name: "Claude Opus 4",
            company: "Anthropic",
            desc: "Rigorous step-by-step math with verification",
            stats: ["MATH: 89.4%", "GPQA: 74.9%", "1M ctx"],
            price: "$15 / $75",
            unit: "per M tokens in/out"
        },
        {
            name: "Gemini 2.5 Pro",
            company: "Google",
            desc: "Strong quantitative model with multimodal math support",
            stats: ["MATH: 91.2%", "MMMU: 81.7%", "1M ctx"],
            price: "$1.25 / $10",
            unit: "per M tokens in/out"
        }
    ],
    reasoning: [
        {
            name: "o3",
            company: "OpenAI",
            desc: "Deep chain-of-thought, top GPQA & logic benchmarks",
            stats: ["GPQA: 87.7%", "ARC-AGI: 87.5%", "200K ctx"],
            price: "$10 / $40",
            unit: "per M tokens in/out"
        },
        {
            name: "Claude Opus 4",
            company: "Anthropic",
            desc: "Extended thinking with transparent reasoning chains",
            stats: ["GPQA: 74.9%", "MMLU: 89.7%", "1M ctx"],
            price: "$15 / $75",
            unit: "per M tokens in/out"
        },
        {
            name: "DeepSeek R1",
            company: "DeepSeek",
            desc: "Open-source reasoning champion at very low cost",
            stats: ["AIME: 79.8%", "MATH: 97.3%", "64K ctx"],
            price: "$0.55 / $2.19",
            unit: "per M tokens in/out"
        }
    ],
    creative: [
        {
            name: "Claude Sonnet 4.5",
            company: "Anthropic",
            desc: "Nuanced prose with superb narrative & tone control",
            stats: ["EQ-Bench: 88.6%", "Creative A/B: #1", "200K ctx"],
            price: "$3 / $15",
            unit: "per M tokens in/out"
        },
        {
            name: "GPT-4o",
            company: "OpenAI",
            desc: "Versatile creative voice, strong in varied formats",
            stats: ["MMLU: 88.7%", "Multilingual: A", "128K ctx"],
            price: "$2.50 / $10",
            unit: "per M tokens in/out"
        },
        {
            name: "Gemini 2.0 Flash",
            company: "Google",
            desc: "Fast, cost-effective creative generation",
            stats: ["MMLU: 81.9%", "Multimodal: A", "1M ctx"],
            price: "$0.075 / $0.30",
            unit: "per M tokens in/out"
        }
    ],
    general: [
        {
            name: "Groq — Llama 3.3 70B",
            company: "Meta / Groq",
            desc: "Free, lightning-fast — ideal starting point for most tasks",
            stats: ["MMLU: 86%", "Free tier: 14k req/day", "128K ctx"],
            price: "Free",
            unit: "free tier available"
        },
        {
            name: "Claude Sonnet 4.5",
            company: "Anthropic",
            desc: "Excellent everyday intelligence with long context",
            stats: ["MMLU: 88.3%", "GPQA: 65%", "200K ctx"],
            price: "$3 / $15",
            unit: "per M tokens in/out"
        },
        {
            name: "GPT-4o mini",
            company: "OpenAI",
            desc: "Lightweight and affordable for most everyday tasks",
            stats: ["MMLU: 82%", "HumanEval: 87.2%", "128K ctx"],
            price: "$0.15 / $0.60",
            unit: "per M tokens in/out"
        }
    ]
};

const SYSTEM_PROMPT = `You are an expert AI Prompt Engineer. Transform any task description into a highly optimized, structured prompt for large language models.

Respond ONLY with valid JSON — no markdown fences, no preamble, no extra text:
{
  "optimized_prompt": "Full detailed prompt here (150-350 words)...",
  "instructions": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "tips": "One sentence of extra advice."
}

Rules for optimized_prompt:
- Assign a clear expert role (e.g. "You are an expert in...")
- Include context, constraints, and desired output format
- Specify length, tone, and style requirements
- Make it ready to paste directly into any AI model`;

async function callAPI(userTask, category) {
    const provider = state.provider;
    const key =
        state.keys[provider] || (provider === "groq" ? DEFAULT_GROQ_KEY : null);
    const userMsg = `Task category: "${category}"\n\nUser task: ${userTask}\n\nGenerate the JSON now.`;

    if (!key)
        throw new Error(
            `No API key set for ${PROVIDER_INFO[provider].name}. Click "API Settings" to add one.`
        );

    if (provider === "groq") {
        const res = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    max_tokens: 1500,
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: userMsg }
                    ]
                })
            }
        );
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(
                e?.error?.message || `Groq error: HTTP ${res.status}`
            );
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
    }

    if (provider === "gemini") {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: `${SYSTEM_PROMPT}\n\n${userMsg}` }]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 1500,
                        temperature: 0.7
                    }
                })
            }
        );
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(
                e?.error?.message || `Gemini error: HTTP ${res.status}`
            );
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${key}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                max_tokens: 1500,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMsg }
                ]
            })
        });
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(
                e?.error?.message || `OpenAI error: HTTP ${res.status}`
            );
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
    }

    if (provider === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "anthropic-dangerous-direct-browser-access": "true"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-5",
                max_tokens: 1500,
                system: SYSTEM_PROMPT,
                messages: [{ role: "user", content: userMsg }]
            })
        });
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(
                e?.error?.message || `Anthropic error: HTTP ${res.status}`
            );
        }
        const data = await res.json();
        return data.content?.[0]?.text || "";
    }

    throw new Error("Unknown provider");
}

function buildResponseHTML(parsed, category) {
    const catLabel = category.charAt(0).toUpperCase() + category.slice(1);
    const catEmoji =
        {
            coding: "💻",
            math: "📐",
            reasoning: "🧠",
            creative: "✍️",
            general: "💬"
        }[category] || "💬";
    const models = MODELS[category] || MODELS.general;
    const promptId = "prompt-" + Date.now();

    const promptSection = `
    <div class="response-section">
      <div class="section-label">
        <div class="section-label-dot"></div>Generated Prompt
        <span class="category-badge cat-${category}">${catEmoji} ${catLabel}</span>
      </div>
      <div class="prompt-box">
        <div class="prompt-box-header">
          <span>Optimized Prompt</span>
          <button class="copy-btn" data-target="${promptId}" onclick="copyPrompt(this)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>Copy
          </button>
        </div>
        <div class="prompt-text" id="${promptId}">${escapeHTML(parsed.optimized_prompt)}</div>
      </div>
    </div>`;

    const instrItems = (parsed.instructions || [])
        .map(
            (s, i) =>
                `<li><span class="instr-num">${i + 1}</span><span>${escapeHTML(s)}</span></li>`
        )
        .join("");
    const instrSection = `
    <div class="response-section">
      <div class="section-label"><div class="section-label-dot"></div>How to Use This Prompt</div>
      <ul class="instructions-list">${instrItems}</ul>
      ${parsed.tips ? `<p style="margin-top:10px;font-size:13px;color:var(--text-secondary);font-style:italic;padding-left:30px">💡 ${escapeHTML(parsed.tips)}</p>` : ""}
    </div>`;

    const modelCards = models
        .map(
            (m, i) => `
    <div class="model-card">
      <div class="model-card-left">
        <div class="model-name">${escapeHTML(m.name)}${i === 0 ? '<span class="best-badge">Best Pick</span>' : ""}</div>
        <div class="model-desc">${escapeHTML(m.company)} · ${escapeHTML(m.desc)}</div>
        <div class="model-stats">${m.stats.map(s => `<span class="stat-pill">${escapeHTML(s)}</span>`).join("")}</div>
      </div>
      <div class="model-price"><div class="price-val">${escapeHTML(m.price)}</div><div class="price-unit">${escapeHTML(m.unit)}</div></div>
    </div>`
        )
        .join("");

    const modelsSection = `
    <div class="response-section">
      <div class="section-label"><div class="section-label-dot"></div>Recommended AI Models</div>
      <div class="model-grid">${modelCards}</div>
    </div>`;

    return promptSection + instrSection + modelsSection;
}

async function sendMessage() {
    const raw = dom.userInput.value.trim();
    if (!raw || state.isLoading) return;

    if (!getActiveSession()) createSession();
    const session = getActiveSession();

    dom.welcomeScreen.classList.add("hidden");
    dom.messagesContainer.classList.remove("hidden");

    const userMsg = { role: "user", content: raw };
    session.messages.push(userMsg);
    if (session.messages.length === 1) {
        session.title = raw.length > 42 ? raw.slice(0, 42) + "…" : raw;
        dom.topbarTitle.textContent = session.title;
    }
    saveSessionsToStorage();
    renderSidebarHistory();
    appendMessageToDOM(userMsg);

    dom.userInput.value = "";
    dom.userInput.style.height = "auto";
    dom.sendBtn.disabled = true;
    state.isLoading = true;
    showThinking();
    scrollToBottom();

    try {
        const category = classifyTask(raw);
        const rawText = await callAPI(raw, category);

        let parsed;
        try {
            const clean = rawText
                .replace(/^```(?:json)?\n?/i, "")
                .replace(/\n?```$/i, "")
                .trim();
            parsed = JSON.parse(clean);
        } catch {
            parsed = {
                optimized_prompt: rawText,
                instructions: [
                    "Copy the prompt above.",
                    "Paste it into your preferred AI model.",
                    "Replace any [bracketed placeholders] with your specifics.",
                    "Iterate and refine based on the output."
                ],
                tips: "Run the prompt a few times and compare outputs."
            };
        }

        const html = buildResponseHTML(parsed, category);
        const aiMsg = { role: "ai", content: parsed.optimized_prompt, html };
        session.messages.push(aiMsg);
        saveSessionsToStorage();
        hideThinking();
        appendMessageToDOM(aiMsg);
    } catch (err) {
        console.error("API Error:", err);
        hideThinking();
        const errHTML = `<div class="error-msg">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>${escapeHTML(err.message)}</span>
    </div>`;
        const errMsg = { role: "ai", content: "Error", html: errHTML };
        session.messages.push(errMsg);
        saveSessionsToStorage();
        appendMessageToDOM(errMsg);
    }
    state.isLoading = false;
    scrollToBottom();
}

window.copyPrompt = function (btn) {
    const el = document.getElementById(btn.getAttribute("data-target"));
    if (!el) return;
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
        btn.classList.add("copied");
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Copied!`;
        setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy`;
        }, 2000);
    });
};

function openModal() {
    dom.groqKeyInput.value = state.keys.groq ? "••••••••••" : "";
    dom.geminiKeyInput.value = state.keys.gemini ? "••••••••••" : "";
    dom.openaiKeyInput.value = state.keys.openai ? "••••••••••" : "";
    dom.anthropicKeyInput.value = state.keys.anthropic ? "••••••••••" : "";
    switchModalTab(state.provider);
    dom.apiModal.classList.remove("hidden");
}

function switchModalTab(provider) {
    state.modalTab = provider;
    dom.providerTabs.forEach(t => {
        const active = t.getAttribute("data-provider") === provider;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", String(active));
    });
    Object.entries(dom.providerPanels).forEach(
        ([p, el]) => el && el.classList.toggle("active", p === provider)
    );
}

function clearChat() {
    const s = getActiveSession();
    if (!s || !s.messages.length) return;
    s.messages = [];
    s.title = "New Chat";
    saveSessionsToStorage();
    renderSidebarHistory();
    renderMessages();
}

function escapeHTML(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function scrollToBottom() {
    requestAnimationFrame(() => {
        dom.chatArea.scrollTop = dom.chatArea.scrollHeight;
    });
}
function autoResize() {
    dom.userInput.style.height = "auto";
    dom.userInput.style.height =
        Math.min(dom.userInput.scrollHeight, 200) + "px";
}

function bindEvents() {
    dom.providerTabs.forEach(tab =>
        tab.addEventListener("click", () =>
            switchModalTab(tab.getAttribute("data-provider"))
        )
    );

    dom.toggleVis.forEach(btn => {
        btn.addEventListener("click", () => {
            const input = document.getElementById(
                btn.getAttribute("data-target")
            );
            if (input)
                input.type = input.type === "password" ? "text" : "password";
        });
    });

    dom.saveApiKey.addEventListener("click", () => {
        const p = state.modalTab;
        const gq = dom.groqKeyInput.value.trim();
        const gm = dom.geminiKeyInput.value.trim();
        const ov = dom.openaiKeyInput.value.trim();
        const av = dom.anthropicKeyInput.value.trim();

        if (gq && !gq.startsWith("•")) state.keys.groq = gq;
        if (gm && !gm.startsWith("•")) state.keys.gemini = gm;
        if (ov && !ov.startsWith("•")) state.keys.openai = ov;
        if (av && !av.startsWith("•")) state.keys.anthropic = av;

        if (!state.keys[p]) {
            const inputMap = {
                groq: dom.groqKeyInput,
                gemini: dom.geminiKeyInput,
                openai: dom.openaiKeyInput,
                anthropic: dom.anthropicKeyInput
            };
            const inp = inputMap[p];
            if (inp) {
                inp.style.borderColor = "#ef4444";
                inp.focus();
                setTimeout(() => (inp.style.borderColor = ""), 2500);
            }
            return;
        }

        state.provider = p;
        saveProviderState();
        updateProviderBadge();
        dom.apiModal.classList.add("hidden");
    });

    dom.settingsBtn.addEventListener("click", openModal);
    dom.sidebarToggle.addEventListener("click", toggleSidebar);
    dom.sidebarOverlay.addEventListener("click", closeSidebarMobile);
    dom.newChatBtn.addEventListener("click", startNewChat);
    dom.clearBtn.addEventListener("click", clearChat);
    dom.themeBtn.addEventListener("click", () =>
        applyTheme(state.theme === "dark" ? "light" : "dark")
    );

    dom.userInput.addEventListener("input", () => {
        autoResize();
        dom.sendBtn.disabled = !dom.userInput.value.trim();
    });
    dom.userInput.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!dom.sendBtn.disabled) sendMessage();
        }
    });
    dom.sendBtn.addEventListener("click", sendMessage);

    dom.suggestionChips.forEach(chip => {
        chip.addEventListener("click", () => {
            dom.userInput.value = chip.getAttribute("data-text");
            autoResize();
            dom.sendBtn.disabled = false;
            dom.userInput.focus();
        });
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            closeSidebarMobile();
            dom.apiModal.classList.add("hidden");
        }
    });

    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", e => {
            if (!localStorage.getItem(KEY_THEME))
                applyTheme(e.matches ? "dark" : "light");
        });
}

document.addEventListener("DOMContentLoaded", init);
function typeText(element, text, speed = 18) {
    return new Promise(resolve => {
        element.textContent = "";
        let i = 0;
        const interval = setInterval(() => {
            element.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });
}

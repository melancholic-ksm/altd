// Fallback static presets (used when API fetch fails or no API key yet)
const FALLBACK_MODEL_PRESETS = [
  { id: "openai/gpt-oss-120b", label: "OpenAI GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b", label: "OpenAI GPT-OSS 20B" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B" },
  { id: "moonshotai/kimi-k2-instruct-0905", label: "Kimi K2" },
  { id: "groq/compound", label: "Groq Compound" },
  { id: "groq/compound-mini", label: "Groq Compound Mini" }
];

// Cache duration: 1 hour (in milliseconds)
const MODEL_CACHE_TTL = 60 * 60 * 1000;

// Dynamic model fetching from Groq API
async function fetchGroqModels(apiKey) {
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.warn(`Groq models API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const models = data?.data || [];

    // Filter to chat-capable models and format them
    const chatModels = models
      .filter(m => m.id && !m.id.includes("whisper") && !m.id.includes("distil"))
      .map(m => ({
        id: m.id,
        label: formatModelLabel(m.id, m.owned_by),
        context_window: m.context_window,
        owned_by: m.owned_by,
        active: m.active !== false
      }))
      .sort((a, b) => {
        // Prioritize: gpt-oss > llama > qwen > kimi > compound > others
        const priority = id => {
          if (id.includes("gpt-oss-120b")) return 0;
          if (id.includes("gpt-oss")) return 1;
          if (id.includes("llama-3.3")) return 2;
          if (id.includes("llama-3.1")) return 3;
          if (id.includes("llama-4")) return 4;
          if (id.includes("qwen")) return 5;
          if (id.includes("kimi")) return 6;
          if (id.includes("compound")) return 7;
          if (id.includes("llama")) return 8;
          return 9;
        };
        return priority(a.id) - priority(b.id);
      });

    return chatModels.length > 0 ? chatModels : null;
  } catch (error) {
    console.error("Failed to fetch Groq models:", error);
    return null;
  }
}

// Generate a human-readable label from model ID
function formatModelLabel(id, ownedBy) {
  // Common transformations
  let label = id
    .replace(/^openai\//, "")
    .replace(/^meta-llama\//, "")
    .replace(/^qwen\//, "")
    .replace(/^moonshotai\//, "")
    .replace(/^groq\//, "")
    .replace(/-instruct.*$/, "")
    .replace(/-[0-9]{4}$/, "") // Remove date suffixes like -0905
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Add owner prefix for clarity
  if (ownedBy && !label.toLowerCase().includes(ownedBy.toLowerCase())) {
    const ownerMap = {
      "openai": "OpenAI",
      "meta-llama": "Meta",
      "qwen": "Alibaba",
      "moonshotai": "Moonshot",
      "groq": "Groq"
    };
    const prefix = ownerMap[ownedBy] || ownedBy;
    if (prefix && prefix !== "Groq") {
      label = `${prefix} ${label}`;
    }
  }

  return label;
}

// Get models with caching
async function getModels(forceRefresh = false) {
  const stored = await chrome.storage.local.get(["modelCache", "settings"]);
  const cache = stored.modelCache;
  const apiKey = stored.settings?.apiKey;

  // Check if cache is valid
  if (!forceRefresh && cache?.models?.length > 0 && cache?.timestamp) {
    const age = Date.now() - cache.timestamp;
    if (age < MODEL_CACHE_TTL) {
      return cache.models;
    }
  }

  // Try to fetch fresh models
  const freshModels = await fetchGroqModels(apiKey);

  if (freshModels && freshModels.length > 0) {
    // Cache the fresh models
    await chrome.storage.local.set({
      modelCache: {
        models: freshModels,
        timestamp: Date.now()
      },
      modelPresets: freshModels // For backward compatibility
    });
    return freshModels;
  }

  // Return cached models if fetch failed but cache exists
  if (cache?.models?.length > 0) {
    return cache.models;
  }

  // Ultimate fallback to static presets
  return FALLBACK_MODEL_PRESETS;
}

// Expose model refresh to other parts of extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "REFRESH_MODELS") {
    getModels(true).then(models => {
      sendResponse({ ok: true, models });
    }).catch(err => {
      sendResponse({ ok: false, error: err.message });
    });
    return true; // Keep channel open for async response
  }

  if (message?.type === "GET_MODELS") {
    getModels(false).then(models => {
      sendResponse({ ok: true, models });
    }).catch(err => {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }
  
  // Return false for unhandled messages in this listener
  return false;
});

const DEFAULT_SETTINGS = {
  model: "openai/gpt-oss-120b",
  temperature: 0.15,
  apiKey: "",
  modes: {
    grammar: true,
    vocabulary: true,
    custom: true
  },
  customInstructions: "Prefer concise, upbeat English. Preserve original meaning.",
  tone: "default"
};

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
  const stored = await chrome.storage.local.get("settings");
  if (!stored.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  // Initialize with fallback presets, will be updated when API key is set
  await chrome.storage.local.set({ modelPresets: FALLBACK_MODEL_PRESETS });
  // Try to fetch models if API key exists
  if (stored.settings?.apiKey) {
    void getModels(true);
  }
  
  // Open tutorial on first install
  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://melancholic-ksm.github.io/altd/tutorial.html" });
  }
});

// Refresh models when settings change (e.g., new API key)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.settings?.newValue?.apiKey) {
    const newKey = changes.settings.newValue.apiKey;
    const oldKey = changes.settings.oldValue?.apiKey;
    if (newKey && newKey !== oldKey) {
      // New API key set, refresh models
      void getModels(true);
    }
  }
});

chrome.commands.onCommand.addListener(async command => {
  if (command === "fix-selection") {
    const tab = await getActiveEditableTab();
    if (tab?.id) {
      void orchestrateFixFlow(tab.id);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "ALT_D_TRIGGER" && sender.tab?.id) {
    orchestrateFixFlow(sender.tab.id).then(() => {
      sendResponse({ ok: true });
    }).catch(err => {
      sendResponse({ ok: false, error: err.message });
    });
    return true; // Keep channel open for async response
  }

  if (message?.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "OPEN_SHORTCUTS") {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "OPEN_TUTORIAL") {
    chrome.tabs.create({ url: "https://melancholic-ksm.github.io/altd/tutorial.html" });
    sendResponse({ ok: true });
    return false;
  }
  
  // Return false for unhandled messages
  return false;
});

async function orchestrateFixFlow(tabId) {
  try {
    const selection = await requestSelection(tabId);
    if (!selection?.ok) {
      await sendStatus(tabId, selection?.error || "Highlight text first. Select that text before pressing Alt+D. which you want to editout", "error");
      return;
    }

    const settings = await getSettings();
    if (!settings.apiKey) {
      await sendStatus(tabId, "Add your Groq API key in the Alt-D options page.", "error");
      return;
    }

    // Show which model is being contacted
    const modelLabel = await getModelLabel(settings.model);
    await sendStatus(tabId, `Contacting ${modelLabel}…`, "progress");

    const polished = await callGroqWithFallback(selection.payload, settings, tabId);
    if (!polished) {
      await sendStatus(tabId, "Model returned an empty rewrite.", "error");
      return;
    }

    await chrome.tabs.sendMessage(tabId, {
      type: "APPLY_FIX",
      replacementText: polished
    });
    await sendStatus(tabId, "Replaced selection.");
  } catch (error) {
    await sendStatus(tabId, formatGroqError(error), "error");
  }
}

// Get friendly label for a model ID
async function getModelLabel(modelId) {
  const models = await getModels();
  const model = models.find(m => m.id === modelId);
  if (model?.label) {
    return model.label;
  }
  // Fallback: format the model ID nicely
  return modelId
    .replace(/^(openai|meta-llama|qwen|moonshotai|groq)\//, "")
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function callGroqWithFallback(selectionPayload, settings, tabId) {
  let workingSettings = { ...settings };
  const candidates = await buildModelPriorityList(workingSettings.model);
  let lastError;
  let attemptCount = 0;

  for (const candidate of candidates) {
    attemptCount++;
    try {
      // Show which model we're trying
      const modelLabel = await getModelLabel(candidate);
      const paramSize = extractParamSize(candidate);
      const sizeInfo = paramSize > 0 ? ` (${paramSize}B)` : "";
      
      if (attemptCount === 1) {
        await sendStatus(tabId, `Contacting ${modelLabel}${sizeInfo}…`, "progress");
      } else {
        await sendStatus(tabId, `Trying ${modelLabel}${sizeInfo}…`, "progress");
      }
      
      const response = await callGroq(selectionPayload, { ...workingSettings, model: candidate });
      
      // If we had to fallback, save the working model
      if (candidate !== settings.model && attemptCount > 1) {
        workingSettings = { ...workingSettings, model: candidate };
        await chrome.storage.local.set({ settings: workingSettings });
        const successLabel = await getModelLabel(candidate);
        await sendStatus(tabId, `Using ${successLabel} (fallback)`, "progress");
      }
      return response;
    } catch (error) {
      lastError = error;
      const modelLabel = await getModelLabel(candidate);
      
      // Determine if we should try next model
      const shouldRetry = isRetryableError(error);
      
      if (shouldRetry && attemptCount < candidates.length) {
        const nextCandidate = candidates[attemptCount];
        const nextLabel = nextCandidate ? await getModelLabel(nextCandidate) : "next model";
        const nextParams = nextCandidate ? extractParamSize(nextCandidate) : 0;
        const nextSizeInfo = nextParams > 0 ? ` (${nextParams}B)` : "";
        
        await sendStatus(
          tabId,
          `${modelLabel} failed. Trying ${nextLabel}${nextSizeInfo}…`,
          "progress"
        );
        continue;
      }
      
      // Non-retryable error or out of candidates
      throw error;
    }
  }

  throw lastError || new Error("All models unavailable.");
}

// Check if an error should trigger model fallback
function isRetryableError(error) {
  if (!error) return false;
  
  const status = error.status;
  const code = error.code;
  const message = (error.message || "").toLowerCase();
  
  // Model-specific errors (definitely retry)
  if (code === "model_not_found" || code === "model_not_active") return true;
  if (status === 404 && message.includes("model")) return true;
  
  // Rate limits (429) - try another model
  if (status === 429) return true;
  
  // Server errors (5xx) - might be model-specific
  if (status >= 500 && status < 600) return true;
  
  // Model overloaded/unavailable
  if (message.includes("overloaded") || message.includes("unavailable")) return true;
  if (message.includes("capacity") || message.includes("busy")) return true;
  
  // Context length errors - smaller model might work
  if (message.includes("context") && message.includes("length")) return true;
  if (message.includes("too long") || message.includes("max tokens")) return true;
  
  return false;
}

function requestSelection(tabId) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, { type: "REQUEST_SELECTION" }, response => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: "Inject content script first." });
        return;
      }
      resolve(response);
    });
  });
}

function sendStatus(tabId, message, level = "success") {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(
      tabId,
      {
        type: "STATUS",
        level,
        message
      },
      () => resolve()
    );
  });
}

async function getActiveEditableTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab;
}

async function getSettings() {
  const stored = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };
}

async function callGroq(selectionPayload, settings) {
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  const messages = buildMessages(selectionPayload, settings);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      temperature: settings.temperature,
      max_completion_tokens: 768,
      messages
    }),
    signal: controller.signal
  });

  clearTimeout(timeout);

  const rawText = await response.text();
  let parsed;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {
      parsed = undefined;
    }
  }

  if (!response.ok) {
    const error = new Error(parsed?.error?.message || rawText || "Groq request failed.");
    error.status = response.status;
    error.code = parsed?.error?.code || parsed?.error?.type;
    error.modelId = settings.model;
    throw error;
  }

  const data = parsed ?? {};
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === "string") {
          return part;
        }
        if (typeof part?.text === "string") {
          return part.text;
        }
        return "";
      })
      .join("")
      .trim();
  }
  return typeof content === "string" ? content.trim() : "";
}

// Tone presets with specific prompts
const TONE_PRESETS = {
  default: "",
  formal: "Use formal, professional language. Avoid contractions and colloquialisms. Maintain a respectful, business-appropriate tone.",
  friendly: "Use warm, approachable language. Be conversational and personable while remaining clear and helpful.",
  concise: "Be extremely brief and to the point. Remove all unnecessary words. Prioritize clarity over elaboration.",
  playful: "Use a light, fun tone with wit and humor where appropriate. Keep it engaging and entertaining.",
  academic: "Use scholarly, precise language. Include appropriate hedging and formal academic conventions.",
  casual: "Use relaxed, everyday language. Write as if chatting with a friend. Contractions welcome.",
  persuasive: "Use compelling, convincing language. Emphasize benefits and use strong, active verbs.",
  empathetic: "Use compassionate, understanding language. Acknowledge feelings and show genuine care.",
  confident: "Use assertive, self-assured language. Be direct and decisive without being aggressive.",
  creative: "Use vivid, imaginative language. Employ metaphors, varied sentence structures, and expressive words.",
  technical: "Use precise, domain-specific terminology. Be accurate and detailed for expert audiences.",
  enthusiastic: "Use energetic, excited language. Show genuine passion and positivity.",
  neutral: "Use balanced, objective language. Avoid emotional words and present information impartially.",
  diplomatic: "Use tactful, considerate language. Balance honesty with sensitivity.",
  custom1: "", // User-defined
  custom2: "", // User-defined
  custom3: ""  // User-defined
};

function buildMessages(selectionPayload, settings) {
  const targetModes = Object.entries(settings.modes)
    .filter(([, enabled]) => enabled)
    .map(([mode]) => mode)
    .join(", ");

  // Get tone prompt - either from presets or custom
  let tonePrompt = "";
  if (settings.tone && settings.tone !== "default") {
    if (settings.tone.startsWith("custom") && settings.customTones?.[settings.tone]) {
      tonePrompt = settings.customTones[settings.tone];
    } else if (TONE_PRESETS[settings.tone]) {
      tonePrompt = TONE_PRESETS[settings.tone];
    }
  }

  const instructions = [
    `Focus on: ${targetModes || "grammar"}.`,
    tonePrompt ? `Tone: ${tonePrompt}` : "",
    "Preserve semantics, markdown, and placeholders unless edits improve clarity."
  ]
    .filter(Boolean)
    .join(" \n");

  const prompt = [
    instructions,
    "Use the context to stay consistent but ONLY rewrite the delimited text block.",
    "CONTEXT ENVELOPE:",
    selectionPayload.context,
    "TEXT TO POLISH:",
    selectionPayload.text
  ].join("\n");

  return [
    {
      role: "system",
      content: `You are Alt-D, a careful editor. Fix grammar, tighten vocabulary, and apply the specified tone. Preserve intent and format.`
    },
    {
      role: "user",
      content: prompt
    }
  ];
}

// Groq error codes: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found,
// 413 Request Too Large, 422 Unprocessable, 429 Rate Limit, 500/502/503 Server errors.
function formatGroqError(error) {
  if (error?.name === "AbortError") {
    return "Groq request timed out (18s). Try again.";
  }

  const status = error?.status;
  const code = error?.code || error?.type;
  const modelId = error?.modelId;

  // Model not found (404 with model_not_found code)
  if (code === "model_not_found" || code === "model_not_active") {
    return `Model "${modelId}" is unavailable. Select a different model in settings.`;
  }

  // Authentication (401)
  if (status === 401) {
    return "Invalid Groq API key. Check your key in Alt-D settings.";
  }

  // Forbidden (403)
  if (status === 403) {
    return "Your Groq API key lacks permission for this model or action.";
  }

  // Rate limit (429)
  if (status === 429) {
    return "Groq rate limit hit. Wait a moment and try again.";
  }

  // Request too large (413)
  if (status === 413) {
    return "Selection too large. Highlight less text and try again.";
  }

  // Unprocessable (422) – often hallucination or semantic issue
  if (status === 422) {
    return "Groq couldn't process the request. Try rephrasing or selecting different text.";
  }

  // Server errors (500, 502, 503)
  if (status >= 500 && status < 600) {
    return `Groq server error (${status}). Try again shortly.`;
  }

  // Generic fallback
  const prefix = status ? `Groq ${status}: ` : "";
  return prefix + (error?.message || "Groq request failed.");
}

async function getFallbackModel(excludedId) {
  const models = await getModels();
  return models.find(preset => preset.id !== excludedId);
}

// Extract parameter count (in billions) from model ID
function extractParamSize(modelId) {
  if (!modelId) return 0;
  const id = modelId.toLowerCase();
  
  // Match patterns like "120b", "70b", "32b", "8b", etc.
  const match = id.match(/(\d+)b/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // Special cases for models without clear B notation
  if (id.includes("compound") && !id.includes("mini")) return 50; // Compound is likely large
  if (id.includes("compound-mini")) return 10;
  if (id.includes("kimi") || id.includes("k2")) return 100; // Kimi K2 is very large
  
  // Default for unknown models
  return 1;
}

async function buildModelPriorityList(primaryId) {
  const models = await getModels();
  const seen = new Set();
  const order = [];
  const push = id => {
    if (id && !seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  };

  // First, add the user's selected model
  push(primaryId || DEFAULT_SETTINGS.model);
  
  // Sort remaining models by parameter size (descending - largest first)
  const sortedByParams = [...models]
    .map(m => ({
      id: m.id,
      params: extractParamSize(m.id)
    }))
    .sort((a, b) => b.params - a.params)
    .map(m => m.id);
  
  // Add sorted models to the priority list
  sortedByParams.forEach(id => push(id));
  
  return order;
}

const DEFAULTS = {
  model: "openai/gpt-oss-120b",
  temperature: 0.15,
  modes: { grammar: true, vocabulary: true, custom: true },
  tone: "default",
  customTones: {
    custom1: "",
    custom2: "",
    custom3: ""
  }
};

// Tone presets (must match background.js)
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
  diplomatic: "Use tactful, considerate language. Balance honesty with sensitivity."
};

const form = document.getElementById("settings-form");
const apiKeyInput = document.getElementById("apiKey");
const modelSelect = document.getElementById("model");
const refreshModelsBtn = document.getElementById("refresh-models");
const modelStatus = document.getElementById("model-status");
const temperatureInput = document.getElementById("temperature");
const toneSelect = document.getElementById("tone");
const tonePromptPreview = document.getElementById("tone-prompt-preview");
const banner = document.getElementById("save-banner");

// Custom tone inputs
const customTone1Input = document.getElementById("custom-tone-1");
const customTone2Input = document.getElementById("custom-tone-2");
const customTone3Input = document.getElementById("custom-tone-3");

const modeInputs = {
  grammar: document.getElementById("mode-grammar"),
  vocabulary: document.getElementById("mode-vocabulary"),
  custom: document.getElementById("mode-custom")
};

let currentModels = [];

init();

async function init() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  const merged = mergeSettings(settings);

  // Load models
  await loadModels(false, merged.model);

  if (apiKeyInput) apiKeyInput.value = merged.apiKey || "";
  if (temperatureInput) temperatureInput.value = merged.temperature;
  if (toneSelect) toneSelect.value = merged.tone;
  
  // Load custom tones
  if (customTone1Input) customTone1Input.value = merged.customTones?.custom1 || "";
  if (customTone2Input) customTone2Input.value = merged.customTones?.custom2 || "";
  if (customTone3Input) customTone3Input.value = merged.customTones?.custom3 || "";
  
  // Show tone prompt preview
  updateTonePreview();
  
  Object.entries(modeInputs).forEach(([key, input]) => {
    input.checked = merged.modes?.[key];
  });

  // Setup refresh button
  refreshModelsBtn.addEventListener("click", () => refreshModels());

  // Auto-refresh models when API key changes
  apiKeyInput.addEventListener("blur", async () => {
    const newKey = apiKeyInput.value.trim();
    if (newKey && newKey.startsWith("gsk_")) {
      await refreshModels();
    }
  });

  // Setup auto-save on all inputs
  setupAutoSave();
}

// Update tone prompt preview
function updateTonePreview() {
  if (!toneSelect || !tonePromptPreview) return;
  
  const selectedTone = toneSelect.value;
  let promptText = "";
  
  if (selectedTone === "default") {
    promptText = "";
  } else if (selectedTone.startsWith("custom")) {
    // Get custom tone text
    if (selectedTone === "custom1" && customTone1Input) {
      promptText = customTone1Input.value.trim();
    } else if (selectedTone === "custom2" && customTone2Input) {
      promptText = customTone2Input.value.trim();
    } else if (selectedTone === "custom3" && customTone3Input) {
      promptText = customTone3Input.value.trim();
    }
  } else {
    promptText = TONE_PRESETS[selectedTone] || "";
  }
  
  if (promptText) {
    tonePromptPreview.innerHTML = `<strong>Prompt sent to AI:</strong><code>${promptText}</code>`;
  } else {
    tonePromptPreview.innerHTML = '<strong>Prompt sent to AI:</strong><em class="muted">No tone adjustment — just fix grammar & vocabulary</em>';
  }
}

// Debounce function for text inputs
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Auto-save settings whenever any input changes
function setupAutoSave() {
  const debouncedSave = debounce(saveSettings, 500);

  // Immediate save for selects and checkboxes
  if (modelSelect) modelSelect.addEventListener("change", saveSettings);
  if (toneSelect) toneSelect.addEventListener("change", () => {
    updateTonePreview();
    saveSettings();
  });
  Object.values(modeInputs).forEach(input => {
    if (input) input.addEventListener("change", saveSettings);
  });

  // Debounced save for text inputs (wait until user stops typing)
  if (apiKeyInput) apiKeyInput.addEventListener("input", debouncedSave);
  if (temperatureInput) temperatureInput.addEventListener("input", debouncedSave);
  if (customTone1Input) customTone1Input.addEventListener("input", () => {
    updateTonePreview();
    debouncedSave();
  });
  if (customTone2Input) customTone2Input.addEventListener("input", () => {
    updateTonePreview();
    debouncedSave();
  });
  if (customTone3Input) customTone3Input.addEventListener("input", () => {
    updateTonePreview();
    debouncedSave();
  });
}

async function loadModels(forceRefresh = false, selectedModel = null) {
  try {
    modelStatus.textContent = forceRefresh ? "Fetching models..." : "Loading models...";
    refreshModelsBtn.disabled = true;
    refreshModelsBtn.classList.add("spinning");

    const response = await chrome.runtime.sendMessage({
      type: forceRefresh ? "REFRESH_MODELS" : "GET_MODELS"
    });

    if (response?.ok && response.models?.length > 0) {
      currentModels = response.models;
      bindModelOptions(response.models, selectedModel || modelSelect.value);
      const count = response.models.length;
      modelStatus.textContent = `${count} model${count !== 1 ? "s" : ""} available from Groq API`;
    } else {
      modelStatus.textContent = "Using cached models. Add API key to fetch latest.";
    }
  } catch (error) {
    console.error("Failed to load models:", error);
    modelStatus.textContent = "Failed to load models. Using defaults.";
  } finally {
    refreshModelsBtn.disabled = false;
    refreshModelsBtn.classList.remove("spinning");
  }
}

async function refreshModels() {
  const currentSelection = modelSelect.value;
  await loadModels(true, currentSelection);
  showBanner("Models refreshed ✓");
}

function bindModelOptions(models, selectedValue) {
  const previousValue = selectedValue || modelSelect.value || DEFAULTS.model;
  modelSelect.innerHTML = "";

  // Group models by category
  const groups = {
    "GPT-OSS": [],
    "Llama": [],
    "Qwen": [],
    "Kimi": [],
    "Compound": [],
    "Other": []
  };

  models.forEach(model => {
    const id = model.id.toLowerCase();
    if (id.includes("gpt-oss")) {
      groups["GPT-OSS"].push(model);
    } else if (id.includes("llama")) {
      groups["Llama"].push(model);
    } else if (id.includes("qwen")) {
      groups["Qwen"].push(model);
    } else if (id.includes("kimi")) {
      groups["Kimi"].push(model);
    } else if (id.includes("compound")) {
      groups["Compound"].push(model);
    } else {
      groups["Other"].push(model);
    }
  });

  // Create optgroups for each non-empty category
  Object.entries(groups).forEach(([groupName, groupModels]) => {
    if (groupModels.length === 0) return;

    const optgroup = document.createElement("optgroup");
    optgroup.label = groupName;

    groupModels.forEach(model => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.label;
      if (model.context_window) {
        option.textContent += ` (${formatContextWindow(model.context_window)})`;
      }
      optgroup.appendChild(option);
    });

    modelSelect.appendChild(optgroup);
  });

  // Try to restore previous selection
  if (previousValue && [...modelSelect.options].some(opt => opt.value === previousValue)) {
    modelSelect.value = previousValue;
  } else if (modelSelect.options.length > 0) {
    modelSelect.value = modelSelect.options[0]?.value || DEFAULTS.model;
  }
}

function formatContextWindow(tokens) {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(0)}M ctx`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K ctx`;
  }
  return `${tokens} ctx`;
}

// Save settings function (called on any change)
async function saveSettings() {
  const payload = {
    apiKey: apiKeyInput?.value?.trim() || "",
    model: modelSelect?.value || DEFAULTS.model,
    temperature: Number(temperatureInput?.value) || 0.15,
    tone: toneSelect?.value || "default",
    customTones: {
      custom1: customTone1Input?.value?.trim() || "",
      custom2: customTone2Input?.value?.trim() || "",
      custom3: customTone3Input?.value?.trim() || ""
    },
    modes: Object.fromEntries(Object.entries(modeInputs).map(([key, input]) => [key, input?.checked ?? false]))
  };

  await chrome.storage.local.set({ settings: mergeSettings(payload) });
  showBanner("Auto-saved ✓");
}

// Keep form submit for manual save (optional)
form.addEventListener("submit", async event => {
  event.preventDefault();
  await saveSettings();
});

function mergeSettings(overrides) {
  return {
    ...DEFAULTS,
    ...overrides,
    modes: {
      ...DEFAULTS.modes,
      ...(overrides?.modes || {})
    },
    customTones: {
      ...DEFAULTS.customTones,
      ...(overrides?.customTones || {})
    }
  };
}

function showBanner(text) {
  banner.textContent = text;
  setTimeout(() => (banner.textContent = ""), 2400);
}

// Disabled pages/sites management
const disabledList = document.getElementById("disabled-list");
const disabledTimer = document.getElementById("disabled-timer");
const clearAllBtn = document.getElementById("clear-all-disabled");

async function loadDisabledList() {
  const { disabledPages = [], disabledSites = [], disabledUntil = 0 } = 
    await chrome.storage.local.get(["disabledPages", "disabledSites", "disabledUntil"]);
  
  disabledList.innerHTML = "";
  
  const now = Date.now();
  const hasItems = disabledPages.length > 0 || disabledSites.length > 0 || disabledUntil > now;
  
  if (!hasItems) {
    disabledList.innerHTML = '<em class="muted">No pages or sites disabled</em>';
    disabledTimer.textContent = "";
    return;
  }
  
  // Show global timer if active
  if (disabledUntil > now) {
    const remaining = Math.ceil((disabledUntil - now) / 60000);
    disabledTimer.textContent = `Globally disabled for ${formatRemainingTime(remaining)}`;
    
    const timerItem = document.createElement("div");
    timerItem.className = "disabled-item";
    timerItem.innerHTML = `
      <span class="disabled-label">⏱️ Everywhere (timer)</span>
      <button type="button" data-clear="timer" class="remove-btn">×</button>
    `;
    disabledList.appendChild(timerItem);
  } else {
    disabledTimer.textContent = "";
  }
  
  // Show disabled sites
  disabledSites.forEach(site => {
    const item = document.createElement("div");
    item.className = "disabled-item";
    item.innerHTML = `
      <span class="disabled-label">🌐 ${site}</span>
      <button type="button" data-clear="site" data-value="${site}" class="remove-btn">×</button>
    `;
    disabledList.appendChild(item);
  });
  
  // Show disabled pages (truncated)
  disabledPages.forEach(page => {
    const displayUrl = page.length > 40 ? page.substring(0, 40) + "…" : page;
    const item = document.createElement("div");
    item.className = "disabled-item";
    item.innerHTML = `
      <span class="disabled-label" title="${page}">📄 ${displayUrl}</span>
      <button type="button" data-clear="page" data-value="${page}" class="remove-btn">×</button>
    `;
    disabledList.appendChild(item);
  });
}

function formatRemainingTime(minutes) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr`;
  return `${Math.round(minutes / 1440)} day(s)`;
}

disabledList.addEventListener("click", async event => {
  const btn = event.target.closest("button[data-clear]");
  if (!btn) return;
  
  const clearType = btn.dataset.clear;
  const value = btn.dataset.value;
  
  if (clearType === "timer") {
    await chrome.storage.local.set({ disabledUntil: 0 });
  } else if (clearType === "site") {
    const { disabledSites = [] } = await chrome.storage.local.get("disabledSites");
    await chrome.storage.local.set({ 
      disabledSites: disabledSites.filter(s => s !== value) 
    });
  } else if (clearType === "page") {
    const { disabledPages = [] } = await chrome.storage.local.get("disabledPages");
    await chrome.storage.local.set({ 
      disabledPages: disabledPages.filter(p => p !== value) 
    });
  }
  
  loadDisabledList();
  showBanner("Removed ✓");
});

clearAllBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({ 
    disabledPages: [], 
    disabledSites: [], 
    disabledUntil: 0 
  });
  loadDisabledList();
  showBanner("All cleared ✓");
});

// Load disabled list on init
loadDisabledList();

// Refresh disabled list when storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && (changes.disabledPages || changes.disabledSites || changes.disabledUntil)) {
    loadDisabledList();
  }
});

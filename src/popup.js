const apiChip = document.getElementById("api-status");
const modelName = document.getElementById("model-name");
const toneName = document.getElementById("tone-name");
const refreshBtn = document.getElementById("refresh-btn");
const optionsBtn = document.getElementById("options-btn");
const optionsFullBtn = document.getElementById("options-full-btn");
const shortcutsBtn = document.getElementById("open-shortcuts");
const tutorialBtn = document.getElementById("tutorial-btn");
const panelToggle = document.getElementById("panel-toggle");

refreshBtn?.addEventListener("click", loadState);
optionsBtn?.addEventListener("click", () => chrome.runtime.openOptionsPage());
optionsFullBtn?.addEventListener("click", () => chrome.runtime.openOptionsPage());
shortcutsBtn?.addEventListener("click", () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" }));
tutorialBtn?.addEventListener("click", () => chrome.tabs.create({ url: "https://melancholic-ksm.github.io/altd/tutorial.html" }));

// Floating panel toggle
panelToggle?.addEventListener("change", async () => {
  const showPanel = panelToggle.checked;
  await chrome.storage.local.set({ showFloatingPanel: showPanel });
  
  // Notify all tabs to show/hide panel
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL", show: showPanel }).catch(() => {});
    }
  }
});

void loadState();

async function loadState() {
  if (apiChip) {
    apiChip.textContent = "Checking…";
    apiChip.className = "chip";
  }

  const stored = await chrome.storage.local.get(["settings", "modelCache", "showFloatingPanel"]);
  const settings = stored.settings || {};
  const models = stored.modelCache?.models || [];
  
  // Load panel toggle state (default to true/shown)
  if (panelToggle) {
    panelToggle.checked = stored.showFloatingPanel !== false;
  }

  if (apiChip) {
    if (settings.apiKey) {
      apiChip.textContent = "Ready";
      apiChip.classList.add("ok");
    } else {
      apiChip.textContent = "Missing";
      apiChip.classList.add("error");
    }
  }

  // Find the friendly label for the current model
  const currentModelId = settings.model || "openai/gpt-oss-120b";
  const modelInfo = models.find(m => m.id === currentModelId);
  
  if (modelName) {
    modelName.textContent = modelInfo?.label || formatModelId(currentModelId);
    modelName.title = currentModelId; // Show full ID on hover
  }
  
  if (toneName) {
    toneName.textContent = (settings.tone || "default").replace(/\b\w/g, letter => letter.toUpperCase());
  }
}

// Format model ID into readable label if not found in cache
function formatModelId(id) {
  return id
    .replace(/^(openai|meta-llama|qwen|moonshotai|groq)\//, "")
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

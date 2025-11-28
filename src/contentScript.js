const selectionState = {
  lastSelection: null,
  originalText: null  // Store original text before any fix
};

// Undo history - stores original state before Alt-D fixes
const undoState = {
  canUndo: false,
  originalText: null,
  element: null,       // For text-control
  start: null,
  end: null,
  range: null,         // For content-editable
  kind: null,
  replacedLength: 0    // Length of the replacement text
};

const uiState = {
  panel: null,
  logList: null,
  statusText: null,
  styleEl: null,
  isDisabled: false
};

// Check if extension is disabled for current context
async function checkDisabledState() {
  const { disabledPages = [], disabledSites = [], disabledUntil = 0, sessionDisabled = {} } = 
    await chrome.storage.local.get(["disabledPages", "disabledSites", "disabledUntil", "sessionDisabled"]);
  
  const currentUrl = window.location.href;
  const currentHost = window.location.hostname;
  const now = Date.now();
  
  // Check global disable timer
  if (disabledUntil > now) {
    uiState.isDisabled = true;
    return true;
  }
  
  // Check session disable for current site
  if (sessionDisabled[currentHost] && sessionDisabled[currentHost] > now) {
    uiState.isDisabled = true;
    return true;
  }
  
  // Check site disable
  if (disabledSites.includes(currentHost)) {
    uiState.isDisabled = true;
    return true;
  }
  
  // Check page disable
  if (disabledPages.includes(currentUrl)) {
    uiState.isDisabled = true;
    return true;
  }
  
  uiState.isDisabled = false;
  return false;
}

async function disableForPage() {
  const { disabledPages = [] } = await chrome.storage.local.get("disabledPages");
  const currentUrl = window.location.href;
  if (!disabledPages.includes(currentUrl)) {
    disabledPages.push(currentUrl);
    await chrome.storage.local.set({ disabledPages });
  }
  uiState.isDisabled = true;
  hidePanel();
  showStatus("Disabled for this page", "info");
}

async function disableForSite() {
  const { disabledSites = [] } = await chrome.storage.local.get("disabledSites");
  const currentHost = window.location.hostname;
  if (!disabledSites.includes(currentHost)) {
    disabledSites.push(currentHost);
    await chrome.storage.local.set({ disabledSites });
  }
  uiState.isDisabled = true;
  hidePanel();
  showStatus(`Disabled for ${currentHost}`, "info");
}

async function disableForTime(minutes) {
  const disabledUntil = Date.now() + (minutes * 60 * 1000);
  await chrome.storage.local.set({ disabledUntil });
  uiState.isDisabled = true;
  hidePanel();
  const label = formatDuration(minutes);
  showStatus(`Disabled for ${label}`, "info");
}

// Disable for this session - 30 min for current site only
async function disableForSession() {
  const currentHost = window.location.hostname;
  const { sessionDisabled = {} } = await chrome.storage.local.get("sessionDisabled");
  sessionDisabled[currentHost] = Date.now() + (30 * 60 * 1000); // 30 minutes
  await chrome.storage.local.set({ sessionDisabled });
  uiState.isDisabled = true;
  hidePanel();
  showStatus(`Disabled on ${currentHost} for 30 min`, "info");
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  if (minutes < 1440) return `${minutes / 60} hour${minutes > 60 ? 's' : ''}`;
  return `${minutes / 1440} day${minutes > 1440 ? 's' : ''}`;
}

function hidePanel() {
  if (uiState.panel) {
    uiState.panel.classList.add("hidden");
  }
}

function showPanel() {
  if (uiState.panel) {
    uiState.panel.classList.remove("hidden");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ensurePanel, { once: true });
} else {
  ensurePanel();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "REQUEST_SELECTION") {
    // Check if disabled before processing
    checkDisabledState().then(isDisabled => {
      if (isDisabled) {
        sendResponse({ ok: false, error: "Alt-D is currently disabled." });
      } else {
        const payload = captureSelection();
        sendResponse(payload);
      }
    });
    return true; // Keep channel open for async response
  }

  if (message?.type === "APPLY_FIX") {
    applyReplacement(message.replacementText);
  }

  if (message?.type === "STATUS") {
    showStatus(message.message, message.level);
  }
  
  if (message?.type === "RE_ENABLE") {
    // Allow re-enabling from popup or options
    reEnableExtension();
  }
});

// Fallback in case the command shortcut is remapped or unavailable.
document.addEventListener(
  "keydown",
  async event => {
    // Alt+D trigger
    if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === "KeyD" && !event.repeat) {
      const isDisabled = await checkDisabledState();
      if (!isDisabled) {
        chrome.runtime.sendMessage({ type: "ALT_D_TRIGGER" });
      }
    }
    
    // Ctrl+Z undo for Alt-D fixes
    if (event.ctrlKey && !event.shiftKey && !event.altKey && event.code === "KeyZ" && !event.repeat) {
      if (undoState.canUndo) {
        event.preventDefault();
        event.stopPropagation();
        undoAltDFix();
      }
    }
  },
  true
);

// Undo the last Alt-D fix - restore original text
function undoAltDFix() {
  if (!undoState.canUndo || !undoState.originalText) {
    return;
  }
  
  if (undoState.kind === "text-control" && undoState.element) {
    const value = undoState.element.value;
    const before = value.slice(0, undoState.start);
    const after = value.slice(undoState.end);
    
    undoState.element.value = before + undoState.originalText + after;
    undoState.element.setSelectionRange(
      undoState.start, 
      undoState.start + undoState.originalText.length
    );
    undoState.element.focus();
    undoState.element.dispatchEvent(new Event("input", { bubbles: true }));
    
    showStatus("Undone to original", "info");
  }
  
  if (undoState.kind === "content-editable" && undoState.newNode) {
    const parent = undoState.newNode.parentNode;
    if (parent) {
      const originalNode = document.createTextNode(undoState.originalText);
      parent.replaceChild(originalNode, undoState.newNode);
      
      // Select the restored text
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(originalNode);
      selection.addRange(range);
      
      parent.dispatchEvent(new Event("input", { bubbles: true }));
      
      showStatus("Undone to original", "info");
    }
  }
  
  // Clear undo state
  resetUndoState();
}

// Reset undo state after successful undo or when starting fresh
function resetUndoState() {
  undoState.canUndo = false;
  undoState.originalText = null;
  undoState.element = null;
  undoState.start = null;
  undoState.end = null;
  undoState.range = null;
  undoState.kind = null;
  undoState.replacedLength = 0;
  undoState.newNode = null;
  selectionState.originalText = null;
}

async function reEnableExtension() {
  const currentUrl = window.location.href;
  const currentHost = window.location.hostname;
  
  const { disabledPages = [], disabledSites = [], sessionDisabled = {} } = 
    await chrome.storage.local.get(["disabledPages", "disabledSites", "sessionDisabled"]);
  
  // Remove current page/site from disabled lists
  const newPages = disabledPages.filter(p => p !== currentUrl);
  const newSites = disabledSites.filter(s => s !== currentHost);
  
  // Remove current host from session disabled
  delete sessionDisabled[currentHost];
  
  await chrome.storage.local.set({ 
    disabledPages: newPages, 
    disabledSites: newSites,
    disabledUntil: 0,
    sessionDisabled
  });
  
  uiState.isDisabled = false;
  showPanel();
  showStatus("Alt-D re-enabled", "success");
}

function captureSelection() {
  const active = document.activeElement;

  if (isTextControl(active)) {
    const start = active.selectionStart ?? 0;
    const end = active.selectionEnd ?? 0;
    if (start === end) {
      return { ok: false, error: "Select text inside the field first." };
    }

    const value = active.value;
    const selectedText = value.slice(start, end);
    
    // If this is the first fix (no undo available) or user selected different text,
    // store as the original. If pressing Alt+D again on same location, keep original.
    if (!undoState.canUndo || 
        undoState.element !== active || 
        undoState.start !== start) {
      selectionState.originalText = selectedText;
    }
    
    selectionState.lastSelection = {
      kind: "text-control",
      element: active,
      start,
      end
    };

    return {
      ok: true,
      payload: {
        text: selectionState.originalText || selectedText,  // Always send original to AI
        context: value
      }
    };
  }

  const selection = window.getSelection();
  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0).cloneRange();
    const text = selection.toString();
    
    // Store original text on first fix
    if (!undoState.canUndo) {
      selectionState.originalText = text;
    }
    
    selectionState.lastSelection = {
      kind: "content-editable",
      range
    };

    return {
      ok: true,
      payload: {
        text: selectionState.originalText || text,  // Always send original to AI
        context: extractContext(range)
      }
    };
  }

  return { ok: false, error: "Highlight text(select following text) before pressing Alt+D." };
}

function applyReplacement(replacementText) {
  if (!replacementText) {
    showStatus("Groq returned an empty rewrite.", "error");
    return;
  }

  if (!selectionState.lastSelection) {
    showStatus("Cannot map rewrite back to the page.", "error");
    return;
  }

  const payload = selectionState.lastSelection;
  selectionState.lastSelection = null;

  if (payload.kind === "text-control") {
    const value = payload.element.value;
    
    // Store undo state (only on first fix, preserve original)
    if (!undoState.canUndo || undoState.element !== payload.element) {
      undoState.originalText = selectionState.originalText;
    }
    undoState.element = payload.element;
    undoState.start = payload.start;
    undoState.end = payload.start + replacementText.length;
    undoState.kind = "text-control";
    undoState.replacedLength = replacementText.length;
    undoState.canUndo = true;
    
    const next = value.slice(0, payload.start) + replacementText + value.slice(payload.end);
    payload.element.value = next;
    
    // Select the replaced text so user can press Alt+D again or see what changed
    payload.element.setSelectionRange(payload.start, payload.start + replacementText.length);
    payload.element.focus();
    payload.element.dispatchEvent(new Event("input", { bubbles: true }));
    
    showStatus("Fixed! Ctrl+Z to undo", "success");
    return;
  }

  if (payload.kind === "content-editable") {
    // Store undo state
    if (!undoState.canUndo) {
      undoState.originalText = selectionState.originalText;
    }
    undoState.kind = "content-editable";
    undoState.range = payload.range.cloneRange();
    undoState.replacedLength = replacementText.length;
    undoState.canUndo = true;
    
    const newNode = document.createTextNode(replacementText);
    payload.range.deleteContents();
    payload.range.insertNode(newNode);
    
    // Select the new text so user can see what changed
    const selection = window.getSelection();
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(newNode);
    selection.addRange(newRange);
    
    // Store reference to the new node for undo
    undoState.newNode = newNode;
    
    newNode.parentNode?.dispatchEvent(new Event("input", { bubbles: true }));
    
    showStatus("Fixed! Ctrl+Z to undo", "success");
    return;
  }
}

function isTextControl(element) {
  if (!element) {
    return false;
  }
  const tag = element.tagName?.toLowerCase();
  const invalidTypes = ["button", "submit", "checkbox", "radio", "file", "color", "range"];
  const acceptable = tag === "textarea" || (tag === "input" && !invalidTypes.includes(element.type));
  return acceptable && typeof element.selectionStart === "number";
}

function extractContext(range) {
  const contextLength = 240;
  const ancestorText = range.commonAncestorContainer?.textContent || document.body?.innerText || "";
  const selectionText = range.toString();
  const idx = ancestorText.indexOf(selectionText);
  if (idx === -1) {
    return selectionText;
  }
  const prefix = ancestorText.slice(Math.max(0, idx - contextLength), idx);
  const suffix = ancestorText.slice(idx + selectionText.length, idx + selectionText.length + contextLength);
  return `${prefix}[[ALT-D]]${suffix}`;
}

function showStatus(message, level = "success") {
  if (!message) {
    return;
  }
  const { statusText, panel } = ensurePanel();
  if (statusText) {
    statusText.textContent = message;
    statusText.dataset.level = level;
  }
  
  // Show/hide undo button based on undo availability
  if (panel) {
    const undoBtn = panel.querySelector(".alt-d-undo-btn");
    if (undoBtn) {
      undoBtn.style.display = undoState.canUndo ? "block" : "none";
    }
  }
  
  appendLog(message, level);
}

function ensurePanel() {
  if (!uiState.styleEl) {
    const style = document.createElement("style");
    style.textContent = `
      #alt-d-floating-panel{position:fixed;top:16px;right:16px;width:260px;max-height:320px;display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:16px;background:rgba(4,67,67,0.95);color:#e0f7f0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;box-shadow:0 12px 40px rgba(0,0,0,0.4);z-index:2147483646;backdrop-filter:blur(12px);transition:box-shadow 0.2s;border:1px solid rgba(180,255,100,0.15)}
      #alt-d-floating-panel.hidden{display:none}
      #alt-d-floating-panel.drag-mode{box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 0 2px rgba(57,255,20,0.5);cursor:grab}
      #alt-d-floating-panel.dragging{cursor:grabbing}
      #alt-d-floating-panel button{border:none;border-radius:10px;background:rgba(180,255,100,0.15);color:#e0f7f0;font-size:11px;padding:6px 10px;font-weight:600;cursor:pointer}
      #alt-d-floating-panel button:hover{background:rgba(57,255,20,0.25);color:#b4ff64}
      #alt-d-floating-panel .alt-d-panel-header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 0;margin:-4px 0 0 0;border-radius:8px;transition:background 0.15s}
      #alt-d-floating-panel .alt-d-title{font-size:14px;font-weight:700;display:flex;align-items:center;white-space:nowrap;color:#b4ff64}
      #alt-d-floating-panel .alt-d-panel-status{padding:8px 10px;border-radius:12px;background:rgba(57,255,20,0.15);font-weight:600;color:#b4ff64}
      #alt-d-floating-panel .alt-d-panel-status[data-level="error"]{background:rgba(255,107,107,0.2);color:#fecdd3}
      #alt-d-floating-panel .alt-d-panel-status[data-level="progress"]{background:rgba(249,168,37,0.2);color:#fef3c7}
      #alt-d-floating-panel .alt-d-panel-status[data-level="info"]{background:rgba(57,255,20,0.15);color:#b4ff64}
      #alt-d-floating-panel .alt-d-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center}
      #alt-d-floating-panel .alt-d-logs{display:flex;flex-direction:column;gap:4px;max-height:140px;overflow:auto;padding-right:4px}
      #alt-d-floating-panel .alt-d-log{padding:6px 8px;border-radius:10px;background:rgba(2,39,39,0.6);border:1px solid rgba(180,255,100,0.15);line-height:1.2}
      #alt-d-floating-panel .alt-d-log.error{border-color:rgba(255,107,107,0.6);color:#fecaca}
      #alt-d-floating-panel .alt-d-log.progress{border-color:rgba(251,191,36,0.6);color:#fef3c7}
      #alt-d-floating-panel .alt-d-meta{font-size:10px;color:#68a89a}
      #alt-d-floating-panel .alt-d-drag-hint{font-size:9px;color:#94d3c4;margin-left:6px;opacity:0.7;white-space:nowrap}
      #alt-d-floating-panel.drag-mode .alt-d-drag-hint{color:#39ff14;opacity:1}
      
      /* Undo button */
      #alt-d-floating-panel .alt-d-undo-btn{background:rgba(251,191,36,0.25);color:#fef3c7}
      #alt-d-floating-panel .alt-d-undo-btn:hover{background:rgba(251,191,36,0.4)}
      
      /* Minimize button with dropdown */
      .alt-d-minimize-wrap{position:relative}
      .alt-d-minimize-btn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;line-height:1;padding:0!important}
      .alt-d-disable-menu{position:absolute;top:100%;right:0;margin-top:6px;min-width:180px;background:rgba(4,67,67,0.98);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);padding:6px;opacity:0;visibility:hidden;transform:translateY(-8px);transition:all 0.15s ease;z-index:10;border:1px solid rgba(180,255,100,0.15)}
      .alt-d-minimize-wrap:hover .alt-d-disable-menu{opacity:1;visibility:visible;transform:translateY(0)}
      .alt-d-disable-menu button{width:100%;text-align:left;padding:8px 10px;margin:2px 0;border-radius:8px;font-size:11px}
      .alt-d-disable-menu button:hover{background:rgba(57,255,20,0.25)}
      
      /* Time submenu */
      .alt-d-time-menu{position:relative}
      .alt-d-time-submenu{position:absolute;left:100%;top:0;margin-left:6px;min-width:140px;background:rgba(4,67,67,0.98);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);padding:6px;opacity:0;visibility:hidden;transform:translateX(-8px);transition:all 0.15s ease;border:1px solid rgba(180,255,100,0.15)}
      .alt-d-time-menu:hover .alt-d-time-submenu{opacity:1;visibility:visible;transform:translateX(0)}
      .alt-d-time-submenu button{width:100%;text-align:left;padding:8px 10px;margin:2px 0}
      
      /* Minimized state - small pill */
      #alt-d-floating-panel.minimized{width:auto;max-height:none;padding:8px;border-radius:20px}
      #alt-d-floating-panel.minimized .alt-d-panel-header>div:first-child,
      #alt-d-floating-panel.minimized .alt-d-panel-status,
      #alt-d-floating-panel.minimized .alt-d-logs,
      #alt-d-floating-panel.minimized .alt-d-actions>button:not(.alt-d-minimize-btn){display:none}
      #alt-d-floating-panel.minimized .alt-d-actions{gap:0}
      #alt-d-floating-panel.minimized .alt-d-minimize-btn{width:24px;height:24px;font-size:14px}
    `;
    document.documentElement.appendChild(style);
    uiState.styleEl = style;
  }

  if (uiState.panel) {
    return uiState;
  }

  const panel = document.createElement("section");
  panel.id = "alt-d-floating-panel";
panel.innerHTML = `
    <div class="alt-d-panel-header">
        <div>
            <div class="alt-d-title">Alt-D <span class="alt-d-drag-hint">doubleclick 2 drag</span></div>
            <div class="alt-d-meta" style="font-size: 12.5px; margin-top: 6px; display: flex; align-items: center;">Powered by Groq 🪷</div>
        </div>
        <div class="alt-d-actions">
            <button type="button" data-action="run">Fix</button>
            <button type="button" data-action="undo" class="alt-d-undo-btn" style="display:none" title="Undo last fix (Ctrl+Z)">↩ Undo</button>
            <button type="button" data-action="options">Options</button>
            <button type="button" data-action="shortcuts">Shortcuts</button>
            <div class="alt-d-minimize-wrap">
                <button type="button" class="alt-d-minimize-btn" data-action="minimize" title="Minimize / Disable options">−</button>
                <div class="alt-d-disable-menu">
                    <button type="button" data-action="disable-session">Disable for this session (30m)</button>
                    <button type="button" data-action="disable-page">Disable for this page</button>
                    <button type="button" data-action="disable-site">Disable for this site</button>
                    <div class="alt-d-time-menu">
                        <button type="button">Disable everywhere for… ▸</button>
                        <div class="alt-d-time-submenu">
                            <button type="button" data-action="disable-time" data-minutes="1">1 minute</button>
                            <button type="button" data-action="disable-time" data-minutes="5">5 minutes</button>
                            <button type="button" data-action="disable-time" data-minutes="15">15 minutes</button>
                            <button type="button" data-action="disable-time" data-minutes="30">30 minutes</button>
                            <button type="button" data-action="disable-time" data-minutes="60">1 hour</button>
                            <button type="button" data-action="disable-time" data-minutes="180">3 hours</button>
                            <button type="button" data-action="disable-time" data-minutes="720">12 hours</button>
                            <button type="button" data-action="disable-time" data-minutes="1440">1 day</button>
                            <button type="button" data-action="disable-time" data-minutes="4320">3 days</button>
                            <button type="button" data-action="disable-time" data-minutes="10080">7 days</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="alt-d-panel-status" id="alt-d-status-text">Ready</div>
    <div class="alt-d-logs" id="alt-d-log-list"></div>
`;

  // Double-click drag functionality
  let isDragMode = false;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  // Double-click to toggle drag mode
  panel.addEventListener("dblclick", event => {
    // Don't activate drag mode if double-clicking on buttons
    if (event.target.closest("button")) {
      return;
    }
    
    isDragMode = !isDragMode;
    panel.classList.toggle("drag-mode", isDragMode);
    
    if (!isDragMode) {
      // Exiting drag mode - save position
      const rect = panel.getBoundingClientRect();
      chrome.storage.local.set({
        panelPosition: { left: rect.left, top: rect.top }
      });
    }
  });

  // Start dragging on mousedown when in drag mode
  panel.addEventListener("mousedown", event => {
    if (!isDragMode) return;
    if (event.target.closest("button")) return;
    
    isDragging = true;
    panel.classList.add("dragging");
    
    const rect = panel.getBoundingClientRect();
    dragOffset.x = event.clientX - rect.left;
    dragOffset.y = event.clientY - rect.top;
    
    event.preventDefault();
  });

  document.addEventListener("mousemove", event => {
    if (!isDragging) return;
    
    let newX = event.clientX - dragOffset.x;
    let newY = event.clientY - dragOffset.y;
    
    // Constrain to viewport
    const panelRect = panel.getBoundingClientRect();
    const maxX = window.innerWidth - panelRect.width;
    const maxY = window.innerHeight - panelRect.height;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    // Switch from right-based to left-based positioning when dragging
    panel.style.right = "auto";
    panel.style.left = newX + "px";
    panel.style.top = newY + "px";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      panel.classList.remove("dragging");
    }
  });

  // Click outside panel to exit drag mode
  document.addEventListener("click", event => {
    if (isDragMode && !panel.contains(event.target)) {
      isDragMode = false;
      panel.classList.remove("drag-mode");
      
      // Save position
      const rect = panel.getBoundingClientRect();
      chrome.storage.local.set({
        panelPosition: { left: rect.left, top: rect.top }
      });
    }
  });

  // Restore saved position
  chrome.storage.local.get("panelPosition").then(({ panelPosition }) => {
    if (panelPosition) {
      panel.style.right = "auto";
      panel.style.left = panelPosition.left + "px";
      panel.style.top = panelPosition.top + "px";
    }
  });

  panel.addEventListener("click", event => {
    const target = event.target.closest("button[data-action]");
    if (!target) {
      return;
    }
    const action = target.dataset.action;
    if (action === "run") {
      chrome.runtime.sendMessage({ type: "ALT_D_TRIGGER" });
    } else if (action === "undo") {
      undoAltDFix();
    } else if (action === "options") {
      chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
    } else if (action === "shortcuts") {
      chrome.runtime.sendMessage({ type: "OPEN_SHORTCUTS" });
    } else if (action === "minimize") {
      panel.classList.toggle("minimized");
    } else if (action === "disable-session") {
      disableForSession();
    } else if (action === "disable-page") {
      disableForPage();
    } else if (action === "disable-site") {
      disableForSite();
    } else if (action === "disable-time") {
      const minutes = parseInt(target.dataset.minutes, 10);
      if (minutes > 0) {
        disableForTime(minutes);
      }
    }
  });

  // Check disabled state on load
  checkDisabledState().then(isDisabled => {
    if (isDisabled) {
      panel.classList.add("hidden");
    }
  });

  document.documentElement.appendChild(panel);
  uiState.panel = panel;
  uiState.logList = panel.querySelector("#alt-d-log-list");
  uiState.statusText = panel.querySelector("#alt-d-status-text");
  return uiState;
}

function appendLog(message, level) {
  const { logList } = ensurePanel();
  if (!logList) {
    return;
  }
  const entry = document.createElement("div");
  entry.className = `alt-d-log ${level || "info"}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  entry.textContent = `[${timestamp}] ${message}`;
  logList.prepend(entry);
  while (logList.childElementCount > 6) {
    logList.lastElementChild?.remove();
  }
}

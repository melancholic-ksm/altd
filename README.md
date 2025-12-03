# Alt-D Smart Fix ✨

<div align="center">

![Alt-D Logo](https://img.shields.io/badge/Alt--D-Smart%20Fix-667eea?style=for-the-badge&logo=google-chrome&logoColor=white)
![Version](https://img.shields.io/badge/version-0.1.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Chrome](https://img.shields.io/badge/Chrome-MV3-yellow?style=for-the-badge&logo=googlechrome)

**A powerful Chrome extension that fixes grammar, vocabulary, and style with a single keyboard shortcut using AI.**

[🌐 Website](https://melancholic-ksm.github.io/altd) • [🐙 GitHub](https://github.com/melancholic-ksm/altd) • [📥 Download](https://github.com/melancholic-ksm/altd/archive/refs/heads/main.zip) • [🔑 Get Groq API Key](https://console.groq.com/keys) • [📖 Tutorial](https://melancholic-ksm.github.io/altd/tutorial.html)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Configuration](#%EF%B8%8F-configuration) • [Privacy](#-privacy) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## 🎯 What is Alt-D?

Alt-D Smart Fix is a Chrome extension that lets you **select any text** in any input field, textarea, or content-editable region, press **`Alt + D`**, and instantly rewrite it using state-of-the-art AI models from [Groq](https://groq.com).

Whether you're writing emails, crafting social media posts, coding documentation, or chatting — Alt-D helps you communicate more clearly and professionally in seconds.

### ✨ Key Highlights

- 🚀 **Instant fixes** — Select text, press Alt+D, done!
- 🤖 **Multiple AI models** — GPT-OSS 120B, Llama 3.3 70B, Qwen3 32B, Kimi K2, and more
- 🎨 **15+ tone presets** — Formal, casual, friendly, academic, playful, and more
- 🔒 **Privacy-first** — Your API key and text never leave your browser
- ⚡ **Smart fallback** — Automatically tries larger models if one fails
- 🌐 **Works everywhere** — Gmail, Twitter/X, LinkedIn, Google Docs, Slack, Discord, and any website

---

## 🌟 Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **One-Key Fix** | Select text → Press `Alt+D` → Text is fixed instantly |
| **Universal Support** | Works in inputs, textareas, contenteditable, and rich text editors |
| **Smart Context** | Sends surrounding context to AI for better understanding |
| **Inline Replacement** | Fixes are applied directly where you're typing |
| **Toast Notifications** | Visual feedback for success, errors, and progress |

### AI & Models

| Feature | Description |
|---------|-------------|
| **Dynamic Model List** | Auto-fetches available models from Groq API |
| **Smart Fallback** | If a model fails, automatically tries the next largest model |
| **Model Priority** | Sorts models by parameter size (120B → 70B → 32B → 8B) |
| **Cached Models** | 1-hour cache to reduce API calls |
| **Manual Refresh** | Force-refresh model list anytime |

### Customization

| Feature | Description |
|---------|-------------|
| **15+ Tone Presets** | Formal, Friendly, Concise, Playful, Academic, Casual, Persuasive, Empathetic, Confident, Creative, Technical, Enthusiastic, Neutral, Diplomatic |
| **3 Custom Tones** | Create your own tone instructions |
| **Tone Preview** | See exactly what prompt is sent to the AI |
| **Target Modes** | Toggle Grammar, Vocabulary, and Custom fixes |
| **Temperature Control** | Adjust AI creativity (0.0 - 1.0) |

### User Experience

| Feature | Description |
|---------|-------------|
| **Floating Panel** | Draggable status panel with minimize option |
| **Disable Options** | Disable for current page, entire site, or timed duration |
| **Auto-Save Settings** | Changes are saved automatically as you type |
| **Setup Tutorial** | Interactive guide for first-time setup |
| **Keyboard Shortcuts** | Fully customizable via Chrome settings |

---

## 📦 Installation

### From Source (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/melancholic-ksm/altd.git
   cd altd
   ```

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `altd` folder

3. **Set up keyboard shortcut**
   - Go to `chrome://extensions/shortcuts`
   - Find "Alt-D Smart Fix"
   - Click the pencil icon next to "Fix selected text"
   - Press `Alt + D` (or your preferred shortcut)

4. **Get your Groq API key**
   - Visit [console.groq.com](https://console.groq.com/keys)
   - Create a free account
   - Generate an API key
   - Paste it in Alt-D settings

### From Chrome Web Store

*Coming soon!*

---

## 🚀 Usage

### Basic Usage

1. **Select text** in any input field, textarea, or editable area
2. **Press `Alt + D`** (or your configured shortcut)
3. **Watch the magic** — your text is instantly improved!

### Examples

| Before | After (Formal tone) |
|--------|---------------------|
| "i dont no how too fix grammer" | "I don't know how to fix grammar." |
| "plz send me the docs asap thx" | "Please send me the documents at your earliest convenience. Thank you." |
| "the meeting was gud we talked bout stuff" | "The meeting was productive. We discussed several important topics." |

### Floating Panel

When you trigger Alt-D, a floating panel appears showing:
- Current status (Contacting model, processing, etc.)
- Model name and parameter size
- Minimize button with disable options

**Panel Controls:**
- **Double-click anywhere** — Enable drag mode
- **Click minimize (−)** — Show disable options
- **Disable for page** — Disable on current URL
- **Disable for site** — Disable on entire domain
- **Disable for time** — Disable for 15min/1hr/8hr

---

## ⚙️ Configuration

### Settings Page

Access settings via:
- Click the Alt-D extension icon → ⚙️ Settings
- Or right-click the icon → Options

### Available Settings

#### API Configuration
| Setting | Description | Default |
|---------|-------------|---------|
| **Groq API Key** | Your personal API key from Groq | *Required* |
| **Model** | AI model to use | GPT-OSS 120B |
| **Temperature** | Creativity level (0 = precise, 1 = creative) | 0.15 |

#### Fix Targets
| Setting | Description | Default |
|---------|-------------|---------|
| **Grammar** | Fix grammatical errors | ✅ Enabled |
| **Vocabulary** | Improve word choice | ✅ Enabled |
| **Custom** | Apply tone/style instructions | ✅ Enabled |

#### Tone Presets

**Standard Tones:**
- `Default` — No tone adjustment, just fix errors
- `Formal` — Professional, business-appropriate language
- `Friendly` — Warm, approachable communication
- `Concise` — Brief, to the point
- `Casual` — Relaxed, conversational

**Professional Tones:**
- `Academic` — Scholarly, precise language
- `Technical` — Domain-specific terminology
- `Persuasive` — Compelling, convincing
- `Diplomatic` — Tactful, balanced
- `Neutral` — Objective, impartial

**Expressive Tones:**
- `Playful` — Fun, witty
- `Enthusiastic` — Energetic, excited
- `Creative` — Vivid, imaginative
- `Empathetic` — Compassionate, caring
- `Confident` — Assertive, decisive

**Custom Tones:**
- `Custom 1-3` — Define your own instructions

---

## 🏗️ Project Structure

```
altd/
├── manifest.json           # Chrome extension manifest (MV3)
├── README.md               # Documentation
├── PRIVACY.md              # Privacy policy
├── LICENSE                 # MIT License
│
└── src/
    ├── background.js       # Service worker (API calls, model management)
    ├── contentScript.js    # Selection capture, floating panel, text replacement
    │
    ├── options.html        # Settings page
    ├── options.js          # Settings logic & auto-save
    ├── options.css         # Settings styles
    │
    ├── popup.html          # Toolbar popup
    ├── popup.js            # Popup logic
    ├── popup.css           # Popup styles
    │
    ├── tutorial.html       # Setup tutorial page
    ├── tutorial.js         # Tutorial navigation
    ├── tutorial.css        # Tutorial styles
    │
    ├── privacy.html        # Privacy policy page
    ├── privacy.css         # Privacy page styles
    │
    └── assets/             # Images for tutorial
        ├── find-extension.png
        ├── set-shortcut.png
        ├── groq-signup.png
        ├── create-api-key.png
        ├── copy-api-key.png
        └── paste-api-key.png
```

---

## 🔌 Technical Details

### API Integration

Alt-D uses the Groq API for AI processing:

**Endpoint:** `https://api.groq.com/openai/v1/chat/completions`

**Request Format:**
```json
{
  "model": "openai/gpt-oss-120b",
  "temperature": 0.15,
  "max_completion_tokens": 768,
  "messages": [
    {
      "role": "system",
      "content": "You are Alt-D, a precise text-editing assistant..."
    },
    {
      "role": "user", 
      "content": "[Selected text with context]"
    }
  ]
}
```

### Smart Fallback System

When a model fails (404, rate limit, overloaded), Alt-D automatically tries the next model sorted by parameter size:

```
1. User's selected model
2. 120B models (GPT-OSS 120B)
3. 100B models (Kimi K2)
4. 70B models (Llama 3.3 70B)
5. 50B models (Compound)
6. 32B models (Qwen3 32B)
7. 20B models (GPT-OSS 20B)
8. 8B models (Llama 3.1 8B)
```

### Permissions

| Permission | Reason |
|------------|--------|
| `storage` | Save settings and API key locally |
| `scripting` | Inject content script for text selection |
| `activeTab` | Access current tab for text replacement |
| `<all_urls>` | Work on any website |

---

## 🔒 Privacy

**Your privacy is our priority.** Alt-D is designed with privacy-first principles:

- ✅ **Local Storage Only** — API key stored in `chrome.storage.local`, never synced
- ✅ **No Tracking** — Zero analytics, telemetry, or user tracking
- ✅ **No Logs** — Text is never logged or stored
- ✅ **Direct API Calls** — Text goes directly to Groq, no intermediary servers
- ✅ **Open Source** — Full transparency, audit the code yourself

📄 **[Read Full Privacy Policy](https://melancholic-ksm.github.io/altd/privacy.html)** | **[PRIVACY.md](PRIVACY.md)**

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### 🐛 Bug Reports

- Check [existing issues](https://github.com/melancholic-ksm/altd/issues)
- Create a new issue with clear description
- Include steps to reproduce
- Add screenshots if applicable

### ✨ Pull Requests

- Fork the repository
- Create a feature branch
- Make your changes
- Test thoroughly
- Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/altd.git
cd altd

# Load in Chrome (see Installation)
# Make changes
# Test by reloading the extension
```

---

## 📋 Roadmap

- ☐ **History Panel** — Undo/redo previous fixes
- ☐ **Streaming Responses** — Faster perceived latency
- ☐ **Per-Site Overrides** — Custom settings for specific sites
- ☐ **Context Menu** — Right-click to fix text
- ☐ **Multiple Languages** — Support for non-English text
- ☐ **Chrome Web Store** — Official release

---

## ❓ FAQ

<details>
<summary><strong>Why isn't Alt+D working?</strong></summary>

Chrome may reserve `Alt+D` for the omnibox (address bar). Go to `chrome://extensions/shortcuts` and:
1. Find "Alt-D Smart Fix"
2. Set a different shortcut like `Alt+Shift+D` or `Ctrl+Shift+D`
</details>

<details>
<summary><strong>Is my API key safe?</strong></summary>

Yes! Your API key is stored only in `chrome.storage.local` on your device. It's never synced to the cloud or sent anywhere except directly to Groq's API.
</details>

<details>
<summary><strong>Which model should I use?</strong></summary>

- **GPT-OSS 120B** — Best quality, recommended default
- **Llama 3.3 70B** — Fast and capable
- **Qwen3 32B** — Good balance of speed and quality
- **Llama 3.1 8B** — Fastest, good for quick fixes
</details>

<details>
<summary><strong>Is Groq free?</strong></summary>

Yes! Groq offers free API access with generous rate limits. No credit card required.
</details>

<details>
<summary><strong>Does it work offline?</strong></summary>

No, Alt-D requires an internet connection to communicate with Groq's API.
</details>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 melancholic-ksm

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) — For providing fast, free AI inference
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/) — MV3 documentation
- All contributors and users!

---

<div align="center">

**Made with ❤️ by [melancholic-ksm](https://github.com/melancholic-ksm)**

⭐ Star this repo if you find it useful!

[🌐 Website](https://melancholic-ksm.github.io/altd) • [Report Bug](https://github.com/melancholic-ksm/altd/issues) • [Request Feature](https://github.com/melancholic-ksm/altd/issues) • [Contribute](https://github.com/melancholic-ksm/altd/pulls)

</div>

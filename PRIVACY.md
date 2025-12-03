# Privacy Policy for Alt-D Smart Fix

**Last Updated:** December 3, 2025

**Website:** [https://melancholic-ksm.github.io/altd](https://melancholic-ksm.github.io/altd)

---

## 🔒 Overview

Alt-D Smart Fix ("Alt-D", "we", "our", or "the extension") is committed to protecting your privacy. This privacy policy explains how we handle your data when you use our Chrome extension.

**TL;DR:** We don't collect, store, or share your personal data. Everything stays on your device.

---

## 📊 Data Collection

### What We DON'T Collect

- ❌ **Personal Information** — No names, emails, or identifiers
- ❌ **Browsing History** — We don't track what sites you visit
- ❌ **Analytics** — No Google Analytics, telemetry, or usage tracking
- ❌ **Your Text** — We never store the text you fix
- ❌ **Cookies** — We don't use tracking cookies

### What We DO Store (Locally Only)

The following data is stored **only on your device** using Chrome's `chrome.storage.local` API:

| Data | Purpose | Synced to Cloud? |
|------|---------|------------------|
| **Groq API Key** | Authenticate with Groq API | ❌ No |
| **Settings** | Model, temperature, tone preferences | ❌ No |
| **Model Cache** | Cache available models for 1 hour | ❌ No |
| **Disabled Pages/Sites** | Remember where you disabled Alt-D | ❌ No |

**Important:** We explicitly use `chrome.storage.local`, NOT `chrome.storage.sync`. Your data is never uploaded to Google's cloud sync servers.

---

## 🌐 Network Requests

### Groq API Calls

When you use Alt-D to fix text, the extension makes a direct API call to Groq:

**Endpoint:** `https://api.groq.com/openai/v1/chat/completions`

**Data Sent:**
- Your selected text (for processing)
- Surrounding context (for better understanding)
- Your API key (for authentication)
- Model and temperature settings

**Data NOT Sent:**
- Your identity or personal information
- Your browsing history
- Any data to third parties
- Any data to our servers (we don't have any!)

### Model List Fetching

To show available AI models, we fetch from:

**Endpoint:** `https://api.groq.com/openai/v1/models`

This only retrieves the list of available models and requires your API key for authentication.

---

## 🔐 API Key Security

Your Groq API key is:

- ✅ Stored only in `chrome.storage.local` on your device
- ✅ Never synced to the cloud
- ✅ Never sent to any server except Groq's API
- ✅ Never logged or stored by us
- ✅ Never shared with third parties

**Recommendation:** Treat your API key like a password. Don't share it publicly.

---

## 👁️ Permissions Explained

Alt-D requests the following Chrome permissions:

| Permission | Why We Need It | What We DON'T Do |
|------------|----------------|------------------|
| `storage` | Save your settings and API key locally | We don't sync or upload your data |
| `scripting` | Inject content script to detect text selection | We don't read pages you don't interact with |
| `activeTab` | Replace text in the current tab | We don't access other tabs |
| `<all_urls>` | Work on any website | We don't track your browsing |

---

## 🚫 What We'll Never Do

- ❌ **Sell Your Data** — We don't collect data, so there's nothing to sell
- ❌ **Track You** — No analytics, fingerprinting, or tracking pixels
- ❌ **Store Your Text** — Your writing stays private
- ❌ **Share with Third Parties** — No data sharing agreements
- ❌ **Use for Advertising** — No ads, ever

---

## 🔄 Third-Party Services

The only third-party service Alt-D uses is:

### Groq (groq.com)

- **Purpose:** AI model inference for text fixing
- **Data Shared:** Your selected text and API key
- **Their Privacy Policy:** [groq.com/privacy](https://groq.com/privacy)

We encourage you to review Groq's privacy policy to understand how they handle data sent to their API.

---

## 🌐 Website Privacy

This documentation website (melancholic-ksm.github.io/altd) also respects your privacy:

- ❌ **No Analytics** — We don't use Google Analytics or any tracking
- ❌ **No Cookies** — We don't set any cookies
- ❌ **No Data Collection** — We don't collect any visitor data
- ❌ **No Third-Party Scripts** — No trackers, pixels, or external scripts that monitor you
- ✅ **Static Hosting** — Hosted on GitHub Pages with no server-side processing

**TL;DR:** This website is a simple static site. We don't track, analyze, or collect any information about your visit.

---

## 👶 Children's Privacy

Alt-D is not intended for children under 13. We do not knowingly collect any information from children.

### View Your Data
All settings are visible in the Alt-D options page.

### Delete Your Data
1. Go to `chrome://extensions`
2. Find "Alt-D Smart Fix"
3. Click "Remove"
4. All local data is automatically deleted

---

## 📧 Contact

For privacy questions or concerns:

- 🐙 **GitHub:** [github.com/melancholic-ksm/altd](https://github.com/melancholic-ksm/altd)
- 🐛 **Issues:** [Report an issue](https://github.com/melancholic-ksm/altd/issues)

---

## ✅ Summary

| Question | Answer |
|----------|--------|
| Do you collect personal data? | No |
| Do you track browsing? | No |
| Do you store my text? | No |
| Is my API key safe? | Yes, local only |
| Do you share data? | No |
| Can I delete my data? | Yes, uninstall removes all |

---

<div align="center">

**Your privacy matters. Alt-D is built to respect it.**

[📖 Documentation](https://melancholic-ksm.github.io/altd) • [🚀 Tutorial](https://melancholic-ksm.github.io/altd/tutorial.html) • [🐙 GitHub](https://github.com/melancholic-ksm/altd) • [🏠 Portfolio](https://melancholic-ksm.github.io/)

</div>

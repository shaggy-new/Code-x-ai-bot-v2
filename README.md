# 🤖 Codex AI - WhatsApp Chatbot

WhatsApp chatbot powered by **Google Gemini AI** with **pair code login** (QR code oni nehe!).

- **Bot name:** Codex AI
- **Made by:** Nethum Akash
- **Library:** Baileys (`@whiskeysockets/baileys`)
- **AI:** Google Gemini (`gemini-2.0-flash`)

---

## 📋 Requirements

- **Node.js 20+** (Termux walatath weda karanawa)
- **Google Gemini API key** — free ganna: https://aistudio.google.com/app/apikey
- **WhatsApp account** + phone

---

## 🚀 Setup

### 1. Files extract karala folder ekata yanna
```bash
cd codex-ai-bot
```

### 2. Dependencies install karanna
```bash
npm install
```

> Termux eke nam: `pkg install nodejs git -y` issellama karanna.

### 3. `.env` file eka hadanna
```bash
cp .env.example .env
```

`.env` eka edit karala values danna:
```env
GEMINI_API_KEY=AIzaSy...your_real_key
PHONE_NUMBER=94771234567        # + nathuwa, country code ekka
BOT_NAME=Codex AI
OWNER_NAME=Nethum Akash
```

### 4. Bot eka start karanna
```bash
npm start
```

---

## 📱 Pair Code eken connect karana widiya

1. `npm start` gehuwama terminal eke **8-character pair code** ekak penewi (e.g. `ABCD-1234`)
2. Phone eke **WhatsApp** open karanna
3. Yanna: **Settings → Linked Devices → Link a Device**
4. Click **"Link with phone number instead"**
5. Terminal eke thibba code eka enter karanna
6. ✅ Connected! Dan mokak kiyapuwoth bot eka reply denawa.

---

## 💬 Use krna widiya

- **DM (private chat):** Ehema kiyapu hema messageyakatama reply denawa.
- **Group chat:** `!ai <prashnaya>` or `@bot <prashnaya>` kiyala kiyanna.

### Examples
```
You: kauda oyawa hadduwe?
Bot: Mawa hadala thiyenne Nethum Akash kiyana keneki 😊

You: write a python hello world
Bot: ```python
print("Hello, World!")
```
```

---

## 🔁 Logout / Reset

```bash
rm -rf auth_session
npm start
```

Aye pair code ekak enewi.

---

## 🌐 24/7 Run karanna (VPS / Cloud)

**PM2 use karanna:**
```bash
npm install -g pm2
pm2 start index.js --name codex-ai
pm2 save
pm2 startup
```

**Free hosting options:**
- Railway.app
- Render.com (background worker)
- Termux + phone (lightweight)
- Any VPS (Contabo, Hetzner, DigitalOcean)

---

## ⚠️ Notes

- `auth_session/` folder eka **gitignore karanna** (credentials thiyenne ehe)
- Multiple devices walin same number eken login karanna epa — banned wenna pulvan
- WhatsApp ToS follow karanna, spam karanna epa
- Gemini free tier: 15 requests/min, 1500/day

---

**Made with ❤️ by Nethum Akash**

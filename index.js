require('dotenv').config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const readline = require('readline');

// ===== Configuration =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PHONE_NUMBER = (process.env.PHONE_NUMBER || '').replace(/[^0-9]/g, '');
const BOT_NAME = process.env.BOT_NAME || 'Codex AI';
const OWNER_NAME = process.env.OWNER_NAME || 'Nethum Akash';

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY .env eke danna! https://aistudio.google.com/app/apikey');
  process.exit(1);
}
if (!PHONE_NUMBER) {
  console.error('❌ PHONE_NUMBER .env eke danna (e.g. 94771234567)');
  process.exit(1);
}

// ===== Gemini setup =====
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  systemInstruction: `Oyage nama "${BOT_NAME}". Oya WhatsApp eke chatbot kenek. Oyawa hadala thiyenne ${OWNER_NAME} kiyana keneki.
Kauda hedduwe / who made you / developer kauda wage prashnayak ahuwoth, oya kiyanna oni "${OWNER_NAME}" kiyala.
Sinhala/Singlish walin kiyapuwoth eka basaven uttara denna. English walin kiyapuwoth English walin uttara denna.
Pilithuru kelin, kemathi widiyata, emoji tikak ekka denna. Wedi pamak na.`,
});

// Per-chat conversation history
const chatSessions = new Map();
function getSession(jid) {
  if (!chatSessions.has(jid)) {
    chatSessions.set(jid, model.startChat({ history: [] }));
  }
  return chatSessions.get(jid);
}

// ===== Helpers =====
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

// ===== Main =====
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    browser: Browsers.macOS('Safari'),
    markOnlineOnConnect: true,
  });

  // Pair code request (only if not registered yet)
  if (!sock.authState.creds.registered) {
    console.log(`\n📱 Pair code illanawa number ekata: +${PHONE_NUMBER}`);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const code = await sock.requestPairingCode(PHONE_NUMBER);
      const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
      console.log('\n╔══════════════════════════════════════╗');
      console.log('║  WhatsApp Pair Code:                 ║');
      console.log(`║       ${formatted.padEnd(30)} ║`);
      console.log('╚══════════════════════════════════════╝');
      console.log('\n👉 WhatsApp > Settings > Linked Devices > Link a Device > Link with phone number');
      console.log('   Enuma code eka enter karanna.\n');
    } catch (e) {
      console.error('❌ Pair code ganna bari una:', e.message);
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log('🔌 Connection close. Reconnect?', shouldReconnect);
      if (shouldReconnect) startBot();
      else console.log('🚪 Logged out. auth_session folder eka delete karala aye start karanna.');
    } else if (connection === 'open') {
      console.log(`\n✅ ${BOT_NAME} connected! Owner: ${OWNER_NAME}`);
      console.log('💬 Messages walata reply denna ready...\n');
    }
  });

  // ===== Message handler =====
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;

        const jid = msg.key.remoteJid;
        if (!jid || jid === 'status@broadcast') continue;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          '';

        if (!text.trim()) continue;

        // Group eke nan @bot or !ai prefix oni (optional)
        const isGroup = jid.endsWith('@g.us');
        let userText = text.trim();
        if (isGroup) {
          const lower = userText.toLowerCase();
          if (lower.startsWith('!ai ')) userText = userText.slice(4).trim();
          else if (lower.startsWith('@bot ')) userText = userText.slice(5).trim();
          else continue; // group eke prefix nathiwa reply denne nehe
        }

        if (!userText) continue;

        console.log(`📩 ${jid}: ${userText.slice(0, 80)}`);
        await sock.sendPresenceUpdate('composing', jid);

        // Gemini ekata yawanawa
        const session = getSession(jid);
        let reply = '';
        try {
          const result = await session.sendMessage(userText);
          reply = result.response.text() || '🤖 (empty response)';
        } catch (e) {
          console.error('Gemini error:', e.message);
          reply = '⚠️ Aaa, mage AI brain eke prashnayak. Aye try karanna.';
          chatSessions.delete(jid); // reset session
        }

        await sock.sendMessage(jid, { text: reply }, { quoted: msg });
        await sock.sendPresenceUpdate('paused', jid);
        console.log(`📤 → ${reply.slice(0, 80)}`);
      } catch (err) {
        console.error('Message handle error:', err);
      }
    }
  });
}

startBot().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

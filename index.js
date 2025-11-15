const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const SESSION_FILE = 'session.json';

async function startBot() {
  const { state, saveState } = await useSingleFileAuthState(SESSION_FILE);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // Set to true if you want to print QR code in terminal
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log('✅ Bot connected to WhatsApp');

      // Auto-send welcome message to owner
      const ownerJid = config.ownerNumber[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      await sock.sendMessage(ownerJid, {
        text: '🤖 *Welcome to the bot!*\nSend `!hi` to get started 🚀',
      });
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log('❌ Connection closed. Reason:', reason);

      if (reason !== DisconnectReason.loggedOut) {
        console.log('🔄 Reconnecting...');
        startBot();
      } else {
        console.log('❌ Logged out. Removing session...');
        fs.unlinkSync(SESSION_FILE);
      }
    }
  });

  sock.ev.on('creds.update', saveState);

  // Load commands
  const commands = new Map();
  const commandFiles = fs.readdirSync(path.join(__dirname, 'commands'));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
  }

  // Handle messages
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const jid = msg.key.remoteJid;

    let text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      msg.message.ephemeralMessage?.message?.extendedTextMessage?.text ||
      '';

    if (!text || !text.startsWith(config.prefix)) return;

    const args = text.trim().split(/ +/).slice(1);
    const commandName = text
      .trim()
      .split(/ +/)[0]
      .slice(config.prefix.length)
      .toLowerCase();
    const command = commands.get(commandName);

    if (command) {
      try {
        await command.execute(sock, jid, msg, args, config);
      } catch (e) {
        console.error(e);
        await sock.sendMessage(jid, { text: '❌ Command Error' });
      }
    }
  });
}

startBot();

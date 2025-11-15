// const {
//   default: makeWASocket,
//   useMultiFileAuthState,
//   DisconnectReason,
// } = require("@whiskeysockets/baileys");
// const fs = require("fs");
// const path = require("path");
// const QRCode = require("qrcode"); // ✅ for web
// const express = require("express");
// const config = require("./config");

// const app = express();
// const PORT = 3000;

// let qrDataUrl = ""; // Will hold the current QR code

// async function startBot() {
//   // ✅ Single session folder
//   const SESSION_FOLDER = "session";
//   if (!fs.existsSync(SESSION_FOLDER)) {
//     fs.mkdirSync(SESSION_FOLDER);
//   }

//   const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
//   const sock = makeWASocket({ auth: state });

//   // Handle QR code + connection updates
//   sock.ev.on("connection.update", async (update) => {
//     const { qr, connection, lastDisconnect } = update;

//     if (qr) {
//       qrDataUrl = await QRCode.toDataURL(qr);
//       console.log("📲 New QR code generated, scan from frontend");
//     }

//     if (connection === "open") {
//       console.log("✅ Bot connected to WhatsApp");

//       // Auto-send welcome message to your own number
//       const ownerJid =
//         config.ownerNumber[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
//       await sock.sendMessage(ownerJid, {
//         text: "🤖 *Welcome to the bot!*\n\nSend `!hi` to get started 🚀",
//       });
//     }

//     if (connection === "close") {
//       const reason = lastDisconnect?.error?.output?.statusCode;
//       console.log("❌ Connection closed. Reason:", reason);

//       if (reason !== DisconnectReason.loggedOut) {
//         console.log("🔄 Reconnecting...");
//         startBot(); // restart automatically
//       } else {
//         console.log("❌ Logged out. Cleaning session...");
//         fs.rmSync(SESSION_FOLDER, { recursive: true, force: true }); // 🧹 auto-remove old session
//       }
//     }
//   });

//   sock.ev.on("creds.update", saveCreds);

//   // Load commands
//   const commands = new Map();
//   const commandFiles = fs.readdirSync(path.join(__dirname, "commands"));
//   for (const file of commandFiles) {
//     const command = require(`./commands/${file}`);
//     commands.set(command.name, command);
//   }

//   // Handle messages
//   sock.ev.on("messages.upsert", async ({ messages }) => {
//     const msg = messages[0];
//     if (!msg.message) return;

//     const jid = msg.key.remoteJid;

//     // ✅ Normalize text from all message types
//     let text =
//       msg.message.conversation ||
//       msg.message.extendedTextMessage?.text ||
//       msg.message.imageMessage?.caption ||
//       msg.message.videoMessage?.caption ||
//       msg.message.ephemeralMessage?.message?.extendedTextMessage?.text ||
//       "";

//     if (!text || !text.startsWith(config.prefix)) return;

//     const args = text.trim().split(/ +/).slice(1);
//     const commandName = text
//       .trim()
//       .split(/ +/)[0]
//       .slice(config.prefix.length)
//       .toLowerCase();
//     const command = commands.get(commandName);

//     if (command) {
//       try {
//         await command.execute(sock, jid, msg, args, config);
//       } catch (e) {
//         console.error(e);
//         await sock.sendMessage(jid, { text: "❌ Command Error" });
//       }
//     }
//   });
// }

// // ✅ Express route to serve QR code page
// app.get("/", (req, res) => {
//   res.send(`
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Orpheus v1 | Ultimate Whatsapp Bot</title>
//       <script src="https://cdn.tailwindcss.com"></script>
//       <style>
//         /* ❄️ Snowflakes */
//         .snowflake {
//           position: fixed;
//           top: -10px;
//           color: white;
//           font-size: 1em;
//           user-select: none;
//           pointer-events: none;
//           animation: fall linear forwards;
//         }
//         @keyframes fall {
//           0% { transform: translateY(0) rotate(0deg); opacity: 1; }
//           100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
//         }
//         /* Timer Bar */
//         #timerBar {
//           height: 8px;
//           background: linear-gradient(to right, #10b981, #22d3ee);
//           border-radius: 9999px;
//           width: 100%;
//           transform-origin: left;
//           transform: scaleX(1);
//           transition: transform 10s linear;
//         }
//       </style>
//     </head>
//     <body class="bg-gray-900 flex items-center justify-center min-h-screen relative overflow-hidden">
      
//       <!-- 🎥 Background Video -->
//       <video autoplay muted loop playsinline class="absolute w-full h-full object-cover blur-lg">
//         <source src="https://files.catbox.moe/67cn97.mp4" type="video/mp4">
//       </video>
      
//       <!-- Overlay -->
//       <div class="absolute inset-0 bg-black/60"></div>
      
//       <!-- Content -->
//       <div class="relative z-10 bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
//         <h1 class="text-2xl font-bold text-green-400 mb-4"> Orpheus v1</h1>
        
//         ${
//           qrDataUrl
//             ? `
//               <img src="${qrDataUrl}" class="mx-auto w-64 h-64 border-4 border-green-500 rounded-lg shadow-lg" />
//               <div class="mt-4">
//                 <div id="timerBar"></div>
//                 <p class="mt-2 text-gray-300">QR expires in 10 seconds ⏳</p>
//               </div>
//               <button onclick="location.reload()" 
//                 class="mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition">
//                  Reload Page
//               </button>
//             `
//             : `
//               <div class="flex flex-col items-center">
//                 <div class="w-16 h-16 border-4 border-green-500 border-dashed rounded-full animate-spin"></div>
//                 <p class="mt-4 text-gray-400">Waiting for QR...</p>
//               </div>
//             `
//         }
        
//         <p class="text-gray-500 text-sm mt-4">Keep this page open while scanning the QR.</p>
//       </div>

//       <!-- ❄️ Snowflake Effect -->
//       <script>
//         function createSnowflake() {
//           const snowflake = document.createElement("div");
//           snowflake.classList.add("snowflake");
//           snowflake.textContent = "❄";
//           snowflake.style.left = Math.random() * window.innerWidth + "px";
//           snowflake.style.fontSize = Math.random() * 14 + 10 + "px";
//           snowflake.style.animationDuration = (Math.random() * 5 + 5) + "s";
//           document.body.appendChild(snowflake);
//           setTimeout(() => snowflake.remove(), 10000);
//         }
//         setInterval(createSnowflake, 200);

//         // Animate Timer Bar
//         window.onload = () => {
//           const bar = document.getElementById("timerBar");
//           if (bar) {
//             bar.style.transform = "scaleX(0)";
//           }
//         };
//       </script>
//     </body>
//     </html>
//   `);
// });




// app.listen(PORT, () => {
//   console.log(`🌐 QR code page running at http://localhost:${PORT}`);
// });

// startBot();
const {
  default: makeWASocket,
  useSingleFileAuthState,
  DisconnectReason,
  generatePairingCode,
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const config = require("./config");

const SESSION_FILE = "session.json";

async function startBot() {
  const { state, saveState } = await useSingleFileAuthState(SESSION_FILE);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // we won't use QR terminal
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    // ✅ If session not paired yet, generate pair code
    if (!state.creds) {
      const code = generatePairingCode();
      console.log("🔑 Pairing code (single use, 30s):", code.code);
      console.log("Open WhatsApp > Linked Devices > Link a Device > Enter code above");
    }

    if (connection === "open") {
      console.log("✅ Bot connected to WhatsApp");

      // Auto-send welcome message to owner
      const ownerJid =
        config.ownerNumber[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      await sock.sendMessage(ownerJid, {
        text: "🤖 *Welcome to the bot!*\n\nSend `!hi` to get started 🚀",
      });
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Connection closed. Reason:", reason);

      if (reason !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnecting...");
        startBot();
      } else {
        console.log("❌ Logged out. Removing session...");
        fs.unlinkSync(SESSION_FILE);
      }
    }
  });

  sock.ev.on("creds.update", saveState);

  // Load commands
  const commands = new Map();
  const commandFiles = fs.readdirSync(path.join(__dirname, "commands"));
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
  }

  // Handle messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const jid = msg.key.remoteJid;

    let text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      msg.message.ephemeralMessage?.message?.extendedTextMessage?.text ||
      "";

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
        await sock.sendMessage(jid, { text: "❌ Command Error" });
      }
    }
  });
}

startBot();

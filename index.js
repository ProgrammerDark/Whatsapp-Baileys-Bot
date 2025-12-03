const { WhatsAppClient, ConnMessage } = require("easy-baileys");
const log = require("pino");
const env = require("dotenv");
env.config();

const customOptions = {
  browser: ["Ubuntu", "Chrome", "20.0.04"],
  printQRInTerminal: true, // Set to true for QR code in terminal
  mobile: false,
};
const phoneNumber = process.env.PHONE_NUMBER || "";

async function main() {
  try {
    // Initialize WhatsAppClient with MongoDB authentication
    const clientMongo = await WhatsAppClient.create(
      "mongo",
      process.env.MONGODB_URI,
      customOptions
    );
    const sockMongo = await clientMongo.getSocket();

    // async function sendPairingCode(){
    //     const code = await clientMongo.getPairingCode(phoneNumber);
    //     log().info(`Pairing Code: ${code}`);
    // }

    sockMongo.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'connecting') {
        log().info('Connecting to WhatsApp...');
      }
      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect.error?.output?.statusCode !==
          ConnMessage.loggedOut;
        log().info(
          `Connection closed due to ${lastDisconnect.error}, reconnecting: ${shouldReconnect}`,
        );
        // reconnect if not logged out
        if (shouldReconnect) {
          main();
        }
      } else if (connection === "open") {
        log().info(
          "Connected successfully to WhatsApp with MongoDB authentication!"
        );
        // Example event listener for incoming messages
        sockMongo.ev.on("messages.upsert", async ({ messages }) => {
          for (const m of messages) {
            console.log(m);
            if (m.message?.conversation.toLowerCase() === "hi") {
              await sockMongo.reply(m, "Hello! 👋");
              sockMongo.sendImage();
            }
          }
        });
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Error initializing WhatsApp client with MongoDB authentication:",
        error.message
      );
    } else {
      console.error(
        "Error initializing WhatsApp client with MongoDB authentication:",
        error
      );
    }
  }
}

main();

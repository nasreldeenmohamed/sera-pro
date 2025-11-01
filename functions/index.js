const { onRequest } = require("firebase-functions/v2/https");
const next = require("next");
const path = require("path");

// Initialize Next.js app
// In production, Next.js will look for the .next folder in the parent directory
const app = next({
  dev: false,
  conf: {
    distDir: path.join(__dirname, "../.next"),
  },
});

const handle = app.getRequestHandler();

let appPrepared = false;

exports.nextjsServer = onRequest(
  {
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "1GiB",
    region: "us-central1",
  },
  async (req, res) => {
    // Prepare the app only once
    if (!appPrepared) {
      await app.prepare();
      appPrepared = true;
    }
    return handle(req, res);
  }
);


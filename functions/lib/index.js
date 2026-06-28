"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeBookByDanacodeFunc = void 0;
const https_1 = require("firebase-functions/v2/https");
const scrapeBookByDanacode_1 = require("./scrapeBookByDanacode");
/**
 * Cloud Function: scrapeBookByDanacode
 *
 * HTTP endpoint that accepts a danacode and returns scraped book data.
 * Supports CORS for browser requests from the frontend.
 *
 * Usage:
 *   GET  ?danacode=800-261003
 *   POST { "danacode": "800-261003" }
 */
exports.scrapeBookByDanacodeFunc = (0, https_1.onRequest)({ cors: true, timeoutSeconds: 30, region: "europe-west1" }, async (req, res) => {
    try {
        // Extract danacode from query param (GET) or body (POST)
        const danacode = req.query.danacode ||
            req.body?.danacode ||
            "";
        if (!danacode.trim()) {
            res.status(400).json({ error: "Missing danacode parameter" });
            return;
        }
        console.log(`scrapeBookByDanacode called with: ${danacode}`);
        const result = await (0, scrapeBookByDanacode_1.fetchBookByDanacode)(danacode);
        if (!result) {
            res.status(404).json({ error: "No book found for this danacode", data: null });
            return;
        }
        res.status(200).json({ data: result });
    }
    catch (err) {
        console.error("scrapeBookByDanacode error:", err);
        res.status(500).json({
            error: "Internal server error",
            message: err instanceof Error ? err.message : "Unknown error",
        });
    }
});
//# sourceMappingURL=index.js.map
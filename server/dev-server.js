import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import creativeImageHandler from "../api/gemini/creative-image.js";
import creativeImageSimpleHandler from "../api/gemini/creative-image-simple.js";

const app = express();
// Use Heroku's dynamic port or fallback to API_PORT or default
const port = process.env.PORT ? Number(process.env.PORT) : (process.env.API_PORT ? Number(process.env.API_PORT) : 3002);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.join(__dirname, "..", "api");

// Load environment variables
const envLocalPath = path.join(__dirname, "..", ".env.local");
dotenv.config({ path: envLocalPath });
dotenv.config();

if (!process.env.FAL_API_KEY) {
  console.warn("FAL_API_KEY is not set. Image generation endpoints will return configuration errors.");
}

// Allow large payloads for base64-encoded assets
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cors());

const wrapApiHandler = (handler, routeName) => async (req, res, next) => {
  try {
    await handler(req, res);
    if (!res.headersSent) {
      next();
    }
  } catch (error) {
    console.error(`Error executing handler for ${routeName}:`, error);
    next(error);
  }
};

// Direct wiring for image endpoints (avoids dynamic import churn during dev)
app.all(
  "/api/gemini/creative-image",
  wrapApiHandler(creativeImageHandler, "gemini/creative-image")
);

app.all(
  "/api/gemini/creative-image-simple",
  wrapApiHandler(creativeImageSimpleHandler, "gemini/creative-image-simple")
);

// Fallback dynamic API route handler
app.use("/api", async (req, res) => {
  try {
    const relativePath = req.path.replace(/^\//, "");
    const candidatePath = path.join(apiRoot, relativePath);
    let filePath = `${candidatePath}.js`;

    if (!fs.existsSync(filePath)) {
      filePath = path.join(candidatePath, "index.js");
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `API route ${req.originalUrl} not found.` });
    }

    console.log(`Loading API handler from: ${filePath}`);

    // Convert Windows path to file URL format
    const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;

    // Add timestamp to bypass module cache
    const importUrl = `${fileUrl}?t=${Date.now()}`;

    try {
      // Import the module
      console.log(`Attempting to import: ${importUrl}`);
      const module = await import(importUrl);
      console.log(`Module imported, keys:`, Object.keys(module));

      const handler = module.default || module.handler;

      if (typeof handler !== 'function') {
        console.error(`No valid handler function found in ${filePath}`);
        console.error(`Module keys:`, Object.keys(module));
        return res.status(500).json({ error: `API route ${req.originalUrl} is misconfigured.` });
      }

      console.log(`Executing handler for ${req.originalUrl}`);
      // Execute the handler
      await handler(req, res);
      console.log(`Handler executed successfully for ${req.originalUrl}`);

    } catch (importError) {
      console.error(`Error importing/executing module for ${req.originalUrl}:`, importError.message);
      console.error('Full error:', importError);
      console.error('Stack:', importError.stack);

      // Try to provide helpful error info
      if (importError.message.includes('Cannot find module')) {
        const missingModule = importError.message.match(/'([^']+)'/)?.[1];
        return res.status(500).json({
          error: "Module import error",
          details: process.env.NODE_ENV === 'development' ? `Missing module: ${missingModule}` : undefined
        });
      }

      throw importError;
    }

  } catch (error) {
    console.error(`Error executing API route ${req.originalUrl}:`, error);
    console.error('Stack trace:', error.stack);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

// Centralized error handler for API routes
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error("Unhandled API error:", err);
  res.status(500).json({
    error: "Internal server error.",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Serve static files from dist directory in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  // Serve index.html for all non-API routes (SPA routing)
  app.get('/*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(404).json({ error: "API endpoint not found" });
    }
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`GEMINI_API_KEY loaded: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`FAL_API_KEY loaded: ${process.env.FAL_API_KEY ? 'Yes' : 'No'}`);
});

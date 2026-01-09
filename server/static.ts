import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  // In production (bundled to dist/index.cjs), __dirname will be 'dist'
  // We need to serve from dist/public which is in the same directory
  const currentDir = typeof __dirname !== 'undefined' 
    ? __dirname 
    : path.dirname(fileURLToPath(import.meta.url));
  
  // If we're in dist/, public is at dist/public (sibling)
  // If we're in server/, we need to go up to root then to dist/public
  let distPath = path.resolve(currentDir, "public");
  
  // If that doesn't exist, try from project root
  if (!fs.existsSync(distPath)) {
    distPath = path.resolve(currentDir, "..", "dist", "public");
  }
  
  console.log(`[STATIC] Current directory: ${currentDir}`);
  console.log(`[STATIC] Attempting to serve from: ${distPath}`);
  console.log(`[STATIC] Directory exists: ${fs.existsSync(distPath)}`);
  
  if (!fs.existsSync(distPath)) {
    // List what's in the current directory for debugging
    const files = fs.readdirSync(currentDir);
    console.error(`[STATIC] Files in ${currentDir}:`, files);
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }
  
  console.log(`[STATIC] ✓ Serving static files from: ${distPath}`);

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      // Ensure correct MIME types for JavaScript modules
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

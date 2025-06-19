import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  // Intentar cargar la configuración local primero
  let viteConfigPath = path.resolve(rootDir, "vite.config.active.ts");
  
  // Si no existe, usar la configuración local o la original según disponibilidad
  if (!fs.existsSync(viteConfigPath)) {
    const localPath = path.resolve(rootDir, "vite.config.local.ts");
    const originalPath = path.resolve(rootDir, "vite.config.ts");
    
    viteConfigPath = fs.existsSync(localPath) ? localPath : originalPath;
  }

  const viteConfig = (await import(viteConfigPath)).default;
  
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        rootDir,
        "client",
        "index.html",
      );

      // siempre recarga el archivo index.html en caso de cambios
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      
      // Generar un identificador único para el caché en lugar de usar nanoid
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8);
      const uniqueId = `${timestamp}-${random}`;
      
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${uniqueId}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
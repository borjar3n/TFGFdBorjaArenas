import express from "express";
import { log } from "./local-vite";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./local-vite";

// Carga de variables de entorno
// En entornos de producción, deberás instalar dotenv con: npm install dotenv
const loadEnv = async () => {
  try {
    const dotenvModule = await import('dotenv').catch(() => null);
    if (dotenvModule) {
      dotenvModule.config();
      console.log('Variables de entorno cargadas desde .env');
    } else {
      console.log('Dotenv no disponible, usando variables de entorno del sistema');
    }
  } catch (error) {
    console.log('Error al cargar variables de entorno:', error);
  }
};

async function main() {
  // Cargar variables de entorno
  await loadEnv();
  
  const isDev = process.env.NODE_ENV !== "production";
  const app = express();

  // Configuración básica
  app.use(express.json());

  // Registrar rutas API y obtener el servidor HTTP
  const server = await registerRoutes(app);

  if (isDev) {
    // Modo desarrollo: usar Vite para servir el frontend
    await setupVite(app, server);
  } else {
    // Modo producción: servir archivos estáticos compilados
    serveStatic(app);
  }

  // Manejo global de errores
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).send("Error interno del servidor");
  });

  // Determinar puerto
  const port = process.env.PORT || 5000;

  // Iniciar servidor
  server.listen(parseInt(String(port)), "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
}

main().catch((e) => {
  console.error("Error al iniciar la aplicación:", e);
  process.exit(1);
});
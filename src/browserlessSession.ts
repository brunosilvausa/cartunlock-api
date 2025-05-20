// src/browserlessSession.ts
import dotenv from 'dotenv';
dotenv.config();

const BROWSERLESS_URL = process.env.BROWSERLESS_URL;
const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

export const iniciarSessaoRemota = async (targetUrl: string): Promise<string | null> => {
  const script = `
    const puppeteer = require('puppeteer');

    module.exports = async ({ browser, context }) => {
      const page = await context.newPage();

      // Configurações do fingerprint
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/113.0.0.0 Safari/537.36');
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR' });

      await page.goto('${targetUrl}', { waitUntil: 'networkidle0', timeout: 60000 });

      await page.waitForTimeout(5000);

      return await page.content();
    };
  `;

  try {
    const response = await fetch(`${BROWSERLESS_URL}/puppeteer?token=${BROWSERLESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: script })
    });

    if (!response.ok) {
     const errorText = await response.text();
     console.error("Erro Browserless:", response.status, errorText);
     return null;
  }

    return await response.text();
  } catch (error) {
    console.error("Erro inesperado:", error);
    return null;
  }
};

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SESSION_DURATIONS = {
  quick: 1,
  extended: 4,
  premium: 8,
} as const;

// 🔁 Criar sessão via VPS (Docker) e salvar no Supabase
app.post("/api/create-session", async (req, res) => {
  const { user_id, site } = req.body;

  if (!user_id || !site || !(site in SESSION_DURATIONS)) {
    return res.status(400).json({ error: "Missing or invalid user_id or site" });
  }

  const durationHours = SESSION_DURATIONS[site as keyof typeof SESSION_DURATIONS];
  const expires_at = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  // 🔌 Chama a API do VPS para iniciar container
  try {
    const vpsResponse = await fetch("http://31.97.15.103:4000/start-session", {
      method: "POST",
    });

    if (!vpsResponse.ok) {
      console.error("Erro ao chamar VPS:", await vpsResponse.text());
      return res.status(500).json({ error: "Erro ao iniciar sessão no VPS" });
    }

    const { url } = await vpsResponse.json();

    const slug = `${site}-${Date.now()}`;
    const session_url = url;

    const { error } = await supabase.from("sessions").insert([
      {
        user_id,
        site,
        slug,
        session_url,
        status: "active",
        expires_at,
        proxy_region: "US",
      },
    ]);

    if (error) {
      console.error("Erro ao salvar no Supabase:", error);
      return res.status(500).json({ error });
    }

    return res.status(200).json({ session_url, slug });
  } catch (err) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ error: "Erro ao criar sessão remota" });
  }
});

// ✅ Serve frontend build do React
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));

// ✅ Fallback SPA (React Router)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const port = process.env.PORT || 4000;
app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on port ${port}`);
});

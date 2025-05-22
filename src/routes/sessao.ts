import express from "express";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

router.post("/create-session", async (req, res) => {
  const { user_id, site } = req.body;

  if (!user_id || !site) {
    return res.status(400).json({ error: "Missing user_id or site" });
  }

  try {
    console.log("📥 Recebido:", { user_id, site });

    // 🔁 Chama o launcher para iniciar a sessão e obter a porta
    const VPS_URL = "https://sessao1.cartunlock.com/start-session";
    console.log("🌐 Chamando VPS:", VPS_URL);

    const response = await fetch(VPS_URL, { method: "POST" });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Erro na resposta da VPS:", text);
      return res.status(500).json({ error: "Erro ao chamar o servidor VPS" });
    }

    const { porta } = await response.json();
    console.log("📦 Porta retornada pela VPS:", porta);

    // 🔧 Usa subdomínio + porta dinâmica
    const slug = `${site}-${Date.now()}`;
    const session_url = `https://sessao1.cartunlock.com:${porta}`;
    const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    console.log("🔖 Slug:", slug);
    console.log("🌍 URL da sessão:", session_url);

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
      console.error("❌ Erro ao salvar sessão no Supabase:", error);
      return res.status(500).json({ error: "Erro ao salvar sessão no banco" });
    }

    console.log("✅ Sessão criada com sucesso:", { slug, session_url });

    return res.status(200).json({ session_url, slug });
  } catch (err) {
    console.error("❌ Erro inesperado ao criar sessão:", err);
    return res.status(500).json({ error: "Erro interno ao criar sessão" });
  }
});

export default router;

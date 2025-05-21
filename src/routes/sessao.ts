// src/routes/session.ts
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
    const response = await fetch("http://31.97.15.103:4000/start-session", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Erro ao chamar VPS");
    }

    const { url, porta } = await response.json();

    const slug = `${site}-${Date.now()}`;
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);

    const { error } = await supabase.from("sessions").insert([
      {
        user_id,
        site,
        slug,
        session_url: url,
        status: "active",
        expires_at,
        proxy_region: "US",
      },
    ]);

    if (error) {
      console.error("Erro Supabase:", error);
      return res.status(500).json({ error });
    }

    return res.status(200).json({ session_url: url });
  } catch (err) {
    console.error("Erro:", err);
    return res.status(500).json({ error: "Erro ao criar sessão remota" });
  }
});

export default router;

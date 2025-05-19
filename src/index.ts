import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import { createClient } from "@supabase/supabase-js"

const app = express()
app.use(cors())
app.use(express.json())

// Corrigir __dirname para ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SESSION_DURATIONS = {
  quick: 1,
  extended: 4,
  premium: 8,
} as const

app.post("/create-session", async (req, res) => {
  const { user_id, site } = req.body

  if (!user_id || !site || !(site in SESSION_DURATIONS)) {
    return res.status(400).json({ error: "Missing or invalid user_id or site" })
  }

  const durationHours = SESSION_DURATIONS[site as keyof typeof SESSION_DURATIONS]
  const expires_at = new Date(Date.now() + durationHours * 60 * 60 * 1000)

  const slug = `${site}-${Date.now()}`
  const session_url = `https://session.cartunlock.com/${slug}`

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
  ])

  if (error) return res.status(500).json({ error })

  return res.status(200).json({ session_url })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`API listening on port ${port}`)
})

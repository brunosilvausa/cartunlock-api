import express from "express"
import cors from "cors"
import { createClient } from "@supabase/supabase-js"

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

app.post("/create-session", async (req, res) => {
  const { user_id, site } = req.body

  if (!user_id || !site) {
    return res.status(400).json({ error: "Missing user_id or site" })
  }

  const fakeSessionUrl = `https://session.cartunlock.com/${site}-${Date.now()}`

  const { error } = await supabase.from("sessions").insert([
    {
      user_id,
      site,
      session_url: fakeSessionUrl,
      status: "active",
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    },
  ])

  if (error) return res.status(500).json({ error })

  return res.json({ session_url: fakeSessionUrl })
})

app.get("/", (req, res) => {
  res.send("CartUnlock API online.")
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`API listening on port ${port}`)
})

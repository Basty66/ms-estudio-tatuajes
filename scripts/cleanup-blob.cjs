const BASE = "https://tatuajes-azure.vercel.app"
const PASSWORD = process.env.ADMIN_PASSWORD_TEST

async function main() {
  const login = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
  })
  const d = await login.json()
  const headers = { "content-type": "application/json", authorization: `Bearer ${d.token}` }

  const url = "https://m2iojbhq2qiqhz5y.public.blob.vercel-storage.com/reels/1785723995883-protocol-test.mp4"
  const c = await fetch(`${BASE}/api/admin/reels`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url, titulo: "limpieza", plataforma: "video", video_url: url }),
  }).then((r) => r.json())

  if (!c.reel?.id) {
    console.error("NO SE PUDO CREAR EL REEL TEMPORAL:", JSON.stringify(c))
    process.exit(1)
  }
  console.log("CREADO id", c.reel.id)

  await fetch(`${BASE}/api/admin/reels?id=${c.reel.id}`, { method: "DELETE", headers })
    .then((r) => r.json())
    .then((x) => console.log("BORRADO", JSON.stringify(x)))

  await new Promise((r) => setTimeout(r, 1500))
  const b = await fetch(url)
  console.log("BLOB:", b.status === 404 ? "ELIMINADO OK" : `AUN EXISTE (${b.status})`)
}

main().catch((e) => {
  console.error("ERROR:", e.message)
  process.exit(1)
})

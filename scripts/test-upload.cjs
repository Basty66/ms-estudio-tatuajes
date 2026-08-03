const { upload } = require("@vercel/blob/client")

const BASE = "https://tatuajes-azure.vercel.app"
const PASSWORD = process.env.ADMIN_PASSWORD_TEST

async function main() {
  const login = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
  })
  const loginData = await login.json()
  if (!loginData.token) {
    console.error("LOGIN FALLIDO:", JSON.stringify(loginData))
    process.exit(1)
  }
  console.log("1. Login OK")

  const headers = { "content-type": "application/json", authorization: `Bearer ${loginData.token}` }

  const fakeVideo = new Blob(["fake-mp4-content-protocol-v2"], { type: "video/mp4" })
  const blob = await upload(`reels/${Date.now()}-protocol-test.mp4`, fakeVideo, {
    access: "public",
    handleUploadUrl: `${BASE}/api/admin/blob-upload`,
    headers,
  })
  console.log("2. SUBIDA CON upload()+handleUploadUrl OK:", blob.url)

  const before = await fetch(blob.url)
  console.log("3. BLOB DISPONIBLE:", before.status)

  const create = await fetch(`${BASE}/api/admin/reels`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: blob.url, titulo: "test protocolo v2", plataforma: "video", video_url: blob.url }),
  })
  const createData = await create.json()
  if (!createData.success) {
    console.error("CREAR REEL FALLIDO:", JSON.stringify(createData))
    process.exit(1)
  }
  console.log("4. REEL CREADO OK: id", createData.reel.id)

  const delReel = await fetch(`${BASE}/api/admin/reels?id=${createData.reel.id}`, { method: "DELETE", headers })
  console.log("5. BORRAR REEL:", JSON.stringify(await delReel.json()))

  await new Promise((r) => setTimeout(r, 1500))
  const after = await fetch(blob.url)
  console.log("6. BLOB DESPUES:", after.status === 404 ? "ELIMINADO OK" : `AUN EXISTE (${after.status})`)
}

main().catch((e) => {
  console.error("ERROR:", e.message)
  process.exit(1)
})

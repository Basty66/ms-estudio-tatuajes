import { neon } from "@neondatabase/serverless"

export const config = { runtime: "edge" }

function checkAuth(request: Request): boolean {
  const auth = request.headers.get("authorization")
  const token = auth?.replace("Bearer ", "")
  const decoded = token ? atob(token) : ""
  return decoded === process.env.ADMIN_PASSWORD
}

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const url = new URL(request.url)
    const resumen = url.searchParams.get("resumen")

    if (resumen === "true") {
      const totals = await sql`
        SELECT
          COALESCE(SUM(monto) FILTER (WHERE tipo = 'ingreso'), 0)::int as total_ingresos,
          COALESCE(SUM(monto) FILTER (WHERE tipo = 'gasto'), 0)::int as total_gastos,
          COALESCE(SUM(monto) FILTER (WHERE tipo = 'ingreso'), 0)::int - COALESCE(SUM(monto) FILTER (WHERE tipo = 'gasto'), 0)::int as neto,
          COALESCE(SUM(monto) FILTER (WHERE tipo = 'gasto' AND categoria = 'insumos'), 0)::int as gasto_insumos,
          COALESCE(SUM(monto) FILTER (WHERE tipo = 'gasto' AND categoria = 'porcentaje'), 0)::int as gasto_porcentaje,
          COALESCE(SUM(monto) FILTER (WHERE tipo = 'gasto' AND categoria = 'arriendo'), 0)::int as gasto_arriendo
        FROM finanzas
      `

      const porCategoria = await sql`
        SELECT tipo, categoria, SUM(monto)::int as total, COUNT(*)::int as cantidad
        FROM finanzas
        GROUP BY tipo, categoria ORDER BY tipo, total DESC
      `

      const ultimos = await sql`
        SELECT f.*, a.nombre as cliente_nombre
        FROM finanzas f
        LEFT JOIN agendamentos a ON f.agendamiento_id = a.id
        ORDER BY f.created_at DESC LIMIT 10
      `

      return Response.json({ success: true, ...totals[0], porCategoria, ultimos })
    }

    const transactions = await sql`
      SELECT f.*, a.nombre as cliente_nombre
      FROM finanzas f
      LEFT JOIN agendamentos a ON f.agendamiento_id = a.id
      ORDER BY f.created_at DESC
    `
    return Response.json({ success: true, transactions })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al obtener finanzas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const { tipo, categoria, concepto, monto, fecha, agendamiento_id } = await request.json()

    if (!tipo || !categoria || !concepto || !monto) {
      return Response.json({ success: false, error: "Campos requeridos: tipo, categoria, concepto, monto" }, { status: 400 })
    }
    if (!["ingreso", "gasto"].includes(tipo)) {
      return Response.json({ success: false, error: "tipo debe ser ingreso o gasto" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    const result = await sql`
      INSERT INTO finanzas (tipo, categoria, concepto, monto, fecha, agendamiento_id)
      VALUES (${tipo}, ${categoria}, ${concepto}, ${parseInt(monto)}, ${fecha || new Date().toISOString().split("T")[0]}, ${agendamiento_id || null})
      RETURNING *
    `

    return Response.json({ success: true, transaction: result[0] })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al crear registro" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!checkAuth(request)) {
    return Response.json({ success: false, error: "No autorizado" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return Response.json({ success: false, error: "ID requerido" }, { status: 400 })
    }

    const sql = neon(process.env.NEON_DATABASE_URL!)
    await sql`DELETE FROM finanzas WHERE id = ${parseInt(id)}`
    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: "Error al eliminar" }, { status: 500 })
  }
}

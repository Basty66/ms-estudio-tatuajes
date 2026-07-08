export interface PrecioEstimado {
  minimo: number
  maximo: number
}

export function calcularEstimacion(tamano: string, estilo: string): PrecioEstimado {
  let minBase = 0
  let maxBase = 0
  let extraEstilo = 0

  switch (tamano) {
    case "pequeno":
      minBase = 25000
      maxBase = 40000
      break
    case "mediano":
      minBase = 45000
      maxBase = 80000
      break
    case "grande":
      minBase = 85000
      maxBase = 140000
      break
    case "manga":
      minBase = 140000
      maxBase = 220000
      break
    default:
      minBase = 25000
      maxBase = 40000
  }

  switch (estilo) {
    case "realismo":
      extraEstilo = 15000
      break
    case "color":
      extraEstilo = 10000
      break
    case "lettering":
    case "fineline":
    default:
      extraEstilo = 0
  }

  return {
    minimo: minBase + extraEstilo,
    maximo: maxBase + extraEstilo,
  }
}

export function formatPrecio(valor: number): string {
  return "$" + valor.toLocaleString("es-CL") + " CLP"
}

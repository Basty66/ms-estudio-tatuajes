export interface PrecioEstimado {
  minimo: number
  maximo: number
}

export function calcularEstimacion(tamano: string, zona: string, estilo: string): PrecioEstimado {
  let minBase = 0
  let maxBase = 0
  let extraEstilo = 0
  let extraZona = 1.0

  switch (tamano) {
    case "pequeno": minBase = 25000; maxBase = 45000; break
    case "mediano": minBase = 50000; maxBase = 90000; break
    case "grande": minBase = 90000; maxBase = 150000; break
    case "manga": minBase = 150000; maxBase = 250000; break
    default: minBase = 25000; maxBase = 45000
  }

  switch (estilo) {
    case "realismo": extraEstilo = 20000; break
    case "color": extraEstilo = 15000; break
    case "lettering": case "fineline": default: extraEstilo = 0
  }

  // Zonas mas complejas cuestan mas
  switch (zona) {
    case "costillas": case "espalda": case "pecho": extraZona = 1.3; break
    case "cuello": case "mano": case "codo": extraZona = 1.2; break
    case "pierna": case "muslo": extraZona = 1.1; break
    default: extraZona = 1.0
  }

  return {
    minimo: Math.round((minBase + extraEstilo) * extraZona),
    maximo: Math.round((maxBase + extraEstilo) * extraZona),
  }
}

export function formatPrecio(valor: number): string {
  return "$" + valor.toLocaleString("es-CL") + " CLP"
}

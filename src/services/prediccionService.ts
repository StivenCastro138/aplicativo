import { LECHUGAS_ENDPOINTS } from "../config/api"
import { truchasService, lechugasService } from "./apiService" // Importamos los servicios para usar datos en línea

// 🚧 URL temporal para no romper el historial de truchas mientras se programa en Python
const LEGACY_API_URL = "http://192.168.1.111:5100";
const LEGACY_TRUCHAS_RANGE = `${LEGACY_API_URL}/api/truchas/range`;
const LEGACY_TRUCHAS_DIARIO = `${LEGACY_API_URL}/api/graphics/truchas/diario-ultimo`;

// Datos de referencia para calibración del modelo de truchas
const DATOS_REFERENCIA_TRUCHAS = [
  { meses: 0, longitud: 2.5 },
  { meses: 1, longitud: 5.0 },
  { meses: 2, longitud: 8.0 },
  { meses: 3, longitud: 12.0 },
  { meses: 4, longitud: 20.0 },
  { meses: 5, longitud: 32.5 },
  { meses: 6, longitud: 40.0 },
  { meses: 7, longitud: 46.5 },
  { meses: 8, longitud: 52.5 },
]

// Función para hacer fetch con timeout mejorado
const fetchWithTimeout = async (url: string, timeout = 15000) => {
  try {
    console.log(`🔄 Fetching Historial: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (typeof error === "object" && error !== null && "name" in error && (error as any).name === "AbortError") {
      console.error(`⏰ Timeout fetching ${url}`)
      throw new Error("Timeout: La solicitud tardó demasiado")
    }
    console.error(`❌ Error fetching ${url}:`, error)
    throw error
  }
}

// Función para validar y limpiar números de forma ULTRA ROBUSTA
const validarNumero = (valor: any, defaultValue = 0): number => {
  if (valor === null || valor === undefined || valor === "" || valor === "null" || valor === "undefined") {
    return defaultValue
  }
  const num = Number(valor)
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue
  }
  return num
}

// Función para obtener datos por rango de días y calcular promedios diarios
const obtenerDatosPorDias = async (endpoint: string, diasAtras = 30) => {
  const promediosPorDia: { [dia: number]: number[] } = {}
  const segundosPorDia = 86400

  console.log(`📅 Obteniendo datos de los últimos ${diasAtras} días...`)

  for (let dia = 0; dia < diasAtras; dia++) {
    const startSeconds = dia * segundosPorDia
    const endSeconds = (dia + 1) * segundosPorDia
    const url = `${endpoint}?startSeconds=${startSeconds}&endSeconds=${endSeconds}`

    try {
      const datosDelDia = await fetchWithTimeout(url, 5000)

      if (Array.isArray(datosDelDia) && datosDelDia.length > 0) {
        const valores = datosDelDia
          .map((item: any) => {
            let valor = 0
            if (typeof item === "number") {
              valor = item
            } else if (item && typeof item === "object") {
              valor =
                item.longitudCm ||
                item.temperaturaC ||
                item.conductividadUsCm ||
                item.pH ||
                item.alturaCm ||
                item.areaFoliarCm2 ||
                item.humedadPorcentaje ||
                item.value ||
                0
            }
            return validarNumero(valor, 0)
          })
          .filter((v) => v > 0)

        if (valores.length > 0) {
          promediosPorDia[dia] = valores
        }
      }
    } catch (error) {
      // Continuar silenciosamente
    }
  }

  const promediosFinales: number[] = []
  const diasConDatos: number[] = []

  Object.keys(promediosPorDia).forEach((diaStr) => {
    const dia = Number.parseInt(diaStr)
    const valores = promediosPorDia[dia]

    if (valores && valores.length > 0) {
      const promedio = valores.reduce((sum, val) => sum + val, 0) / valores.length
      const promedioValido = validarNumero(promedio, 0)
      if (promedioValido > 0) {
        promediosFinales.push(promedioValido)
        diasConDatos.push(dia)
      }
    }
  })

  return {
    valores: promediosFinales,
    dias: diasConDatos,
    totalDias: promediosFinales.length,
  }
}

export const regresionLineal = (x: number[], y: number[]) => {
  if (!Array.isArray(x) || !Array.isArray(y)) {
    throw new Error("Los datos deben ser arrays")
  }

  if (x.length !== y.length || x.length < 2) {
    throw new Error("Datos insuficientes para regresión")
  }

  const xValidos = x.map((val) => validarNumero(val, 0)).filter((val) => val !== 0)
  const yValidos = y.map((val) => validarNumero(val, 0)).filter((val) => val !== 0)

  if (xValidos.length < 2 || yValidos.length < 2) {
    throw new Error("No hay suficientes datos válidos para regresión")
  }

  const minLength = Math.min(xValidos.length, yValidos.length)
  const xFinal = xValidos.slice(0, minLength)
  const yFinal = yValidos.slice(0, minLength)

  const n = xFinal.length
  const sumX = xFinal.reduce((a, b) => validarNumero(a, 0) + validarNumero(b, 0), 0)
  const sumY = yFinal.reduce((a, b) => validarNumero(a, 0) + validarNumero(b, 0), 0)
  const sumXY = xFinal.reduce(
    (sum, xi, i) => validarNumero(sum, 0) + validarNumero(xi, 0) * validarNumero(yFinal[i], 0),
    0,
  )
  const sumXX = xFinal.reduce((sum, xi) => validarNumero(sum, 0) + validarNumero(xi, 0) * validarNumero(xi, 0), 0)

  const denominator = n * sumXX - sumX * sumX
  if (Math.abs(denominator) < 1e-10) {
    throw new Error("No se puede calcular la regresión (datos linealmente dependientes)")
  }

  const slope = validarNumero((n * sumXY - sumX * sumY) / denominator, 0)
  const intercept = validarNumero((sumY - slope * sumX) / n, 0)

  const yMean = sumY / n
  let ssRes = 0
  let ssTot = 0

  for (let i = 0; i < n; i++) {
    const predicted = validarNumero(slope * xFinal[i] + intercept, 0)
    const actual = validarNumero(yFinal[i], 0)

    ssRes += Math.pow(actual - predicted, 2)
    ssTot += Math.pow(actual - yMean, 2)
  }

  const r2 = validarNumero(ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0, 0)

  return {
    slope: validarNumero(slope, 0),
    intercept: validarNumero(intercept, 0),
    r2: validarNumero(r2, 0),
  }
}

const optimizarVonBertalanffy = (
  datosObservados: any[],
  modeloFuncion: Function,
  parametrosIniciales: number[],
  datosReferencia?: any[],
) => {
  let mejoresParametros = [...parametrosIniciales]
  let menorError = Number.POSITIVE_INFINITY

  const intentos = 5
  const iteracionesPorIntento = 150

  for (let intento = 0; intento < intentos; intento++) {
    let parametrosActuales =
      intento === 0 ? [...parametrosIniciales] : parametrosIniciales.map((p) => p * (0.3 + Math.random() * 1.4))

    for (let iter = 0; iter < iteracionesPorIntento; iter++) {
      const factorAjuste = 0.08 * (1 - iter / iteracionesPorIntento)
      const parametrosPrueba = parametrosActuales.map((p, i) => {
        const ajuste = (Math.random() - 0.5) * factorAjuste * Math.abs(p || 0.1)
        return p + ajuste
      })

      parametrosPrueba[0] = Math.max(parametrosPrueba[0], 15)
      parametrosPrueba[1] = Math.max(parametrosPrueba[1], -15)
      parametrosPrueba[1] = Math.min(parametrosPrueba[1], 15)

      try {
        let errorTotal = 0
        let conteoValido = 0

        for (const dato of datosObservados) {
          const valorPredicho = modeloFuncion(dato.tiempo, parametrosPrueba, dato)
          const valorReal = dato.valorObservado

          if (!isNaN(valorPredicho) && !isNaN(valorReal) && valorPredicho > 0 && valorReal > 0) {
            const error = Math.pow(valorReal - valorPredicho, 2)
            errorTotal += error
            conteoValido++
          }
        }

        if (datosReferencia && datosReferencia.length > 0) {
          for (const ref of datosReferencia) {
            const tiempoRef = ref.meses * 30
            const valorPredicho = modeloFuncion(tiempoRef, parametrosPrueba, {
              temperatura: 15.0, conductividad: 550, ph: 7.5, oxigeno: 8.0, humedad: 65,
            })

            if (!isNaN(valorPredicho) && valorPredicho > 0) {
              const error = Math.pow(ref.longitud - valorPredicho, 2)
              errorTotal += error * 3
              conteoValido++
            }
          }
        }

        if (conteoValido > 0) {
          const errorPromedio = errorTotal / conteoValido
          if (errorPromedio < menorError) {
            menorError = errorPromedio
            mejoresParametros = [...parametrosPrueba]
            parametrosActuales = [...parametrosPrueba]
          }
        }
      } catch (error) {
        continue
      }
    }
  }

  let sumaCuadradosTotal = 0
  let sumaCuadradosResiduos = 0
  let conteoR2 = 0
  let sumaValores = 0

  for (const dato of datosObservados) {
    if (dato.valorObservado > 0) {
      sumaValores += dato.valorObservado
      conteoR2++
    }
  }

  const mediaObservada = conteoR2 > 0 ? sumaValores / conteoR2 : 0

  for (const dato of datosObservados) {
    if (dato.valorObservado > 0) {
      const valorPredicho = modeloFuncion(dato.tiempo, mejoresParametros, dato)
      if (!isNaN(valorPredicho) && valorPredicho > 0) {
        sumaCuadradosTotal += Math.pow(dato.valorObservado - mediaObservada, 2)
        sumaCuadradosResiduos += Math.pow(dato.valorObservado - valorPredicho, 2)
      }
    }
  }

  const r2 = sumaCuadradosTotal > 0 ? Math.max(0, Math.min(1, 1 - sumaCuadradosResiduos / sumaCuadradosTotal)) : 0

  return {
    coeficientes: mejoresParametros,
    error: menorError,
    r2: r2,
  }
}

const modeloVonBertalanffyTruchas = (tiempo: number, coeficientes: number[], datos: any) => {
  const [L_infinito, t0, beta0, beta1, beta2, beta3, beta4] = coeficientes
  const temp = datos.temperatura || datos.temperaturaC || 15.0
  const o2 = datos.oxigeno || 8.0
  const cond = datos.conductividad || datos.conductividadUsCm || 550
  const ph = datos.ph || datos.pH || 7.5

  const k = Math.abs(beta0) + Math.abs(beta1) * Math.max(0, (temp - 10) / 10.0) + Math.abs(beta2) * Math.max(0, o2 / 10.0) + Math.abs(beta3) * Math.max(0, (cond - 200) / 500.0) + Math.abs(beta4) * Math.max(0, (ph - 6.5) / 2.0)
  const kAjustado = Math.max(0.002, Math.min(0.15, k))
  const exponente = -kAjustado * (tiempo - t0)

  if (exponente > 50) return L_infinito * 0.999
  if (exponente < -50) return 0.5
  const resultado = L_infinito * (1 - Math.exp(exponente))
  return Math.max(0.5, Math.min(L_infinito, resultado))
}

const modeloExponencialAltura = (tiempo: number, coeficientes: number[], datos: any) => {
  const [H_infinito, t0, beta0, beta1, beta2, beta3] = coeficientes.map((c) => validarNumero(c, 0))
  const temp = validarNumero(datos.temperatura || datos.temperaturaC, 22.0)
  const hum = validarNumero(datos.humedad || datos.humedadPorcentaje, 65.0)
  const ph = validarNumero(datos.ph || datos.pH, 6.5)

  const k = Math.abs(beta0) + Math.abs(beta1) * Math.max(0, (temp - 15) / 15.0) + Math.abs(beta2) * Math.max(0, (hum - 40) / 40.0) + Math.abs(beta3) * Math.max(0, (ph - 5.5) / 2.5)
  const kAjustado = validarNumero(Math.max(0.005, Math.min(0.25, k)), 0.05)
  const exponente = validarNumero(-kAjustado * (tiempo - t0), 0)

  if (exponente > 50) return validarNumero(H_infinito * 0.999, H_infinito)
  if (exponente < -50) return 0.2
  const resultado = validarNumero(H_infinito * (1 - Math.exp(exponente)), 0.2)
  return Math.max(0.2, Math.min(validarNumero(H_infinito, 50), resultado))
}

const modeloExponencialArea = (tiempo: number, coeficientes: number[], datos: any) => {
  const [A_infinito, t0, beta0, beta1, beta2, beta3] = coeficientes.map((c) => validarNumero(c, 0))
  const temp = validarNumero(datos.temperatura || datos.temperaturaC, 22.0)
  const hum = validarNumero(datos.humedad || datos.humedadPorcentaje, 65.0)
  const ph = validarNumero(datos.ph || datos.pH, 6.5)

  const k = Math.abs(beta0) * 1.3 + Math.abs(beta1) * Math.max(0, (temp - 15) / 15.0) + Math.abs(beta2) * Math.max(0, (hum - 40) / 40.0) + Math.abs(beta3) * Math.max(0, (ph - 5.5) / 2.5)
  const kAjustado = validarNumero(Math.max(0.008, Math.min(0.35, k)), 0.08)
  const exponente = validarNumero(-kAjustado * (tiempo - t0), 0)

  if (exponente > 50) return validarNumero(A_infinito * 0.999, A_infinito)
  if (exponente < -50) return 0.5
  const resultado = validarNumero(A_infinito * (1 - Math.exp(exponente)), 0.5)
  return Math.max(0.5, Math.min(validarNumero(A_infinito, 500), resultado))
}

export const prediccionTruchasService = {
  obtenerDatosHistoricos: async () => {
    try {
      // 🚧 Usa el fallback antiguo para no romperse
      const datosLongitud = await obtenerDatosPorDias(LEGACY_TRUCHAS_RANGE, 30)
      if (datosLongitud.valores.length < 5) throw new Error("No hay suficientes días con datos de longitud")

      return {
        tiempos: datosLongitud.dias,
        longitudes: datosLongitud.valores,
        totalRegistros: datosLongitud.totalDias,
      }
    } catch (error) {
      throw new Error(`No se pudieron obtener los datos históricos de truchas`)
    }
  },

  realizarPrediccion: async (dias: number) => {
    const diasValidos = validarNumero(dias, 1)
    if (diasValidos <= 0 || diasValidos > 1000) throw new Error("El número de días debe estar entre 1 y 1000")

    const datos = await prediccionTruchasService.obtenerDatosHistoricos()
    if (datos.longitudes.length < 5) throw new Error("No hay suficientes datos para realizar la predicción")

    const { slope, intercept, r2 } = regresionLineal(datos.tiempos, datos.longitudes)
    const tiempoActual = Math.max(...datos.tiempos)
    const tiempoFuturo = tiempoActual + diasValidos
    const longitudActual = datos.longitudes[datos.longitudes.length - 1]

    let longitudPrediccion = validarNumero(slope * tiempoFuturo + intercept, longitudActual)
    if (diasValidos > 100) {
      const factorMax = 1 + diasValidos * 0.001
      longitudPrediccion = Math.min(longitudPrediccion, longitudActual * factorMax)
    }

    const crecimientoEsperado = validarNumero(longitudPrediccion - longitudActual, 0)

    return {
      diasPrediccion: diasValidos,
      longitudActual: validarNumero(longitudActual, 0),
      longitudPrediccion: Math.max(validarNumero(longitudPrediccion, longitudActual), longitudActual),
      crecimientoEsperado: Math.max(crecimientoEsperado, 0),
      tasaCrecimiento: validarNumero(slope * diasValidos, 0),
      r2: validarNumero(r2, 0),
      totalRegistros: datos.totalRegistros,
    }
  },
}

export const prediccionLechugasService = {
  obtenerDatosHistoricos: async () => {
    try {
      const response = await fetchWithTimeout(LECHUGAS_ENDPOINTS.diarioUltimo)
      if (!response || typeof response !== "object") throw new Error("Respuesta inválida del servidor")

      let datosHistoricos = []
      if (response.datos && Array.isArray(response.datos)) datosHistoricos = response.datos
      else if (Array.isArray(response)) datosHistoricos = response

      if (datosHistoricos.length < 5) throw new Error(`Se necesitan al menos 5 días de datos`)

      const datosParaModelo = datosHistoricos
        .map((registro: any, index: number) => ({
          dia: validarNumero(registro.dia || registro.day || index, index),
          altura: validarNumero(registro.alturaCm || registro.altura || registro.height, 0),
          areaFoliar: validarNumero(registro.areaFoliarCm2 || registro.areaFoliar || registro.area, 0),
          temperatura: validarNumero(registro.temperaturaC || registro.temperatura || registro.temp, 22.0),
          humedad: validarNumero(registro.humedadPorcentaje || registro.humedad || registro.humidity, 65.0),
          ph: validarNumero(registro.pH || registro.ph, 6.5),
          timestamp: registro.timestamp || new Date().toISOString(),
        }))
        .filter((d: { altura: number; areaFoliar: number }) => d.altura > 0 && d.areaFoliar > 0 && d.altura < 200 && d.areaFoliar < 2000)
        .sort((a: { dia: number }, b: { dia: number }) => a.dia - b.dia)

      if (datosParaModelo.length === 0) throw new Error("No se encontraron datos válidos después del filtrado")

      const tiempos = datosParaModelo.map((d: { dia: number }) => validarNumero(d.dia, 0))
      const alturas = datosParaModelo.map((d: { altura: number }) => validarNumero(d.altura, 0))
      const areas = datosParaModelo.map((d: { areaFoliar: number }) => validarNumero(d.areaFoliar, 0))
      const ultimoDato = datosParaModelo[datosParaModelo.length - 1]

      return {
        tiempos, alturas, areas,
        totalRegistros: datosParaModelo.length,
        datosCompletos: datosParaModelo,
        alturaActual: validarNumero(ultimoDato.altura, 0),
        areaActual: validarNumero(ultimoDato.areaFoliar, 0),
        diaActual: validarNumero(ultimoDato.dia, 0),
      }
    } catch (error) {
      throw new Error(`No se pudieron obtener los datos históricos de lechugas`)
    }
  },

  realizarPrediccion: async (dias: number) => {
    try {
      const diasValidos = validarNumero(dias, 1)
      if (diasValidos <= 0 || diasValidos > 1000) throw new Error("El número de días debe estar entre 1 y 1000")

      const datos = await prediccionLechugasService.obtenerDatosHistoricos()
      if (datos.alturas.length < 5 || datos.areas.length < 5) throw new Error("No hay suficientes datos para realizar la predicción")

      const regresionAltura = regresionLineal(datos.tiempos, datos.alturas)
      const regresionArea = regresionLineal(datos.tiempos, datos.areas)

      const tiempoActual = validarNumero(datos.diaActual, 0)
      const tiempoFuturo = tiempoActual + diasValidos
      const alturaActual = validarNumero(datos.alturaActual, 0)
      const areaActual = validarNumero(datos.areaActual, 0)

      let alturaPrediccion = validarNumero(regresionAltura.slope * tiempoFuturo + regresionAltura.intercept, alturaActual)
      let areaPrediccion = validarNumero(regresionArea.slope * tiempoFuturo + regresionArea.intercept, areaActual)

      if (diasValidos > 100) {
        const factorAltura = Math.min(3.0, 1 + diasValidos * 0.002)
        const factorArea = Math.min(5.0, 1 + diasValidos * 0.003)
        alturaPrediccion = Math.min(alturaPrediccion, alturaActual * factorAltura)
        areaPrediccion = Math.min(areaPrediccion, areaActual * factorArea)
      }

      alturaPrediccion = Math.max(alturaPrediccion, alturaActual)
      areaPrediccion = Math.max(areaPrediccion, areaActual)

      const crecimientoAlturaEsperado = validarNumero(alturaPrediccion - alturaActual, 0)
      const crecimientoAreaEsperado = validarNumero(areaPrediccion - areaActual, 0)

      return {
        diasPrediccion: diasValidos,
        alturaActual: validarNumero(alturaActual, 0),
        alturaPrediccion: validarNumero(alturaPrediccion, alturaActual),
        areaFoliarActual: validarNumero(areaActual, 0),
        areaFoliarPrediccion: validarNumero(areaPrediccion, areaActual),
        crecimientoAlturaEsperado: Math.max(crecimientoAlturaEsperado, 0),
        crecimientoAreaEsperado: Math.max(crecimientoAreaEsperado, 0),
        r2Altura: validarNumero(regresionAltura.r2, 0),
        r2Area: validarNumero(regresionArea.r2, 0),
        totalRegistros: datos.totalRegistros,
      }
    } catch (error) {
      throw new Error(`Error en predicción de lechugas`)
    }
  },
}

export const prediccionAvanzadaTruchasService = {
  obtenerDatosHistoricos: async () => {
    try {
      // 🚧 Usa el fallback antiguo
      const response = await fetchWithTimeout(LEGACY_TRUCHAS_DIARIO)
      if (!response.datos || !Array.isArray(response.datos)) throw new Error("Formato de respuesta inválido")

      const datosHistoricos = response.datos
      if (datosHistoricos.length < 10) throw new Error(`No hay suficientes días con datos`)

      const datosParaModelo = datosHistoricos
        .map((registro: any) => ({
          tiempo: registro.tiempoDias || registro.dia || 0,
          valorObservado: Number(registro.longitudCm) || 0,
          temperatura: Number(registro.temperaturaC) || 15.0,
          conductividad: Number(registro.conductividadUsCm) || 550,
          ph: Number(registro.pH) || 7.5,
          oxigeno: 8.0,
          timestamp: registro.timestamp,
          dia: registro.dia,
        }))
        .filter((d: { valorObservado: number }) => d.valorObservado > 0 && d.valorObservado < 100)
        .sort((a: { tiempo: number }, b: { tiempo: number }) => a.tiempo - b.tiempo)

      return { datos: datosParaModelo, metadata: response.metadata }
    } catch (error) {
      throw new Error(`No se pudieron obtener los datos históricos de truchas`)
    }
  },

  realizarPrediccion: async (dias: number) => {
    const { datos: datosHistoricos, metadata } = await prediccionAvanzadaTruchasService.obtenerDatosHistoricos()
    if (datosHistoricos.length < 10) throw new Error(`No hay suficientes datos`)

    const tiempos = datosHistoricos.map((d: { tiempo: number; valorObservado: number }) => d.tiempo)
    const longitudes = datosHistoricos.map((d: { tiempo: number; valorObservado: number }) => d.valorObservado)

    const regresionLinealResult = regresionLineal(tiempos, longitudes)

    const longitudMaximaObservada = longitudes.length > 0 ? Math.max(...longitudes) : 0
    const longitudMaximaReferencia = DATOS_REFERENCIA_TRUCHAS.length > 0 ? Math.max(...DATOS_REFERENCIA_TRUCHAS.map((d) => d.longitud)) : 0
    const L_infinito = Math.max(longitudMaximaObservada * 1.4, longitudMaximaReferencia * 1.2, 65)

    const parametrosIniciales = [L_infinito, -3, 0.03, 0.006, 0.002, 0.00008, 0.008]
    const resultadoVonBertalanffy = optimizarVonBertalanffy(datosHistoricos, modeloVonBertalanffyTruchas, parametrosIniciales, DATOS_REFERENCIA_TRUCHAS)

    const datosActuales = datosHistoricos[datosHistoricos.length - 1]
    const tiempoActual = datosActuales.tiempo
    const tiempoFuturo = tiempoActual + dias
    const longitudActual = datosActuales.valorObservado

    const longitudPrediccionLineal = regresionLinealResult.slope * tiempoFuturo + regresionLinealResult.intercept
    const crecimientoLineal = Math.max(0, longitudPrediccionLineal - longitudActual)
    const longitudPrediccionVB = modeloVonBertalanffyTruchas(tiempoFuturo, resultadoVonBertalanffy.coeficientes, datosActuales)
    const crecimientoVB = Math.max(0, longitudPrediccionVB - longitudActual)
    const edadEstimadaMeses = tiempoActual / 30

    return {
      diasPrediccion: dias, longitudActual,
      longitudPrediccionLineal: Math.max(longitudPrediccionLineal, longitudActual),
      crecimientoEsperadoLineal: crecimientoLineal,
      r2Lineal: regresionLinealResult.r2,
      pendienteLineal: regresionLinealResult.slope, interceptoLineal: regresionLinealResult.intercept,
      longitudPrediccionVB: Math.max(longitudPrediccionVB, longitudActual),
      crecimientoEsperadoVB: crecimientoVB,
      L_infinito: resultadoVonBertalanffy.coeficientes[0],
      coeficientesVB: resultadoVonBertalanffy.coeficientes,
      r2VB: resultadoVonBertalanffy.r2, errorVB: resultadoVonBertalanffy.error,
      totalRegistros: datosHistoricos.length,
      edadEstimadaMeses,
      variablesAmbientales: { temperatura: datosActuales.temperatura, conductividad: datosActuales.conductividad, ph: datosActuales.ph, oxigeno: datosActuales.oxigeno },
      datosReferencia: DATOS_REFERENCIA_TRUCHAS, metadata,
    }
  },
}

export const prediccionAvanzadaLechugasService = {
  obtenerDatosHistoricos: async () => {
    try {
      const response = await fetchWithTimeout(LECHUGAS_ENDPOINTS.diarioUltimo)
      if (!response || typeof response !== "object") throw new Error("Respuesta inválida")

      let datosHistoricos = []
      if (response.datos && Array.isArray(response.datos)) datosHistoricos = response.datos
      else if (Array.isArray(response)) datosHistoricos = response

      if (datosHistoricos.length < 10) throw new Error(`No hay suficientes días con datos`)

      const datosParaModelo = datosHistoricos
        .map((registro: any, index: number) => ({
          tiempo: validarNumero(registro.tiempoDias || registro.dia || index, index),
          alturaObservada: validarNumero(registro.alturaCm || registro.altura || registro.height, 0),
          areaObservada: validarNumero(registro.areaFoliarCm2 || registro.areaFoliar || registro.area, 0),
          temperatura: validarNumero(registro.temperaturaC || registro.temperatura || registro.temp, 22.0),
          humedad: validarNumero(registro.humedadPorcentaje || registro.humedad || registro.humidity, 65.0),
          ph: validarNumero(registro.pH || registro.ph, 6.5),
          timestamp: registro.timestamp || new Date().toISOString(),
          dia: validarNumero(registro.dia || index, index),
        }))
        .filter((d: { alturaObservada: number; areaObservada: number }) => d.alturaObservada > 0 && d.areaObservada > 0 && d.alturaObservada < 50 && d.areaObservada < 500)
        .sort((a: { tiempo: number }, b: { tiempo: number }) => a.tiempo - b.tiempo)

      if (datosParaModelo.length === 0) throw new Error("No se encontraron datos válidos")

      return { datos: datosParaModelo, metadata: response.metadata }
    } catch (error) {
      throw new Error(`No se pudieron obtener los datos históricos de lechugas`)
    }
  },

  realizarPrediccion: async (dias: number) => {
    try {
      const diasValidos = validarNumero(dias, 1)
      if (diasValidos <= 0 || diasValidos > 100) throw new Error("El número de días debe estar entre 1 y 100")

      const { datos: datosHistoricos, metadata } = await prediccionAvanzadaLechugasService.obtenerDatosHistoricos()
      if (datosHistoricos.length < 10) throw new Error(`No hay suficientes datos`)

      const tiempos = datosHistoricos.map((d: { tiempo: number }) => validarNumero(d.tiempo, 0))
      const alturas = datosHistoricos.map((d: { alturaObservada: number }) => validarNumero(d.alturaObservada, 0))
      const areas = datosHistoricos.map((d: { areaObservada: number }) => validarNumero(d.areaObservada, 0))

      const regresionAlturaLineal = regresionLineal(tiempos, alturas)
      const regresionAreaLineal = regresionLineal(tiempos, areas)

      const alturaMaxima = Math.max(...alturas)
      const areaMaxima = Math.max(...areas)
      const H_infinito = validarNumero(Math.max(alturaMaxima * 1.5, 30), 30)
      const A_infinito = validarNumero(Math.max(areaMaxima * 1.6, 250), 250)

      const parametrosAlturaIniciales = [H_infinito, -2, 0.06, 0.004, 0.002, 0.012]
      const datosAltura = datosHistoricos.map((d: any) => ({ ...d, valorObservado: validarNumero(d.alturaObservada, 0) }))
      const resultadoAlturaExp = optimizarVonBertalanffy(datosAltura, modeloExponencialAltura, parametrosAlturaIniciales) || { coeficientes: parametrosAlturaIniciales, error: 999, r2: 0.5 }

      const parametrosAreaIniciales = [A_infinito, -2, 0.08, 0.006, 0.003, 0.015]
      const datosArea = datosHistoricos.map((d: any) => ({ ...d, valorObservado: validarNumero(d.areaObservada, 0) }))
      const resultadoAreaExp = optimizarVonBertalanffy(datosArea, modeloExponencialArea, parametrosAreaIniciales) || { coeficientes: parametrosAreaIniciales, error: 999, r2: 0.5 }

      const datosActuales = datosHistoricos[datosHistoricos.length - 1]
      const tiempoActual = validarNumero(datosActuales.tiempo, 0)
      const tiempoFuturo = tiempoActual + diasValidos
      const alturaActual = validarNumero(datosActuales.alturaObservada, 0)
      const areaActual = validarNumero(datosActuales.areaObservada, 0)

      let alturaPrediccionLineal = validarNumero(regresionAlturaLineal.slope * tiempoFuturo + regresionAlturaLineal.intercept, alturaActual)
      let areaPrediccionLineal = validarNumero(regresionAreaLineal.slope * tiempoFuturo + regresionAreaLineal.intercept, areaActual)
      let alturaPrediccionExp = validarNumero(modeloExponencialAltura(tiempoFuturo, resultadoAlturaExp.coeficientes, datosActuales), alturaActual)
      let areaPrediccionExp = validarNumero(modeloExponencialArea(tiempoFuturo, resultadoAreaExp.coeficientes, datosActuales), areaActual)

      if (diasValidos > 100) {
        const factorAltura = Math.min(3.0, 1 + diasValidos * 0.002)
        const factorArea = Math.min(5.0, 1 + diasValidos * 0.003)
        alturaPrediccionLineal = Math.min(alturaPrediccionLineal, alturaActual * factorAltura)
        areaPrediccionLineal = Math.min(areaPrediccionLineal, areaActual * factorArea)
        alturaPrediccionExp = Math.min(alturaPrediccionExp, alturaActual * factorAltura)
        areaPrediccionExp = Math.min(areaPrediccionExp, areaActual * factorArea)
      }

      alturaPrediccionLineal = Math.max(alturaPrediccionLineal, alturaActual)
      areaPrediccionLineal = Math.max(areaPrediccionLineal, areaActual)
      alturaPrediccionExp = Math.max(alturaPrediccionExp, alturaActual)
      areaPrediccionExp = Math.max(areaPrediccionExp, areaActual)

      return {
        diasPrediccion: diasValidos, alturaActual: validarNumero(alturaActual, 0), areaFoliarActual: validarNumero(areaActual, 0),
        alturaPrediccionLineal: validarNumero(alturaPrediccionLineal, alturaActual),
        areaFoliarPrediccionLineal: validarNumero(areaPrediccionLineal, areaActual),
        crecimientoAlturaLineal: Math.max(validarNumero(alturaPrediccionLineal - alturaActual, 0), 0),
        crecimientoAreaLineal: Math.max(validarNumero(areaPrediccionLineal - areaActual, 0), 0),
        r2AlturaLineal: validarNumero(regresionAlturaLineal.r2, 0), r2AreaLineal: validarNumero(regresionAreaLineal.r2, 0),
        pendienteAlturaLineal: validarNumero(regresionAlturaLineal.slope, 0), pendienteAreaLineal: validarNumero(regresionAreaLineal.slope, 0),
        alturaPrediccionExp: validarNumero(alturaPrediccionExp, alturaActual),
        areaFoliarPrediccionExp: validarNumero(areaPrediccionExp, areaActual),
        crecimientoAlturaExp: Math.max(validarNumero(alturaPrediccionExp - alturaActual, 0), 0),
        crecimientoAreaExp: Math.max(validarNumero(areaPrediccionExp - areaActual, 0), 0),
        H_infinito: validarNumero(resultadoAlturaExp.coeficientes[0], H_infinito),
        A_infinito: validarNumero(resultadoAreaExp.coeficientes[0], A_infinito),
        coeficientesAlturaExp: resultadoAlturaExp.coeficientes.map((c) => validarNumero(c, 0)),
        coeficientesAreaExp: resultadoAreaExp.coeficientes.map((c) => validarNumero(c, 0)),
        r2AlturaExp: validarNumero(resultadoAlturaExp.r2, 0), r2AreaExp: validarNumero(resultadoAreaExp.r2, 0),
        errorAlturaExp: validarNumero(resultadoAlturaExp.error, 999), errorAreaExp: validarNumero(resultadoAreaExp.error, 999),
        totalRegistros: datosHistoricos.length, edadEstimadaDias: tiempoActual,
        variablesAmbientales: { temperatura: validarNumero(datosActuales.temperatura, 22.0), humedad: validarNumero(datosActuales.humedad, 65.0), ph: validarNumero(datosActuales.ph, 6.5) },
        metadata,
      }
    } catch (error) {
      throw new Error(`Error en predicción avanzada de lechugas`)
    }
  },
}

const ML_TRUCHAS_URL = "https://xkastrox-api-truchas.hf.space"
const ML_LECHUGAS_URL = "https://xkastrox-api-lechugas.hf.space" // Placeholder, ajustar si existe
const STATS_URL = "https://keitha-groveless-tari.ngrok-free.dev/api/stats"


export const mlTruchasService = {
  // 1. Obtener todo el contexto para la pantalla y para la IA
  obtenerContextoActual: async () => {
    console.log("🤖 ML: Obteniendo variables ambientales y físicas actuales desde Ngrok...")

    // Usamos el servicio central unificado
    const latestData = await truchasService.getLatestValues()

    if (!latestData) {
      throw new Error("No hay datos de sensores disponibles en el API en línea")
    }

    // Variables para la fecha y la edad
    let ultimaMedicionFecha = "Desconocida"
    let edadEstimadaDias = 120 // Un default razonable por si falla la API de stats

    // Intentamos obtener las estadísticas (última medición)
    try {
      const resStats = await fetch(STATS_URL)
      const jsonStats = await resStats.json()
      if (jsonStats.success && jsonStats.data) {
        ultimaMedicionFecha = jsonStats.data.ultima_medicion || "Desconocida"

        // Si tu API de Python ya te devuelve la edad en días, genial. 
        // Si no, aquí hacemos un cálculo matemático rápido: (ej. 1 cm de trucha = ~8 días de vida aprox)
        const longitudBase = validarNumero(latestData.longitudCm, 10.0)
        edadEstimadaDias = jsonStats.data.edad_dias || Math.floor(longitudBase * 8)
      }
    } catch (e) {
      console.warn("⚠️ No se pudo obtener stats, usando valores estimados para la edad y fecha.")
    }

    // Mapeamos los valores reales que espera la nueva interfaz
    const contexto = {
      fechaActual: new Date().toISOString().split('T')[0],
      ultimaMedicionFisica: ultimaMedicionFecha,
      longitudActual: validarNumero(latestData.longitudCm, 0),
      pesoActual: validarNumero(latestData.pesoG, 0),
      edadEstimadaDias: edadEstimadaDias,
      temperatura: validarNumero(latestData.temperaturaC, 15.0),
      conductividad: validarNumero(latestData.conductividadUsCm, 0),
      ph: validarNumero(latestData.pH, 7.5),
      oxigeno: validarNumero(latestData.oxigenoMgL, 8.5),
      turbidez: validarNumero(latestData.turbidezNtu, 0),
    }

    console.log(`🤖 ML Listo: temp=${contexto.temperatura}°C | pH=${contexto.ph} | O2=${contexto.oxigeno}mg/L | Edad=${contexto.edadEstimadaDias} días`)

    return contexto
  },

  // 2. Llamar al microservicio ML de HuggingFace con todo el paquete
  predecirConML: async ({ diasAPredecir, contexto }: { diasAPredecir: number, contexto: any }) => {
    console.log(`🤖 ML: Enviando predicción a Hugging Face para ${diasAPredecir} días a futuro...`)

    const payload = {
      dias_prediccion: diasAPredecir,
      edad_actual_dias: contexto.edadEstimadaDias,
      longitud_actual: contexto.longitudActual,
      peso_actual: contexto.pesoActual,
      temperatura: contexto.temperatura,
      conductividad: contexto.conductividad,
      ph: contexto.ph,
      oxigeno_disuelto: contexto.oxigeno,
      turbidez: contexto.turbidez
    }

    const response = await fetch(`${ML_TRUCHAS_URL}/predecir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail ?? `Error ML HuggingFace: HTTP ${response.status}`)
    }

    const resultado = await response.json()

    // 3. Mapeamos la respuesta del backend de Python a la interfaz de React Native
    return {
      diasPrediccion: diasAPredecir,
      longitudFinal: validarNumero(resultado.longitud_final, contexto.longitudActual),
      pesoFinal: validarNumero(resultado.peso_final, contexto.pesoActual),
      precisionModelo: validarNumero(resultado.precision_modelo, 0.90),
      // Validamos que la API nos devuelva arreglos para poder graficarlos
      curvaCrecimientoLongitud: Array.isArray(resultado.curva_longitud) ? resultado.curva_longitud : [contexto.longitudActual],
      curvaCrecimientoPeso: Array.isArray(resultado.curva_peso) ? resultado.curva_peso : [contexto.pesoActual]
    }
  },
}
export const mlLechugasService = {
  obtenerContextoActual: async () => {
    const { lechugasService } = require('./apiService');
    const latestData = await lechugasService.getLatestValues();
    const validarNumero = (v, d) => (v === null || v === undefined || isNaN(Number(v))) ? d : Number(v);
    if (!latestData) throw new Error('No hay datos de sensores disponibles');

    return {
      fechaActual: new Date().toISOString().split('T')[0],
      ultimaMedicionFisica: new Date().toLocaleTimeString(),
      alturaActual: validarNumero(latestData.alturaCm, 0),
      areaActual: validarNumero(latestData.areaFoliarCm2, 0),
      edadEstimadaDias: Math.floor(validarNumero(latestData.alturaCm, 0) * 2),
      temperatura: validarNumero(latestData.temperaturaC, 22.0),
      conductividad: 0,
      ph: validarNumero(latestData.pH, 6.5),
      humedad: validarNumero(latestData.humedadPorcentaje, 65.0),
    };
  },

  predecirConML: async ({ diasAPredecir, contexto }) => {
    const factorCrecimiento = 1 + (diasAPredecir * 0.05);
    return {
      diasPrediccion: diasAPredecir,
      alturaFinal: contexto.alturaActual * factorCrecimiento,
      areaFinal: contexto.areaActual * (factorCrecimiento * 1.2),
      precisionModelo: 0.85,
      curvaCrecimientoAltura: Array.from({ length: diasAPredecir + 1 }, (_, i) => contexto.alturaActual * (1 + i * 0.05)),
      curvaCrecimientoArea: Array.from({ length: diasAPredecir + 1 }, (_, i) => contexto.areaActual * (1 + i * 0.06)),
    };
  }
};

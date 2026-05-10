import { TRUCHAS_ENDPOINTS, LECHUGAS_ENDPOINTS } from "../config/api"
import { truchasService } from "./apiService"

// Función para hacer fetch con timeout
const fetchWithTimeout = async (url: string, timeout = 15000) => {
  try {
    console.log(`🔄 SARIMA Fetching: ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ SARIMA Data received from ${url}:`, data.metadata ? `${data.datos?.length || 0} días` : typeof data)
    return data
  } catch (error) {
    if (error instanceof Error && (error as any).name === "AbortError") {
      console.error(`⏰ SARIMA Timeout fetching ${url}`)
      throw new Error("Timeout: La solicitud tardó demasiado")
    }
    console.error(`❌ SARIMA Error fetching ${url}:`, error)
    throw error
  }
}

// Función para validar y limpiar números de forma ULTRA ROBUSTA
const validarNumero = (valor: any, defaultValue = 0): number => {
  // Si es null, undefined, string vacía, etc.
  if (valor === null || valor === undefined || valor === "" || valor === "null" || valor === "undefined") {
    return defaultValue
  }

  // Convertir a número
  const num = Number(valor)

  // Verificar si es un número válido y finito
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue
  }

  return num
}

// Implementación simplificada de SARIMA con validación ULTRA robusta
class SARIMAModel {
  private data: number[] = []
  private seasonalPeriod = 7 // Periodicidad semanal por defecto
  private p = 1 // Orden AR
  private d = 1 // Orden de diferenciación
  private q = 1 // Orden MA
  private P = 1 // Orden AR estacional
  private D = 1 // Orden de diferenciación estacional
  private Q = 1 // Orden MA estacional

  constructor(data: number[], seasonalPeriod = 7) {
    // Validar y limpiar datos de entrada
    this.data = data.map((val) => validarNumero(val, 0)).filter((val) => val > 0)
    this.seasonalPeriod = Math.max(1, Math.floor(validarNumero(seasonalPeriod, 7)))
  }

  // Diferenciación simple con validación
  private difference(series: number[], order = 1): number[] {
    let result = [...series]
    for (let i = 0; i < order; i++) {
      const newResult: number[] = []
      for (let j = 1; j < result.length; j++) {
        const diff = validarNumero(result[j] - result[j - 1], 0)
        newResult.push(diff)
      }
      result = newResult
      if (result.length === 0) break
    }
    return result
  }

  // Diferenciación estacional con validación
  private seasonalDifference(series: number[], period: number, order = 1): number[] {
    let result = [...series]
    for (let i = 0; i < order; i++) {
      const newResult: number[] = []
      for (let j = period; j < result.length; j++) {
        const diff = validarNumero(result[j] - result[j - period], 0)
        newResult.push(diff)
      }
      result = newResult
      if (result.length === 0) break
    }
    return result
  }

  // Media móvil simple con validación
  private movingAverage(series: number[], window: number): number[] {
    const result: number[] = []
    const validWindow = Math.max(1, Math.min(window, series.length))

    for (let i = validWindow - 1; i < series.length; i++) {
      let sum = 0
      for (let j = 0; j < validWindow; j++) {
        sum += validarNumero(series[i - j], 0)
      }
      const avg = validarNumero(sum / validWindow, 0)
      result.push(avg)
    }
    return result
  }

  // Autocorrelación simple con validación
  private autocorrelation(series: number[], lag: number): number {
    if (series.length <= lag) return 0

    const n = series.length
    const mean = series.reduce((sum, val) => sum + validarNumero(val, 0), 0) / n

    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n - lag; i++) {
      numerator += (validarNumero(series[i], 0) - mean) * (validarNumero(series[i + lag], 0) - mean)
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(validarNumero(series[i], 0) - mean, 2)
    }

    return validarNumero(denominator === 0 ? 0 : numerator / denominator, 0)
  }

  // Detección de estacionalidad con validación
  private detectSeasonality(): { isStationary: boolean; seasonalStrength: number } {
    if (this.data.length < this.seasonalPeriod * 2) {
      return { isStationary: false, seasonalStrength: 0 }
    }

    // Calcular autocorrelación estacional
    const seasonalAcf = this.autocorrelation(this.data, this.seasonalPeriod)
    const seasonalStrength = validarNumero(Math.abs(seasonalAcf), 0)

    // Considerar estacional si la autocorrelación es significativa
    const isStationary = seasonalStrength < 0.3

    return { isStationary, seasonalStrength }
  }

  // Predicción SARIMA simplificada con manejo ULTRA robusto de números grandes
  predict(steps: number): {
    predictions: number[]
    confidence: number
    modelInfo: {
      p: number
      d: number
      q: number
      P: number
      D: number
      Q: number
      seasonalPeriod: number
      dataPoints: number
      seasonalStrength: number
      isStationary: boolean
    }
  } {
    if (this.data.length < 10) {
      throw new Error("Se necesitan al menos 10 puntos de datos para SARIMA")
    }

    // Validar y limitar pasos
    const validSteps = Math.max(1, Math.min(validarNumero(steps, 1), 1000))

    console.log(`📊 SARIMA: Iniciando predicción para ${validSteps} pasos`)
    console.log(`📊 SARIMA: Datos disponibles: ${this.data.length}`)

    // Detectar estacionalidad
    const { isStationary, seasonalStrength } = this.detectSeasonality()
    console.log(`📊 SARIMA: Fuerza estacional: ${seasonalStrength.toFixed(3)}`)

    // Preparar datos
    let workingData = [...this.data]

    // Aplicar diferenciación regular si es necesario
    if (!isStationary && workingData.length > 1) {
      workingData = this.difference(workingData, this.d)
      console.log(`📊 SARIMA: Aplicada diferenciación regular (d=${this.d})`)
    }

    // Aplicar diferenciación estacional si hay estacionalidad fuerte
    if (seasonalStrength > 0.3 && workingData.length > this.seasonalPeriod) {
      workingData = this.seasonalDifference(workingData, this.seasonalPeriod, this.D)
      console.log(`📊 SARIMA: Aplicada diferenciación estacional (D=${this.D})`)
    }

    // Calcular tendencia usando media móvil
    const trendWindow = Math.min(7, Math.floor(this.data.length / 3))
    const trend = this.movingAverage(this.data, trendWindow)
    const lastTrend = trend.length > 0 ? trend[trend.length - 1] : this.data[this.data.length - 1]

    // Calcular componente estacional
    const seasonalComponent = this.calculateSeasonalComponent()

    // Generar predicciones con validación ULTRA robusta
    const predictions: number[] = []
    const lastValue = validarNumero(this.data[this.data.length - 1], 0)
    const trendSlope = this.calculateTrendSlope()

    for (let i = 1; i <= validSteps; i++) {
      // Componente de tendencia con amortiguación para días lejanos
      const dampingFactor = validarNumero(Math.exp(-i / 200), 0.1) // Amortiguación más suave
      const trendComponent = validarNumero(lastTrend + trendSlope * i * dampingFactor, lastValue)

      // Componente estacional
      const seasonalIndex = (this.data.length + i - 1) % this.seasonalPeriod
      const seasonal = validarNumero(seasonalComponent[seasonalIndex] || 0, 0)

      // Componente AR (autoregresivo) con amortiguación
      const arComponent = validarNumero(this.calculateARComponent(i) * dampingFactor, 0)

      // Componente MA (media móvil) con amortiguación
      const maComponent = validarNumero(this.calculateMAComponent(i) * dampingFactor, 0)

      // Predicción combinada con validación
      let prediction = validarNumero(
        trendComponent + seasonal * seasonalStrength + arComponent + maComponent,
        lastValue,
      )

      // Asegurar que la predicción sea realista con límites más conservadores
      const minValue = validarNumero(lastValue * Math.max(0.8, 1 - i * 0.0005), lastValue * 0.5)
      const maxValue = validarNumero(lastValue * Math.min(2.5, 1 + i * 0.001), lastValue * 3.0)

      prediction = Math.max(prediction, minValue)
      prediction = Math.min(prediction, maxValue)
      prediction = validarNumero(prediction, lastValue)

      predictions.push(prediction)
    }

    // Calcular confianza basada en la variabilidad de los datos
    const variance = this.calculateVariance()
    const confidence = validarNumero(Math.max(0.5, Math.min(0.95, 1 - variance / (lastValue * lastValue + 1))), 0.7)

    console.log(`📊 SARIMA: Predicciones generadas: ${predictions.length}`)
    console.log(`📊 SARIMA: Confianza del modelo: ${(confidence * 100).toFixed(1)}%`)

    return {
      predictions,
      confidence,
      modelInfo: {
        p: this.p,
        d: this.d,
        q: this.q,
        P: this.P,
        D: this.D,
        Q: this.Q,
        seasonalPeriod: this.seasonalPeriod,
        dataPoints: this.data.length,
        seasonalStrength: validarNumero(seasonalStrength, 0),
        isStationary,
      },
    }
  }

  private calculateSeasonalComponent(): number[] {
    const seasonal: number[] = new Array(this.seasonalPeriod).fill(0)
    const counts: number[] = new Array(this.seasonalPeriod).fill(0)

    // Calcular promedio para cada posición estacional
    for (let i = 0; i < this.data.length; i++) {
      const seasonalIndex = i % this.seasonalPeriod
      seasonal[seasonalIndex] += validarNumero(this.data[i], 0)
      counts[seasonalIndex]++
    }

    // Normalizar con validación
    const overallMean = this.data.reduce((sum, val) => sum + validarNumero(val, 0), 0) / this.data.length
    for (let i = 0; i < this.seasonalPeriod; i++) {
      if (counts[i] > 0) {
        seasonal[i] = validarNumero(seasonal[i] / counts[i] - overallMean, 0)
      }
    }

    return seasonal
  }

  private calculateTrendSlope(): number {
    if (this.data.length < 2) return 0

    const n = Math.min(10, this.data.length) // Usar últimos 10 puntos
    const recentData = this.data.slice(-n).map((val) => validarNumero(val, 0))

    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0

    for (let i = 0; i < n; i++) {
      sumX += i
      sumY += recentData[i]
      sumXY += i * recentData[i]
      sumXX += i * i
    }

    const denominator = n * sumXX - sumX * sumX
    if (Math.abs(denominator) < 1e-10) return 0

    return validarNumero((n * sumXY - sumX * sumY) / denominator, 0)
  }

  private calculateARComponent(step: number): number {
    // Componente autoregresivo simplificado con validación
    const lastValues = this.data.slice(-this.p).map((val) => validarNumero(val, 0))
    let arComponent = 0

    for (let i = 0; i < lastValues.length; i++) {
      const weight = validarNumero(0.1 * Math.exp(-i * 0.1), 0) // Pesos decrecientes
      arComponent += weight * lastValues[lastValues.length - 1 - i]
    }

    return validarNumero(arComponent * 0.1, 0) // Factor de escala
  }

  private calculateMAComponent(step: number): number {
    // Componente de media móvil simplificado con validación
    const window = Math.min(this.q, this.data.length)
    const recentData = this.data.slice(-window).map((val) => validarNumero(val, 0))
    const mean = recentData.reduce((sum, val) => sum + val, 0) / recentData.length
    const lastValue = validarNumero(this.data[this.data.length - 1], 0)

    return validarNumero((mean - lastValue) * 0.05, 0) // Factor de corrección pequeño
  }

  private calculateVariance(): number {
    const validData = this.data.map((val) => validarNumero(val, 0))
    const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length
    const variance = validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length
    return validarNumero(variance, 0)
  }
}

// Servicio SARIMA para truchas - USANDO TODOS LOS DATOS con validación robusta
export const sarimaTruchasService = {
  obtenerDatosHistoricos: async () => {
    try {
      console.log("🐟 SARIMA: Obteniendo TODOS los datos históricos diarios de truchas...")
      const datosHistoricos = await truchasService.getDailyHistory()

      if (datosHistoricos.length < 14) {
        throw new Error(`Se necesitan al menos 14 días de datos para SARIMA (${datosHistoricos.length} disponibles)`)
      }

      console.log(`📊 Total de registros recibidos: ${datosHistoricos.length}`)

      // Procesar TODOS los datos para SARIMA con validación robusta
      type TruchaDato = {
        dia: number
        longitud: number
        temperatura: number
        conductividad: number
        ph: number
        timestamp: string
      }

      const datosParaModelo = datosHistoricos
        .map(
          (registro: any): TruchaDato => ({
            dia: validarNumero(registro.dia, 0),
            longitud: validarNumero(registro.longitudCm, 0),
            temperatura: validarNumero(registro.temperaturaC, 15.0),
            conductividad: validarNumero(registro.conductividadUsCm, 550),
            ph: validarNumero(registro.pH, 7.5),
            timestamp: registro.timestamp,
          }),
        )
        .filter((d: TruchaDato) => d.longitud > 0 && d.longitud < 100) // Filtrar valores razonables
        .sort((a: TruchaDato, b: TruchaDato) => a.dia - b.dia) // Ordenar por día

      console.log(`✅ SARIMA: Procesados TODOS los ${datosParaModelo.length} días con datos válidos de truchas`)

      if (datosParaModelo.length === 0) {
        throw new Error("No se encontraron datos válidos después del filtrado")
      }

      // Obtener datos actuales reales
      const ultimoDato = datosParaModelo[datosParaModelo.length - 1]

      console.log(`🎯 DATOS ACTUALES TRUCHAS:`)
      console.log(`   - Longitud actual: ${ultimoDato.longitud} cm`)
      console.log(`   - Día actual: ${ultimoDato.dia}`)

      return {
        datos: datosParaModelo,
        metadata: null,
        longitudActual: ultimoDato.longitud,
        diaActual: ultimoDato.dia,
      }
    } catch (error) {
      console.error("❌ SARIMA: Error obteniendo datos históricos truchas:", error)
      if (error instanceof Error) {
        throw new Error(`No se pudieron obtener los datos históricos: ${error.message}`)
      } else {
        throw new Error("No se pudieron obtener los datos históricos: error desconocido")
      }
    }
  },

  realizarPrediccionSARIMA: async (dias: number) => {
    // Validar entrada con números robustos
    const diasValidos = validarNumero(dias, 1)
    if (diasValidos <= 0 || diasValidos > 1000) {
      throw new Error("El número de días debe estar entre 1 y 100")
    }

    const {
      datos: datosHistoricos,
      metadata,
      longitudActual,
      diaActual,
    } = await sarimaTruchasService.obtenerDatosHistoricos()

    if (datosHistoricos.length < 14) {
      throw new Error(`Se necesitan al menos 14 días de datos para SARIMA (${datosHistoricos.length} disponibles)`)
    }

    // Extraer serie temporal de longitudes - USANDO TODOS LOS DATOS
    const longitudes = datosHistoricos.map((d: { longitud: number }) => validarNumero(d.longitud, 0))

    console.log(`🐟 SARIMA: Usando TODOS los ${longitudes.length} datos para predicción de ${diasValidos} días`)
    console.log(`🎯 Longitud actual confirmada: ${longitudActual} cm`)

    // Crear modelo SARIMA
    const sarimaModel = new SARIMAModel(longitudes, 7) // Periodicidad semanal

    // Realizar predicción
    const prediccionSARIMA = sarimaModel.predict(diasValidos)

    // Calcular estadísticas con validación
    const longitudPrediccion = validarNumero(
      prediccionSARIMA.predictions[prediccionSARIMA.predictions.length - 1],
      longitudActual,
    )
    const crecimientoEsperado = validarNumero(Math.max(0, longitudPrediccion - longitudActual), 0)

    console.log(`📊 RESULTADOS SARIMA TRUCHAS:`)
    console.log(`   - Longitud predicha: ${longitudPrediccion} cm`)
    console.log(`   - Crecimiento esperado: +${crecimientoEsperado} cm`)

    return {
      diasPrediccion: diasValidos,
      longitudActual: validarNumero(longitudActual, 0),
      longitudPrediccion: Math.max(validarNumero(longitudPrediccion, longitudActual), longitudActual),
      crecimientoEsperado,
      prediccionesDiarias: prediccionSARIMA.predictions.map((val) => validarNumero(val, longitudActual)),
      confianzaModelo: validarNumero(prediccionSARIMA.confidence, 0.7),
      modeloInfo: prediccionSARIMA.modelInfo,
      totalRegistros: datosHistoricos.length,
      variablesAmbientales: {
        temperatura: validarNumero(datosHistoricos[datosHistoricos.length - 1].temperatura, 15.0),
        conductividad: validarNumero(datosHistoricos[datosHistoricos.length - 1].conductividad, 550),
        ph: validarNumero(datosHistoricos[datosHistoricos.length - 1].ph, 7.5),
      },
      metadata: metadata,
    }
  },
}

// Servicio SARIMA para lechugas - USANDO TODOS LOS DATOS con validación ULTRA robusta
export const sarimaLechugasService = {
  obtenerDatosHistoricos: async () => {
    try {
      console.log("🥬 SARIMA LECHUGAS: Obteniendo TODOS los datos históricos diarios...")
      const response = await fetchWithTimeout(LECHUGAS_ENDPOINTS.diarioUltimo)

      console.log("🥬 SARIMA LECHUGAS: Respuesta recibida:", response)

      if (!response || typeof response !== "object") {
        throw new Error("Respuesta inválida del servidor")
      }

      // Verificar si tiene la estructura esperada
      let datosHistoricos = []

      if (response.datos && Array.isArray(response.datos)) {
        datosHistoricos = response.datos
      } else if (Array.isArray(response)) {
        datosHistoricos = response
      } else {
        throw new Error("Formato de respuesta inválido - no se encontraron datos")
      }

      if (datosHistoricos.length < 14) {
        throw new Error(`Se necesitan al menos 14 días de datos para SARIMA (${datosHistoricos.length} disponibles)`)
      }

      console.log(`🥬 SARIMA LECHUGAS: Total de registros recibidos: ${datosHistoricos.length}`)

      // Procesar TODOS los datos para SARIMA con validación ULTRA robusta
      const datosParaModelo = datosHistoricos
        .map((registro: any, index: number) => {
          console.log(`🥬 SARIMA LECHUGAS: Procesando registro ${index}:`, registro)

          const datosProcesados = {
            dia: validarNumero(registro.dia || registro.day || index, index),
            altura: validarNumero(registro.alturaCm || registro.altura || registro.height, 0),
            areaFoliar: validarNumero(registro.areaFoliarCm2 || registro.areaFoliar || registro.area, 0),
            temperatura: validarNumero(registro.temperaturaC || registro.temperatura || registro.temp, 22.0),
            humedad: validarNumero(registro.humedadPorcentaje || registro.humedad || registro.humidity, 65.0),
            ph: validarNumero(registro.pH || registro.ph, 6.5),
            timestamp: registro.timestamp || new Date().toISOString(),
          }

          console.log(`🥬 SARIMA LECHUGAS: Datos procesados ${index}:`, datosProcesados)
          return datosProcesados
        })
        .filter((d: { altura: number; areaFoliar: number }) => {
          const esValido = d.altura > 0 && d.areaFoliar > 0 && d.altura < 200 && d.areaFoliar < 2000
          if (!esValido) {
            console.log(`🥬 SARIMA LECHUGAS: Registro filtrado - altura: ${d.altura}, área: ${d.areaFoliar}`)
          }
          return esValido
        })
        .sort((a: { dia: number }, b: { dia: number }) => a.dia - b.dia) // Ordenar por día

      console.log(`🥬 SARIMA LECHUGAS: Datos procesados y filtrados: ${datosParaModelo.length} días`)

      if (datosParaModelo.length === 0) {
        throw new Error("No se encontraron datos válidos después del filtrado")
      }

      // Obtener datos actuales REALES
      const ultimoDato = datosParaModelo[datosParaModelo.length - 1]
      const alturaActual = validarNumero(ultimoDato.altura, 0)
      const areaActual = validarNumero(ultimoDato.areaFoliar, 0)

      console.log(`🎯 SARIMA LECHUGAS - DATOS ACTUALES CONFIRMADOS:`)
      console.log(`   - Altura actual REAL: ${alturaActual} cm`)
      console.log(`   - Área actual REAL: ${areaActual} cm²`)
      console.log(`   - Día actual: ${ultimoDato.dia}`)
      console.log(`   - Total registros procesados: ${datosParaModelo.length}`)

      return {
        datos: datosParaModelo,
        metadata: response.metadata,
        alturaActual: alturaActual,
        areaActual: areaActual,
        diaActual: validarNumero(ultimoDato.dia, 0),
      }
    } catch (error) {
      console.error("❌ SARIMA LECHUGAS: Error obteniendo datos históricos:", error)
      if (error instanceof Error) {
        throw new Error(`No se pudieron obtener los datos históricos: ${error.message}`)
      } else {
        throw new Error("No se pudieron obtener los datos históricos: error desconocido")
      }
    }
  },

  realizarPrediccionSARIMA: async (dias: number) => {
    try {
      // Validar entrada con números ULTRA robustos
      const diasValidos = validarNumero(dias, 1)
      if (diasValidos <= 0 || diasValidos > 1000) {
        throw new Error("El número de días debe estar entre 1 y 1000")
      }

      console.log(`🎯 SARIMA LECHUGAS: Iniciando predicción para ${diasValidos} días...`)

      const {
        datos: datosHistoricos,
        metadata,
        alturaActual,
        areaActual,
        diaActual,
      } = await sarimaLechugasService.obtenerDatosHistoricos()

      if (datosHistoricos.length < 14) {
        throw new Error(`Se necesitan al menos 14 días de datos para SARIMA (${datosHistoricos.length} disponibles)`)
      }

      // Extraer series temporales - USANDO TODOS LOS DATOS
      const alturas = datosHistoricos.map((d: { altura: number }) => validarNumero(d.altura, 0))
      const areas = datosHistoricos.map((d: { areaFoliar: number }) => validarNumero(d.areaFoliar, 0))

      console.log(`🥬 SARIMA LECHUGAS: Usando TODOS los ${alturas.length} datos para predicción de ${diasValidos} días`)
      console.log(`🎯 SARIMA LECHUGAS: Valores actuales CONFIRMADOS: Altura=${alturaActual}cm, Área=${areaActual}cm²`)

      // Crear modelos SARIMA para altura y área
      const sarimaAlturaModel = new SARIMAModel(alturas, 7) // Periodicidad semanal
      const sarimaAreaModel = new SARIMAModel(areas, 7) // Periodicidad semanal

      // Realizar predicciones
      const prediccionAltura = sarimaAlturaModel.predict(diasValidos)
      const prediccionArea = sarimaAreaModel.predict(diasValidos)

      // Calcular estadísticas con validación ULTRA robusta
      const alturaPrediccion = validarNumero(
        prediccionAltura.predictions[prediccionAltura.predictions.length - 1],
        alturaActual,
      )
      const areaPrediccion = validarNumero(
        prediccionArea.predictions[prediccionArea.predictions.length - 1],
        areaActual,
      )
      const crecimientoAlturaEsperado = validarNumero(Math.max(0, alturaPrediccion - alturaActual), 0)
      const crecimientoAreaEsperado = validarNumero(Math.max(0, areaPrediccion - areaActual), 0)

      console.log(`📊 SARIMA LECHUGAS: RESULTADOS FINALES:`)
      console.log(`   - Altura actual: ${alturaActual} cm`)
      console.log(`   - Altura predicha: ${alturaPrediccion} cm`)
      console.log(`   - Crecimiento altura: +${crecimientoAlturaEsperado} cm`)
      console.log(`   - Área actual: ${areaActual} cm²`)
      console.log(`   - Área predicha: ${areaPrediccion} cm²`)
      console.log(`   - Crecimiento área: +${crecimientoAreaEsperado} cm²`)

      const resultado = {
        diasPrediccion: diasValidos,
        alturaActual: validarNumero(alturaActual, 0),
        areaFoliarActual: validarNumero(areaActual, 0),
        alturaPrediccion: Math.max(validarNumero(alturaPrediccion, alturaActual), alturaActual),
        areaFoliarPrediccion: Math.max(validarNumero(areaPrediccion, areaActual), areaActual),
        crecimientoAlturaEsperado,
        crecimientoAreaEsperado,
        prediccionesAlturasDiarias: prediccionAltura.predictions.map((val) => validarNumero(val, alturaActual)),
        prediccionesAreasDiarias: prediccionArea.predictions.map((val) => validarNumero(val, areaActual)),
        confianzaModeloAltura: validarNumero(prediccionAltura.confidence, 0.7),
        confianzaModeloArea: validarNumero(prediccionArea.confidence, 0.7),
        modeloInfoAltura: prediccionAltura.modelInfo,
        modeloInfoArea: prediccionArea.modelInfo,
        totalRegistros: datosHistoricos.length,
        variablesAmbientales: {
          temperatura: validarNumero(datosHistoricos[datosHistoricos.length - 1].temperatura, 22.0),
          humedad: validarNumero(datosHistoricos[datosHistoricos.length - 1].humedad, 65.0),
          ph: validarNumero(datosHistoricos[datosHistoricos.length - 1].ph, 6.5),
        },
        metadata: metadata,
      }

      console.log(`✅ SARIMA LECHUGAS: Resultado final validado:`, resultado)
      return resultado
    } catch (error) {
      console.error("❌ SARIMA LECHUGAS: Error en realizar Prediccion SARIMA:", error)
      if (error instanceof Error) {
        throw new Error(`Error en predicción SARIMA de lechugas: ${error.message}`)
      } else {
        throw new Error("Error en predicción SARIMA de lechugas: error desconocido")
      }
    }
  },
}

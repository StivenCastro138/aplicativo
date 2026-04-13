import { TRUCHAS_ENDPOINTS, LECHUGAS_ENDPOINTS, NEW_API_ENDPOINTS } from "../config/api"

export interface TruchaData {
  id?: number
  longitudCm: number
  pesoG: number
  altoCm: number
  anchoCm: number
  temperaturaC: number
  conductividadUsCm: number
  pH: number
  oxigenoMgL: number
  turbidezNtu: number
  tiempoSegundos?: number
  timestamp: string
}

export interface LechugaData {
  id?: number
  altura: number
  areaFoliar: number
  temperaturaC: number
  humedadPorcentaje: number
  pH: number
  temperatura: number
  humedad: number
  ph: number
  tiempoSegundos?: number
  timestamp?: string
}

export interface TruchaHistoryRow {
  dia: number
  timestamp: string
  longitudCm: number
  pesoG: number
  temperaturaC: number
  conductividadUsCm: number
  pH: number
  oxigenoMgL: number
  turbidezNtu: number
}

export interface LechugaHistoryRow {
  dia: number
  timestamp: string
  altura: number
  areaFoliar: number
  temperatura: number
  humedad: number
  ph: number
}

const fetchWithErrorHandling = async (url: string) => {
  try {
    console.log(`🔄 Fetching: ${url}`)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

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
    console.log(`📡 Response status: ${response.status} for ${url}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error(`⏰ Timeout fetching ${url}`)
      throw new Error("Timeout: La solicitud tardó demasiado")
    }
    console.error(`❌ Error fetching ${url}:`, error)
    throw error
  }
}

const extractValue = (response: any, fallback = 0): number => {
  if (typeof response === "number") return response
  if (response && typeof response.value === "number") return response.value
  if (response && typeof response.data === "number") return response.data
  if (Array.isArray(response) && response.length > 0) {
    return extractValue(response[0], fallback)
  }
  if (response && typeof response === "object") {
    if (response.alturaCm !== undefined) return response.alturaCm
    if (response.areaFoliarCm2 !== undefined) return response.areaFoliarCm2
    if (response.humedadPorcentaje !== undefined) return response.humedadPorcentaje
  }
  return fallback
}

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const extractArrayPayload = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.datos)) return payload.datos
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && payload.success && Array.isArray(payload.data)) return payload.data
  return []
}

const normalizeTruchaHistory = (row: any, index: number): TruchaHistoryRow | null => {
  const timestamp = row.timestamp || row.TIMESTAMP || row.fecha || row.date || row.datetime
  const longitudCm = asNumber(
    row.longitudCm ??
      row.longitud_cm ??
      row.LENGTH_CM ??
      row.length_cm ??
      row.biometria?.longitud_cm ??
      row.biometria?.longitudCm,
    0,
  )

  if (!timestamp || longitudCm <= 0) {
    return null
  }

  return {
    dia: asNumber(row.dia ?? row.day, index + 1),
    timestamp: String(timestamp),
    longitudCm,
    pesoG: asNumber(
      row.pesoG ??
        row.peso_g ??
        row.WEIGHT_G ??
        row.weight_g ??
        row.weightG ??
        row.biometria?.peso_g ??
        row.biometria?.pesoG,
      0,
    ),
    temperaturaC: asNumber(
      row.temperaturaC ?? row.temperatura_c ?? row.API_WATER_TEMP_C ?? row.water_temp_c,
      0,
    ),
    conductividadUsCm: asNumber(
      row.conductividadUsCm ?? row.conductividad_us_cm ?? row.API_COND_US_CM,
      0,
    ),
    pH: asNumber(row.pH ?? row.ph ?? row.API_PH, 0),
    oxigenoMgL: asNumber(row.oxigenoMgL ?? row.oxigeno_mg_l ?? row.API_DO_MG_L, 0),
    turbidezNtu: asNumber(row.turbidezNtu ?? row.turbidez_ntu ?? row.API_TURBIDITY_NTU, 0),
  }
}

const normalizeLechugaHistory = (row: any, index: number): LechugaHistoryRow | null => {
  const timestamp = row.timestamp || row.TIMESTAMP || row.fecha || row.date || row.datetime
  const altura = asNumber(row.altura ?? row.alturaCm ?? row.altura_cm ?? row.height_cm, 0)
  const areaFoliar = asNumber(
    row.areaFoliar ?? row.areaFoliarCm2 ?? row.area_foliar ?? row.leaf_area_cm2,
    0,
  )

  if (!timestamp || altura <= 0 || areaFoliar <= 0) {
    return null
  }

  return {
    dia: asNumber(row.dia ?? row.day, index + 1),
    timestamp: String(timestamp),
    altura,
    areaFoliar,
    temperatura: asNumber(row.temperatura ?? row.temperaturaC ?? row.temperatura_c, 0),
    humedad: asNumber(row.humedad ?? row.humedadPorcentaje ?? row.humedad_porcentaje, 0),
    ph: asNumber(row.ph ?? row.pH, 0),
  }
}

export const truchasService = {
  getLatest: async (): Promise<any> => {
    return await fetchWithErrorHandling(NEW_API_ENDPOINTS.lastReport)
  },

  getLatestValues: async (): Promise<TruchaData> => {
    try {
      const response = await fetchWithErrorHandling(NEW_API_ENDPOINTS.lastReport)

      if (!response || !response.success) {
        throw new Error("La API respondió, pero sin datos exitosos")
      }

      const d = response.data

      const result: TruchaData = {
        longitudCm: d.biometria?.longitud_cm || 0,
        pesoG: d.biometria?.peso_g || 0,
        altoCm: d.biometria?.alto_cm || 0,
        anchoCm: d.biometria?.ancho_cm || 0,
        temperaturaC: d.sensores?.temperatura?.agua_c || 0,
        conductividadUsCm: d.sensores?.calidad_agua?.conductividad_us || 0,
        pH: d.sensores?.calidad_agua?.ph || 7,
        oxigenoMgL: d.sensores?.calidad_agua?.oxigeno_mg_l || 0,
        turbidezNtu: d.sensores?.calidad_agua?.turbidez_ntu || 0,
        timestamp: d.fecha || new Date().toISOString()
      }

      console.log("🐟 Truchas processed data:", result)
      return result
    } catch (error) {
      console.error("❌ Error in truchasService.getLatestValues:", error)
      throw error
    }
  },

  getDailyHistory: async (): Promise<TruchaHistoryRow[]> => {
    try {
      const [diarioRes, statsRes] = await Promise.allSettled([
        fetchWithErrorHandling(TRUCHAS_ENDPOINTS.diarioUltimo),
        fetchWithErrorHandling(NEW_API_ENDPOINTS.stats),
      ])

      const combinedRaw = [
        ...(diarioRes.status === "fulfilled" ? extractArrayPayload(diarioRes.value) : []),
        ...(statsRes.status === "fulfilled" ? extractArrayPayload(statsRes.value) : []),
      ]

      const normalized = combinedRaw
        .map((row, index) => normalizeTruchaHistory(row, index))
        .filter((row): row is TruchaHistoryRow => row !== null)

      const dedupMap = new Map<string, TruchaHistoryRow>()
      normalized.forEach((row) => {
        dedupMap.set(row.timestamp, row)
      })

      return Array.from(dedupMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      )
    } catch (error) {
      console.error("❌ Error in truchasService.getDailyHistory:", error)
      return []
    }
  },
}

export const lechugasService = {
  getLatest: async (): Promise<any> => {
    return await fetchWithErrorHandling(LECHUGAS_ENDPOINTS.latest)
  },

  getLatestValues: async (): Promise<LechugaData> => {
    try {
      const [alturaRes, areaFoliarRes, newApiRes] = await Promise.all([
        fetchWithErrorHandling(LECHUGAS_ENDPOINTS.altura).catch(() => 0),
        fetchWithErrorHandling(LECHUGAS_ENDPOINTS.areaFoliar).catch(() => 0),
        fetchWithErrorHandling(NEW_API_ENDPOINTS.lastReport).catch(() => null)
      ])

      let tempAire = 0;
      let humedad = 0;
      let ph = 7;

      if (newApiRes && newApiRes.success && newApiRes.data) {
        const d = newApiRes.data;
        tempAire = d.sensores?.temperatura?.aire_c || 0;
        humedad = d.sensores?.ambiente?.humedad_rel || 0;
        ph = d.sensores?.calidad_agua?.ph || 7;
      }

      const result: LechugaData = {
        altura: extractValue(alturaRes, 0),
        areaFoliar: extractValue(areaFoliarRes, 0),

        temperaturaC: tempAire,
        humedadPorcentaje: humedad,
        pH: ph,

        temperatura: tempAire,
        humedad: humedad,
        ph: ph,
        timestamp: new Date().toISOString()
      }

      console.log("🥬 Lechugas processed data (Híbrido):", result)
      return result
    } catch (error) {
      console.error("❌ Error in lechugasService.getLatestValues:", error)
      throw error
    }
  },

  getDailyHistory: async (): Promise<LechugaHistoryRow[]> => {
    try {
      const response = await fetchWithErrorHandling(LECHUGAS_ENDPOINTS.diarioUltimo)
      const raw = extractArrayPayload(response)

      return raw
        .map((row, index) => normalizeLechugaHistory(row, index))
        .filter((row): row is LechugaHistoryRow => row !== null)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    } catch (error) {
      console.error("❌ Error in lechugasService.getDailyHistory:", error)
      return []
    }
  },
}
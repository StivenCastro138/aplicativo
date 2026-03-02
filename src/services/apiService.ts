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
}
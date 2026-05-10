import Constants from "expo-constants"

const LECHUGAS_DOMAIN_ACTIVE = "https://9lul3x1y9t35.share.zrok.io"
const LECHUGAS_DOMAIN_LEGACY = "https://capacitive-delora-entreatingly.ngrok-free.dev"

const getEnvValue = (key: string): string | undefined => {
  const value = process.env[key]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

const getApiBaseUrl = () => {
  const publicApi = getEnvValue("EXPO_PUBLIC_LECHUGAS_API_URL")
  if (publicApi) {
    // Si la variable de entorno apunta a un dominio ngrok u otro legacy,
    // reemplazamos el hostname por el dominio activo para evitar que
    // la app apunte a instancias antiguas.
    if (publicApi.includes("ngrok-free.dev") || publicApi.includes("capacitive-delora-entreatingly.ngrok-free.dev")) {
      return publicApi.replace(/https?:\/\/[^/]+/, LECHUGAS_DOMAIN_ACTIVE)
    }

    return publicApi.replace(LECHUGAS_DOMAIN_LEGACY, LECHUGAS_DOMAIN_ACTIVE)
  }

  // Por defecto usamos el dominio activo
  return LECHUGAS_DOMAIN_ACTIVE
}

export const API_BASE_URL = getApiBaseUrl()
console.log(`🥬 API Local (Lechugas): ${API_BASE_URL}`)

export const LECHUGAS_ENDPOINTS = {
  all: `${API_BASE_URL}/api/lechugas`,
  latest: `${API_BASE_URL}/api/lechugas/latest`,
  stats: `${API_BASE_URL}/api/lechugas/stats`,
  altura: `${API_BASE_URL}/api/lechugas/altura/latest`,
  areaFoliar: `${API_BASE_URL}/api/lechugas/area-foliar/latest`,
  temperatura: `${API_BASE_URL}/api/lechugas/temperatura/latest`,
  humedad: `${API_BASE_URL}/api/lechugas/humedad/latest`,
  ph: `${API_BASE_URL}/api/lechugas/ph/latest`,
  range: `${API_BASE_URL}/api/lechugas/range`,
  diarioUltimo: `${API_BASE_URL}/api/graphics/lechugas/diario-ultimo`,
}

export const TRUCHAS_API_BASE_URL =
  getEnvValue("EXPO_PUBLIC_TRUCHAS_API_URL") || "https://keitha-groveless-tari.ngrok-free.dev"
console.log(`🐟 API Ngrok (Truchas): ${TRUCHAS_API_BASE_URL}`)

export const NEW_API_ENDPOINTS = {
  health: `${TRUCHAS_API_BASE_URL}/api/health`,
  lastReport: `${TRUCHAS_API_BASE_URL}/api/last_report`,
  stats: `${TRUCHAS_API_BASE_URL}/api/stats`,
}

export const TRUCHAS_ENDPOINTS = {
  latest: NEW_API_ENDPOINTS.lastReport,
  stats: NEW_API_ENDPOINTS.stats,
  diarioUltimo: `${TRUCHAS_API_BASE_URL}/api/graphics/truchas/diario-ultimo`,
}
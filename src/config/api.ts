import Constants from "expo-constants"

const getApiBaseUrl = () => {
  const isWeb = Constants.executionEnvironment === "storeClient" ? false : true
  if (isWeb && typeof window !== "undefined") {
    return "http://localhost:5100"
  } else {
    return "http://192.168.1.111:5100"
  }
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

export const TRUCHAS_API_BASE_URL = "https://keitha-groveless-tari.ngrok-free.dev"
console.log(`🐟 API Ngrok (Truchas): ${TRUCHAS_API_BASE_URL}`)

export const NEW_API_ENDPOINTS = {
  health: `${TRUCHAS_API_BASE_URL}/api/health`,
  lastReport: `${TRUCHAS_API_BASE_URL}/api/last_report`,
  stats: `${TRUCHAS_API_BASE_URL}/api/stats`,
}

export const TRUCHAS_ENDPOINTS = {
  latest: NEW_API_ENDPOINTS.lastReport,
  stats: NEW_API_ENDPOINTS.stats,
  diarioUltimo: `${API_BASE_URL}/api/graphics/truchas/diario-ultimo`,
}
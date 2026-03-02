import { AUTH_API_BASE_URL } from "../config/authApi"

interface SolicitarRecuperacionRequest {
  email: string
}

interface VerificarCodigoRequest {
  email: string
  codigo: string
}

interface CambiarContrasenaRequest {
  token: string
  nuevaContrasena: string
}

const fetchWithErrorHandling = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        success: false,
        message:
          data?.message ||
          `Error ${response.status}: ${response.statusText}`,
      }
    }

    return data
  } catch (error: any) {
    return {
      success: false,
      message: "No se pudo conectar con el servidor.",
    }
  }
}


export const recuperacionService = {
  solicitarRecuperacion: async (correo: string) => {
    const response = await fetchWithErrorHandling(
      `${AUTH_API_BASE_URL}/api/recuperacion/solicitar`,
      {
        method: "POST",
        body: JSON.stringify({ Correo: correo }),
      }
    )

    return {
      success: response.success,
      message: response.message,
      codigo: response.codigo,
    }
  },

  verificarCodigo: async (correo: string, codigo: string) => {
    const response = await fetchWithErrorHandling(
      `${AUTH_API_BASE_URL}/api/recuperacion/verificar`,
      {
        method: "POST",
        body: JSON.stringify({ Correo: correo, Codigo: codigo }),
      }
    )

    return {
      success: response.success,
      message: response.message,
      usuarioId: response.usuarioId,
      token: response.token,
    }
  },

  cambiarContrasena: async (token: string, nuevaContrasena: string) => {
    const response = await fetchWithErrorHandling(
      `${AUTH_API_BASE_URL}/api/recuperacion/cambiar-contrasena`,
      {
        method: "POST",
        body: JSON.stringify({
          Token: token,
          NuevaContrasena: nuevaContrasena,
        }),
      }
    )

    return {
      success: response.success,
      message: response.message,
    }
  },

  obtenerCodigoDesarrollo: async (correo: string): Promise<string | null> => {
    console.log("🔧 Código de desarrollo disponible en logs de la API")
    return null
  },
}

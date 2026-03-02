import { Alert } from "react-native"

// Función para detectar la IP local automáticamente
export const detectLocalIP = async (): Promise<string[]> => {
  const commonIPs = [
    "192.168.1.", // Rango común de routers
    "192.168.0.", // Otro rango común
    "10.0.0.", // Rango privado
    "172.16.", // Otro rango privado
  ]

  const possibleIPs: string[] = []

  // Generar IPs posibles en los rangos comunes
  for (const baseIP of commonIPs) {
    for (let i = 1; i <= 254; i++) {
      if (baseIP.includes("172.16.")) {
        possibleIPs.push(`${baseIP}${i}.1`)
      } else {
        possibleIPs.push(`${baseIP}${i}`)
      }
    }
  }

  return possibleIPs
}

// Función para probar conectividad con la API
export const testAPIConnection = async (ip: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos de timeout

    const response = await fetch(`http://${ip}:55838/api/truchas/temperatura/latest`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Función para mostrar ayuda de configuración
export const showNetworkHelp = () => {
  Alert.alert(
    "Configuración de Red",
    `Para conectar con tu API:

1. Encuentra tu IP local:
   • Windows: cmd → ipconfig
   • Mac/Linux: terminal → ifconfig

2. Busca "IPv4" o "inet" 
   Ejemplo: 192.168.1.105

3. Actualiza la IP en src/config/api.ts

4. Verifica que tu API esté corriendo:
   • Debe mostrar datos en el navegador
   • http://localhost:55838/api/truchas/temperatura/latest

5. Configura el firewall:
   • Permitir puerto 55838
   • Permitir conexiones entrantes`,
    [{ text: "Entendido", style: "default" }],
  )
}

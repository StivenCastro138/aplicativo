"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { truchasService, lechugasService } from "../services/apiService";
import { LanguageContext } from "../context/LanguageContext";

export interface Alerta {
  id: string;
  tipo:
    | "temperatura"
    | "ph"
    | "conductividad"
    | "humedad"
    | "oxigeno"
    | "turbidez";
  modulo: "cultivos" | "tanques";
  valor: number;
  limite: { min: number; max: number };
  severidad: "baja" | "media" | "alta" | "critica";
  mensaje: string;
  timestamp: Date;
  vista: boolean;
  ignorada: boolean;
}

interface AlertContextType {
  alertas: Alerta[];
  alertaActual: Alerta | null;
  alertasActivas: Alerta[];
  verificarAlertas: () => Promise<void>;
  marcarComoVista: (id: string) => void;
  ignorarAlerta: (id: string) => void;
  limpiarAlertas: () => void;
}

const LIMITES = {
  truchas: {
    temperatura: { min: 10, max: 20 },
    conductividad: { min: 280, max: 750 },
    ph: { min: 6.5, max: 8.5 },
    oxigeno: { min: 6.0, max: 10.0 },
    turbidez: { min: 0, max: 25.0 },
  },
  lechugas: {
    temperatura: { min: 15, max: 26 },
    humedad: { min: 50, max: 85 },
    ph: { min: 5.5, max: 7.2 },
  },
  cebollines: {
  temperatura: { min: 13, max: 24 },
  humedad: { min: 60, max: 85 },
  ph: { min: 6.0, max: 7.0 },
},
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [alertaActual, setAlertaActual] = useState<Alerta | null>(null);

  const ultimaVerificacionRef = useRef<{ [key: string]: number }>({});
  const languageContext = useContext(LanguageContext);

  if (!languageContext) {
    throw new Error("AlertProvider must be used within a LanguageProvider");
  }

  const { t } = languageContext;

  const calcularSeveridad = (
    valor: number,
    limite: { min: number; max: number },
  ): Alerta["severidad"] => {
    const rango = limite.max - limite.min;
    const diferencia =
      valor < limite.min
        ? limite.min - valor
        : valor > limite.max
          ? valor - limite.max
          : 0;

    if (diferencia >= rango * 0.25) return "critica";
    if (diferencia >= rango * 0.15) return "alta";
    if (diferencia > 0) return "media";
    return "baja";
  };

  const generarMensaje = useCallback(
    (
      tipo: string,
      modulo: string,
      valor: number,
      limite: { min: number; max: number },
    ): string => {
      const moduloNombre =
        modulo === "cultivos"
          ? t("cultivoLechuga") || "Lechugas"
          : t("pecesTruchas") || "Truchas";

      let tipoNombre = tipo.charAt(0).toUpperCase() + tipo.slice(1);
      if (tipo === "ph") tipoNombre = "pH";
      if (tipo === "oxigeno") tipoNombre = "Oxígeno";

      let unidad = "";
      if (tipo === "temperatura") unidad = "°C";
      else if (tipo === "humedad") unidad = "%";
      else if (tipo === "conductividad") unidad = " μS/cm";
      else if (tipo === "oxigeno") unidad = " mg/L";
      else if (tipo === "turbidez") unidad = " NTU";

      if (valor < limite.min) {
        return `${tipoNombre} en ${moduloNombre} muy baja: ${valor}${unidad} (mín: ${limite.min}${unidad})`;
      }
      if (valor > limite.max) {
        return `${tipoNombre} en ${moduloNombre} muy alta: ${valor}${unidad} (máx: ${limite.max}${unidad})`;
      }
      return `${tipoNombre} en ${moduloNombre} normal: ${valor}${unidad}`;
    },
    [t],
  );

  const crearAlerta = useCallback(
    (
      tipo: Alerta["tipo"],
      modulo: Alerta["modulo"],
      valor: number,
      limite: { min: number; max: number },
    ) => {
      const alertaKey = `${tipo}-${modulo}`;
      const ahora = Date.now();
      const ultimoCheck = ultimaVerificacionRef.current[alertaKey] || 0;

      if (ahora - ultimoCheck < 5 * 60 * 1000) return;

      const nuevaAlerta: Alerta = {
        id: `${ahora}-${Math.random().toString(36).substring(2, 9)}`,
        tipo,
        modulo,
        valor: Number(valor.toFixed(2)),
        limite,
        severidad: calcularSeveridad(valor, limite),
        mensaje: generarMensaje(tipo, modulo, valor, limite),
        timestamp: new Date(),
        vista: false,
        ignorada: false,
      };

      ultimaVerificacionRef.current[alertaKey] = ahora;
      setAlertas((prev) => [nuevaAlerta, ...prev].slice(0, 100));
    },
    [generarMensaje],
  );

  const verificarAlertas = useCallback(async () => {
    console.log("🔍 Ejecutando verificación de sensores de alertas...");

    const resultados = await Promise.allSettled([
      lechugasService.getLatestValues(),
      truchasService.getLatestValues(),
    ]);

    if (resultados[0].status === "fulfilled" && resultados[0].value) {
      const d = resultados[0].value;
      const L = LIMITES.lechugas;

      const temp = d.temperatura ?? d.temperaturaC;
      const hum = d.humedad ?? d.humedadPorcentaje;
      const ph = d.ph ?? d.pH;

      if (
        temp !== undefined &&
        temp !== null &&
        (temp < L.temperatura.min || temp > L.temperatura.max)
      )
        crearAlerta("temperatura", "cultivos", temp, L.temperatura);

      if (
        hum !== undefined &&
        hum !== null &&
        (hum < L.humedad.min || hum > L.humedad.max)
      )
        crearAlerta("humedad", "cultivos", hum, L.humedad);

      if (
        ph !== undefined &&
        ph !== null &&
        ph !== 7 &&
        (ph < L.ph.min || ph > L.ph.max)
      )
        crearAlerta("ph", "cultivos", ph, L.ph);
    }

    if (resultados[1].status === "fulfilled" && resultados[1].value) {
      const d = resultados[1].value;
      const T = LIMITES.truchas;

      const temp = d.temperaturaC;
      const cond = d.conductividadUsCm;
      const ph = d.pH;
      const oxy = d.oxigenoMgL;
      const tur = d.turbidezNtu;

      if (
        temp !== undefined &&
        temp !== null &&
        (temp < T.temperatura.min || temp > T.temperatura.max)
      )
        crearAlerta("temperatura", "tanques", temp, T.temperatura);

      if (
        cond !== undefined &&
        cond !== null &&
        (cond < T.conductividad.min || cond > T.conductividad.max)
      )
        crearAlerta("conductividad", "tanques", cond, T.conductividad);

      if (
        ph !== undefined &&
        ph !== null &&
        ph !== 7 &&
        (ph < T.ph.min || ph > T.ph.max)
      )
        crearAlerta("ph", "tanques", ph, T.ph);

      if (
        oxy !== undefined &&
        oxy !== null &&
        (oxy < T.oxigeno.min || oxy > T.oxigeno.max)
      )
        crearAlerta("oxigeno", "tanques", oxy, T.oxigeno);

      if (
        tur !== undefined &&
        tur !== null &&
        (tur < T.turbidez.min || tur > T.turbidez.max)
      )
        crearAlerta("turbidez", "tanques", tur, T.turbidez);
    }
  }, [crearAlerta]);

  const marcarComoVista = useCallback((id: string) => {
    setAlertas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, vista: true } : a)),
    );
  }, []);

  const ignorarAlerta = useCallback((id: string) => {
    setAlertas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ignorada: true } : a)),
    );
  }, []);

  const limpiarAlertas = useCallback(() => {
    setAlertas([]);
    setAlertaActual(null);
    ultimaVerificacionRef.current = {};
  }, []);

  useEffect(() => {
    const siguiente = alertas.find((a) => !a.vista && !a.ignorada);
    setAlertaActual(siguiente || null);
  }, [alertas]);

  useEffect(() => {
    verificarAlertas();
    const interval = setInterval(verificarAlertas, 30000);
    return () => clearInterval(interval);
  }, [verificarAlertas]);

  useEffect(() => {
    if (alertaActual && alertaActual.severidad !== "critica") {
      const timer = setTimeout(() => {
        ignorarAlerta(alertaActual.id);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [alertaActual, ignorarAlerta]);

  const alertasActivas = useMemo(
    () => alertas.filter((a) => !a.vista && !a.ignorada),
    [alertas],
  );

  const contextValue = useMemo(
    () => ({
      alertas,
      alertaActual,
      alertasActivas,
      verificarAlertas,
      marcarComoVista,
      ignorarAlerta,
      limpiarAlertas,
    }),
    [
      alertas,
      alertaActual,
      alertasActivas,
      verificarAlertas,
      marcarComoVista,
      ignorarAlerta,
      limpiarAlertas,
    ],
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
    </AlertContext.Provider>
  );
};

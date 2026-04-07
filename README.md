# Aquaponic Monitor

Aplicacion movil para monitoreo y gestion de sistemas acuaponicos, construida con React Native + Expo + TypeScript.

## Estado del proyecto

- Nombre de app: Aquaponic Monitor
- Version de app (Expo): 2.0.0
- Version de paquete npm: 1.0.0
- Plataforma principal: Android (con soporte iOS/Web en Expo)
- Grupo academico asociado: GISTFA - Universidad de Cundinamarca

## Tabla de contenidos

- [1. Resumen funcional](#1-resumen-funcional)
- [2. Arquitectura real del proyecto](#2-arquitectura-real-del-proyecto)
- [3. Estructura de carpetas](#3-estructura-de-carpetas)
- [4. Tecnologias y dependencias](#4-tecnologias-y-dependencias)
- [5. Requisitos y preparacion del entorno](#5-requisitos-y-preparacion-del-entorno)
- [6. Instalacion y ejecucion](#6-instalacion-y-ejecucion)
- [7. Configuracion de APIs (dato real del codigo)](#7-configuracion-de-apis-dato-real-del-codigo)
- [8. Navegacion y control de acceso](#8-navegacion-y-control-de-acceso)
- [9. Alertas, predicciones y reportes](#9-alertas-predicciones-y-reportes)
- [10. Scripts disponibles](#10-scripts-disponibles)
- [11. Build y distribucion con EAS](#11-build-y-distribucion-con-eas)
- [12. Troubleshooting](#12-troubleshooting)
- [13. Roadmap tecnico sugerido](#13-roadmap-tecnico-sugerido)
- [14. Creditos y contacto](#14-creditos-y-contacto)

## 1. Resumen funcional

Aquaponic Monitor integra dos modulos de monitoreo:

- Cultivos: altura, area foliar, temperatura, humedad, pH.
- Tanques: longitud, peso, alto, ancho, temperatura agua, conductividad, pH, oxigeno disuelto, turbidez.

Capacidades principales implementadas:

- Autenticacion contra API externa con hash SHA-512.
- Sesion persistente con AsyncStorage.
- Alertas automticas por umbrales con severidad y notificacion visual.
- Prediccion con modelos lineales, exponenciales, Von Bertalanffy y SARIMA.
- Generacion de reportes (PDF/CSV) desde el front.
- Soporte de idioma ES/EN y tema claro/oscuro.

## 2. Arquitectura real del proyecto

Arbol de providers y navegacion principal (implementado en App.tsx):

1. GestureHandlerRootView
2. SafeAreaProvider
3. ThemeProvider
4. LanguageProvider
5. AuthProvider
6. AlertProvider
7. NavigationContainer + Stack

Flujo de entrada:

- Sin usuario autenticado: Login y Recuperar contrasena.
- Con usuario autenticado: MainDrawer.

Overlay global:

- Si existe alerta activa, se renderiza AlertOverlay por fuera del contenedor de navegacion para mostrar alerta flotante en cualquier pantalla.

## 3. Estructura de carpetas

Carpetas relevantes del workspace:

- src/components: componentes de UI propios (ejemplo: UserHeader, AlertOverlay).
- src/context: estado global (auth, alertas, idioma, tema).
- src/navigation: navegacion Drawer, Tabs, Stacks.
- src/screens: pantallas funcionales del sistema.
- src/services: integraciones API, prediccion, notificaciones, recuperacion.
- src/config: configuracion de endpoints de datos y auth.
- app, components/ui, hooks, lib: estructura adicional para capa UI y web.
- android: proyecto nativo Android y configuracion Gradle.

## 4. Tecnologias y dependencias

Base tecnica:

- React 19.2.0
- React Native 0.83.2
- Expo 55.0.5
- TypeScript 5.9.2

Navegacion:

- @react-navigation/native
- @react-navigation/native-stack
- @react-navigation/drawer
- @react-navigation/bottom-tabs

Estado y persistencia:

- React Context API
- @react-native-async-storage/async-storage

UI, estilos y animaciones:

- nativewind
- react-native-reanimated
- react-native-gesture-handler
- react-native-safe-area-context
- react-native-chart-kit
- react-native-svg

Servicios Expo usados:

- expo-notifications
- expo-print
- expo-sharing
- expo-file-system
- expo-auth-session
- expo-web-browser
- expo-dev-client

Seguridad:

- crypto-js (SHA-512)

## 5. Requisitos y preparacion del entorno

Minimos recomendados para desarrollo:

- Node.js 18 o superior
- npm (incluido con Node) o yarn
- Android Studio (si usas emulador Android)
- Expo Go en dispositivo fisico (opcional)
- Git

Verifica version de Node:

```bash
node -v
```

## 6. Instalacion y ejecucion

Clonar repositorio real:

```bash
git clone https://github.com/StivenCastro138/aplicativo.git
cd aplicativo
```

Instalar dependencias:

```bash
npm install
```

Ejecutar en modo desarrollo:

```bash
npm start
```

Atajos comunes en Expo:

- a: abrir en Android
- w: abrir en web
- r: recargar bundle

Comandos directos:

```bash
npm run android
npm run ios
npm run web
```

## 7. Configuracion de APIs (dato real del codigo)

Importante: hoy las URLs estan hardcodeadas en codigo, no en variables de entorno.

Archivo de configuracion de sensores:

- src/config/api.ts

Valores actuales detectados:

- API local lechugas (web): http://localhost:5100
- API local lechugas (movil): http://192.168.1.111:5100
- API truchas (ngrok): https://keitha-groveless-tari.ngrok-free.dev

Endpoints lechugas:

- /api/lechugas
- /api/lechugas/latest
- /api/lechugas/stats
- /api/lechugas/altura/latest
- /api/lechugas/area-foliar/latest
- /api/lechugas/temperatura/latest
- /api/lechugas/humedad/latest
- /api/lechugas/ph/latest
- /api/lechugas/range
- /api/graphics/lechugas/diario-ultimo

Endpoints truchas (API nueva):

- /api/health
- /api/last_report
- /api/stats

Archivo de autenticacion:

- src/config/authApi.ts

Base URL auth actual:

- https://capacitive-delora-entreatingly.ngrok-free.dev

Endpoints auth:

- /api/Usuario
- /api/Upa
- /api/ListaActividades
- /api/AsignacionActividad

Notas tecnicas:

- Hash de contrasena: SHA-512 en hexadecimal uppercase (compatible con SQL Server HASHBYTES).
- Validaciones y manejo de error HTTP, CORS, JSON y conectividad implementadas en fetchWithErrorHandling.

## 8. Navegacion y control de acceso

Navegacion principal:

- Stack raiz: Login, ForgotPassword, MainDrawer.
- Drawer: Dashboard, Perfil, Alertas, Usuarios, Reportes, AcercaDe, Ayuda, Politicas, Configuracion.
- Tabs: Home (siempre), Cultivos (si actividad habilitada), Tanques (si actividad habilitada).
- Stack Cultivos: CultivosMain, Predicciones, PrediccionML.
- Stack Tanques: TanquesMain, PrediccionesTanques, PrediccionMLTanques.

Reglas de acceso observadas en codigo:

- Usuario institucional (@ucundinamarca.edu.co): acceso completo (incluye Usuarios y Reportes).
- Usuario @gmail.com: acceso intermedio (incluye Alertas, restringe modulos administrativos).
- Otros dominios: acceso restringido segun validaciones del Drawer.

Habilitacion por actividad:

- Monitoreo Modulo Cultivos
- Monitoreo Modulo Tanques

Estas actividades se verifican en el contexto de autenticacion para mostrar/ocultar tabs.

## 9. Alertas, predicciones y reportes

Alertas (AlertContext):

- Verificacion automatica cada 30 segundos.
- Control anti-spam por tipo/modulo con ventana minima de 5 minutos.
- Auto-ocultar alertas no criticas en 10 segundos.
- Umbrales definidos para truchas y lechugas (temperatura, pH, conductividad, oxigeno, turbidez, humedad).

Prediccion (prediccionService):

- Regresion lineal robusta.
- Modelo Von Bertalanffy para truchas.
- Modelos exponenciales para altura/area en cultivos.
- Uso de historicos por rango de tiempo y procesamiento defensivo de datos.

Reportes:

- El proyecto incorpora dependencias expo-print, expo-sharing y expo-file-system para salida de reportes en dispositivos.

## 10. Scripts disponibles

Definidos en package.json:

- npm start: expo start
- npm run android: expo start --android
- npm run ios: expo start --ios
- npm run web: expo start --web
- npm test: jest --coverage

Cobertura de tests:

- Preset: react-native
- Reportes: lcov y text
- Carpeta de salida: coverage

## 11. Build y distribucion con EAS

Configuracion en eas.json:

- profile development: developmentClient true, distribution internal
- profile preview: distribution internal, android buildType apk
- profile production: autoIncrement true

Pasos tipicos EAS:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
eas build -p android --profile production
```

Dato de Expo config:

- package Android: com.anonymous.aquaponicmonitor
- projectId EAS presente en app.json

## 12. Troubleshooting

1. No cargan datos en movil

- Verifica que el backend local responda en la IP LAN configurada (actualmente 192.168.1.111).
- Asegura que movil y servidor esten en la misma red.
- Revisa firewall de Windows para puerto 5100.

2. No funciona autenticacion

- Valida que el tunnel ngrok de auth siga activo.
- Prueba endpoint /api/Usuario desde navegador/Postman.

3. Error de CORS o Network request failed

- Revisar configuracion CORS del backend .NET.
- Confirmar esquema HTTPS y URL vigente del tunnel.

4. Alertas no aparecen

- Verifica que existan lecturas fuera de umbral.
- Confirma que AlertProvider este cargado (lo esta desde App.tsx).

## 13. Roadmap tecnico sugerido

Mejoras recomendadas para produccion:

1. Mover URLs hardcodeadas a variables EXPO_PUBLIC_*.
2. Agregar archivo LICENSE si se desea publicar como open source.
3. Añadir pipeline CI (lint, test, build preview).
4. Separar configuracion por ambiente (dev/staging/prod).
5. Endurecer tipado de respuestas API para evitar any.

## 14. Creditos y contacto

Repositorio oficial:

- https://github.com/StivenCastro138/aplicativo

Proyecto academico:

- Grupo de investigacion GISTFA
- Universidad de Cundinamarca

Mantenimiento actual:

- Ver historial de contributors en el repositorio GitHub.

## Licencia

En este repositorio no se detecta actualmente un archivo LICENSE en la raiz. Si deseas definir licencia publica, agrega LICENSE con el texto legal correspondiente.


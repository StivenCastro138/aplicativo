param(
  [string]$Port = "5100"
)

$Domain = "tinsel-canteen-parasitic.ngrok-free.dev"

# Evita ERR_NGROK_334 por sesiones locales previas abiertas.
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

$helpText = (ngrok http --help 2>&1 | Out-String)

if ($helpText -match "--domain") {
  ngrok http --domain=$Domain $Port
} elseif ($helpText -match "--hostname") {
  ngrok http --hostname=$Domain $Port
} else {
  Write-Error "Esta versión de ngrok no soporta --domain ni --hostname."
  exit 1
}
# Script para baixar pdf.js e pdf.worker.js para a pasta app-usuario/libs
# Execute este script na raiz do repositório na sua VPS (PowerShell Core ou Windows PowerShell).

$libDir = Join-Path -Path (Get-Location) -ChildPath "app-usuario\libs"
if (-not (Test-Path $libDir)) {
    New-Item -ItemType Directory -Path $libDir -Force | Out-Null
}

$version = '4.0.379'
$baseCdn = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/$version"
$files = @(
    @{ url = "$baseCdn/pdf.min.js"; out = "pdf.min.js" },
    @{ url = "$baseCdn/pdf.worker.min.js"; out = "pdf.worker.min.js" }
)

foreach ($f in $files) {
    $outPath = Join-Path $libDir $($f.out)
    Write-Host "Baixando $($f.url) -> $outPath ..."
    try {
        Invoke-WebRequest -Uri $f.url -OutFile $outPath -UseBasicParsing -ErrorAction Stop
        Write-Host "Salvo: $outPath" -ForegroundColor Green
    } catch {
        Write-Warning "Falha ao baixar $($f.url): $_"
    }
}

Write-Host "\nVerifique os arquivos em: $libDir" -ForegroundColor Cyan
Write-Host "Depois abra seu servidor HTTP (ex: python -m http.server 8000) na raiz do projeto e acesse: http://localhost:8000/app-usuario/dashboard.html" -ForegroundColor Yellow

# Opcional: mostra tamanho dos arquivos baixados
Get-ChildItem -Path $libDir | Select-Object Name, Length | Format-Table -AutoSize

Write-Host "\nSe o download falhar no PowerShell, tente usar curl ou wget (Linux)." -ForegroundColor Magenta

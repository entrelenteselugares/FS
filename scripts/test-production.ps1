Write-Host "🚀 Iniciando Ciclo de Certificação em PRODUÇÃO - Foto Segundo v3.2" -ForegroundColor Cyan

$results = @()
$suites = @("e2e/profissional-certification.spec.ts", "e2e/franqueado-certification.spec.ts", "e2e/admin-certification.spec.ts")

$env:PLAYWRIGHT_BASE_URL = "https://foto-segundo.vercel.app"

foreach ($suite in $suites) {
    Write-Host "🔍 Executando em Produção: $suite..." -ForegroundColor Yellow
    npx playwright test $suite --workers=1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PASS: $suite" -ForegroundColor Green
        $results += [PSCustomObject]@{ Suite = $suite; Status = "PASS" }
    } else {
        Write-Host "❌ FAIL: $suite" -ForegroundColor Red
        $results += [PSCustomObject]@{ Suite = $suite; Status = "FAIL" }
    }
}

Write-Host "📊 Resumo Final de Produção:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$fail = $false
foreach ($r in $results) {
    if ($r.Status -eq "FAIL") { $fail = $true }
}

if ($fail) {
    Write-Host "❌ Algumas suites falharam na Produção." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✨ Todas as suites passaram em Produção!" -ForegroundColor Green
    exit 0
}

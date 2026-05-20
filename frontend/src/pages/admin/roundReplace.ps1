Get-ChildItem -Path 'c:/foto-segundo/frontend/src/pages/admin' -Filter *.tsx -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'rounded-\[[^\]]+\]', 'rounded-2xl'
    Set-Content -Path $_.FullName -Value $newContent
}

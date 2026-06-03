# Run Robot Framework tests one-by-one and save results
$resultsDir = "$PSScriptRoot\results"
if (-Not (Test-Path $resultsDir)) { New-Item -ItemType Directory -Path $resultsDir | Out-Null }
$tests = Get-ChildItem -Path "$PSScriptRoot\tests" -Filter *.robot | Sort-Object Name
foreach ($t in $tests) {
    Write-Host "Running $($t.Name)"
    robot -d $resultsDir $t.FullName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Test $($t.Name) failed with exit code $LASTEXITCODE" -ForegroundColor Red
    } else {
        Write-Host "Test $($t.Name) passed" -ForegroundColor Green
    }
}
Write-Host "All tests executed. Results directory: $resultsDir"

# Windows PowerShell script (no installs required)
$inputFile = ".glitch-assets"
$outputDir = "assets"

# Create output directory
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Load assets and filter out deleted
$lines = Get-Content $inputFile | ConvertFrom-Json
$deleted = @{}

foreach ($line in $lines) {
    if ($line.deleted -eq $true) {
        $deleted[$line.uuid] = $true
    }
}

foreach ($line in $lines) {
    if ($line.url -and !$deleted.ContainsKey($line.uuid)) {
        $filename = Split-Path $line.url -Leaf
        $targetPath = Join-Path $outputDir $filename
        Write-Host "Downloading $filename..."
        Invoke-WebRequest -Uri $line.url -OutFile $targetPath
    }
}

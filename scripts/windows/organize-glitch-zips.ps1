$destination = "Glitch-Projects"

# Create destination folder if it doesn't exist
if (-not (Test-Path -Path $destination)) {
    New-Item -ItemType Directory -Path $destination | Out-Null
}

# Store list of extracted files
$extracted = @()

# Extract matching ZIP files
Get-ChildItem -Path . -Filter "glitch-project-*.zip" | ForEach-Object {
    $zipFile = $_.FullName
    $name = $_.BaseName -replace '^glitch-project-', ''
    $outputPath = Join-Path -Path $destination -ChildPath $name

    Write-Host "Extracting $($_.Name) to $outputPath"
    New-Item -ItemType Directory -Path $outputPath -Force | Out-Null
    Expand-Archive -Path $zipFile -DestinationPath $outputPath -Force
    $extracted += $zipFile
}

Write-Host "`nAll projects extracted into $destination"

# Ask if user wants to delete the zips
if ($extracted.Count -gt 0) {
    $choice = Read-Host "`nDelete the original zip files? (y/n)"
    if ($choice -eq 'y') {
        foreach ($file in $extracted) {
            Remove-Item -Path $file
            Write-Host "Deleted $file"
        }
    } else {
        Write-Host "ZIP files retained."
    }
}

# Pause before exit
Read-Host "`nPress Enter to exit"

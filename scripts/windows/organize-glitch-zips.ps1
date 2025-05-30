# Extract & Organize Glitch Projects

$destination = "Glitch-Projects"

# 1) Create main folder and subfolders
$subdirs = @("personal","shared","deleted")
if (-not (Test-Path -Path $destination)) {
    New-Item -ItemType Directory -Path $destination | Out-Null
}

foreach ($sub in $subdirs) {
    $subPath = Join-Path $destination $sub
    if (-not (Test-Path $subPath)) {
        New-Item -ItemType Directory -Path $subPath | Out-Null
    }
}

# 2) Collect extracted zips
$extracted = @()

# 3) Regex to capture label & domain
$pattern = '^glitch-project-(personal|shared|deleted)-(.+)$'

Get-ChildItem -Path . -Filter "glitch-project-*.tgz" | ForEach-Object { # <--- MODIFIED FILTER
    $archiveFile = $_.FullName # Renamed variable for clarity, $zipFile also works
    $base = $_.BaseName

    if ($base -match $pattern) {
        $label = $matches[1]
        $projDomain = $matches[2]
        $outputDir = Join-Path "$destination\$label" $projDomain

        Write-Host "Extracting $($_.Name) (TGZ) -> $outputDir"
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

        try {
            tar -xzf "$archiveFile" -C "$outputDir"
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "tar command may have failed for '$($_.Name)' with exit code $LASTEXITCODE."
            } else {
                Write-Host "Successfully extracted '$($_.Name)' to '$outputDir'"
                $extracted += $archiveFile
            }
        } catch {
            Write-Error "An error occurred during tar extraction for '$($_.Name)': $_"
        }
    }
    else {
        Write-Warning "Skipping ‘$base’: unexpected filename format (pattern did not match)"
    }
}

Write-Host "`nAll projects extracted into '$destination'."

# 5) Offer to delete the ZIPs
if ($extracted.Count -gt 0) {
    $choice = Read-Host "`nDelete the succesfully extracted original tgz files? (y/n)"
    if ($choice -ieq 'y') {
        foreach ($file in $extracted) {
            Remove-Item -Path $file -Force
            Write-Host "Deleted $file"
        }
    } else {
        Write-Host "ZIP files retained."
    }
}

# 6) Pause before exit
Read-Host "`nPress Enter to exit"

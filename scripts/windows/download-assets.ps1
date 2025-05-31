# download-assets.ps1
# ——————————————————————————————————————————————————————————————————————————
# Download each project’s assets into its own assets/ folder
# under Glitch-Projects/{personal,shared,deleted}/{project}/assets/
# ——————————————————————————————————————————————————————————————————————————

# 1) Find the Glitch-Projects root
$roots = Get-ChildItem -Path . -Directory -Filter "Glitch-Projects"
if ($roots.Count -eq 0) {
    Write-Error "No 'Glitch-Projects*' folder found. Please run the project-extraction script first."
    Read-Host "Press Enter to exit"
    exit 1
}
# If you have multiple, we’ll process them all—but typically there’s only one.
foreach ($root in $roots) {

    Write-Host "Processing root folder: $($root.Name)`n"

    # 2) For each category subfolder
    Get-ChildItem -Path $root.FullName -Directory | ForEach-Object {
        $categoryDir = $_

        # 3) For each project folder
        Get-ChildItem -Path $categoryDir.FullName -Directory | ForEach-Object {
            $projectDir = $_
            Write-Host "`n-- Processing project: '$($projectDir.Name)'"
            $assetFile = Join-Path $projectDir.FullName "\app\.glitch-assets"

            if (-not (Test-Path $assetFile)) {
                Write-Warning "Skipping '$($projectDir.Name)' (no .glitch-assets file)"
                return
            }
            Write-Host "  Found .glitch-assets at: '$assetFile'"

            # Prepare the assets output directory
            $assetDir = Join-Path $projectDir.FullName "assets"
            if (-not (Test-Path $assetDir)) {
                Write-Host "  Creating assets directory: '$assetDir'"
                New-Item -ItemType Directory -Path $assetDir | Out-Null
            }
            else {
                Write-Host "  Assets directory already exists: '$assetDir'"
            }

            Write-Host "  → Downloading assets for project '$($projectDir.Name)'"

            # 5) Read line-by-line JSON
            Get-Content $assetFile | ForEach-Object {
                try {
                    $asset = $_ | ConvertFrom-Json
                }
                catch {
                    Write-Warning "    Invalid JSON: $_"
                    return
                }

                # Skip deleted assets or missing URLs
                if (-not $asset.url -or $asset.deleted) { return }

                # Rewrite CDN domain
                $url = $asset.url `
                    -replace 'cdn\.hyperdev\.com', 'cdn.glitch.me' `
                    -replace 'cdn\.glitch\.global', 'cdn.glitch.me'
                $filename = [IO.Path]::GetFileName($url)
                $targetPath = Join-Path $assetDir $filename

                Write-Host "    Downloading $filename..."
                try {
                    $wc = New-Object System.Net.WebClient
                    $wc.DownloadFile($url, $targetPath)
                    $wc.Dispose()
                }
                catch {
                    Write-Warning "      Failed: $url → $_"
                }
            }

            Write-Host "    Done with $($projectDir.Name)`n"
        }
    }
}

Write-Host "`nAll assets have been processed."
Read-Host "Press Enter to exit"

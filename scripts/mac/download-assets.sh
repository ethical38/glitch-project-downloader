#!/usr/bin/env bash
set -euo pipefail

# download-assets.sh
# Download each project’s assets into its own assets/ folder and project-specific logs
# under Glitch-Projects/{personal,shared,deleted}/{project}/assets/

# Dependencies
for cmd in jq curl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: '$cmd' is required. Please install it."
    exit 1
  fi
done

ROOT="Glitch-Projects"
if [ ! -d "$ROOT" ]; then
  echo "No '$ROOT' folder found. Please run the project-extraction script first."
  read -rp "Press Enter to exit..."
  exit 1
fi

echo
# Iterate categories
for categoryDir in "$ROOT"/*/; do
  [ -d "$categoryDir" ] || continue
  category=$(basename "$categoryDir")
  echo "=== Category: $category ==="

  # Iterate projects
  for projectDir in "$categoryDir"/*/; do
    [ -d "$projectDir" ] || continue
    projectName=$(basename "$projectDir")
    echo
    echo "-- Processing project: '$projectName'"

    # Setup log
    projectLog="$projectDir/${projectName}-asset-download-log.txt"
    printf 'Status:Reason:URL\n' > "$projectLog"

    downloaded=0
    skipped=0
    failed=0

    assetFile="$projectDir/app/.glitch-assets"
    if [ ! -f "$assetFile" ]; then
      echo "   Skipping '$projectName' (no .glitch-assets file)"
      continue
    fi

    # Ensure assets dir
    assetDir="$projectDir/assets"
    mkdir -p "$assetDir"

    echo "   → Downloading assets for project '$projectName'"

    # Read each JSON line
    while IFS= read -r line; do
      url=$(printf '%s' "$line" | jq -r '.url // empty')
      deleted=$(printf '%s' "$line" | jq -r '.deleted // false')
      name=$(printf '%s' "$line" | jq -r '.name // empty')

      if [ -z "$url" ]; then
        echo "failed:missing_url:$name" >> "$projectLog"
        skipped=$((skipped+1))
        continue
      fi
      if [ "$deleted" = "true" ]; then
        echo "failed:deleted:$url" >> "$projectLog"
        skipped=$((skipped+1))
        continue
      fi

      # Rewrite CDN domain
      newurl=${url//cdn.hyperdev.com/cdn.glitch.me}

      # Strip query string
      urlNoQuery=${newurl%%\?*}

      # Extract uuid and original filename
      path=${urlNoQuery#*://*/}
      uuid=${path%%/*}
      origName=${path#*/}
      filename="${uuid}-${origName}"
      targetPath="$assetDir/$filename"

      if [ -f "$targetPath" ]; then
        echo "downloaded:exists:$url" >> "$projectLog"
        downloaded=$((downloaded+1))
        continue
      fi

      # Download with curl, capture HTTP status
      http_status=$(curl -s -w '%{http_code}' -L "$newurl" -o "$targetPath" || true)
      if [ "$http_status" = "200" ]; then
        echo "downloaded:success:$url" >> "$projectLog"
        downloaded=$((downloaded+1))
      else
        echo "failed:$http_status:$url" >> "$projectLog"
        failed=$((failed+1))
        # remove partial file if any
        [ -f "$targetPath" ] && rm -f "$targetPath"
      fi

    done < "$assetFile"

    # Project summary
    echo "   Completed '$projectName': Downloaded $downloaded, Skipped $skipped, Failed $failed"
    echo "   Detailed log: $projectLog"
  done
done

echo
echo "All assets processed for all projects."
read -rp "Press Enter to exit..."

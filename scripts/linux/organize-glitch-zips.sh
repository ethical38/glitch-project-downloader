#!/bin/bash
set -euo pipefail

DEST_DIR="Glitch-Projects"
mkdir -p "$DEST_DIR"

extracted=()

for zip in glitch-project-*.zip; do
    [ -e "$zip" ] || continue
    base=$(basename "$zip" .zip)
    name="${base#glitch-project-}"
    outdir="$DEST_DIR/$name"
    echo "Extracting $zip to $outdir"
    mkdir -p "$outdir"
    unzip -q "$zip" -d "$outdir"
    extracted+=("$zip")
done

echo ""
echo "All projects extracted into $DEST_DIR"

# Ask if user wants to delete the zips
if [ ${#extracted[@]} -gt 0 ]; then
    echo ""
    read -p "Delete the original zip files? (y/n): " choice
    if [[ "$choice" == "y" ]]; then
        for file in "${extracted[@]}"; do
            rm "$file"
            echo "Deleted $file"
        done
    else
        echo "ZIP files retained."
    fi
fi

# Keep terminal open
echo ""
read -p "Press Enter to exit..."

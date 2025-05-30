#!/bin/bash
set -euo pipefail

DEST_DIR="Glitch-Projects"
SUBDIRS=(personal shared deleted)

# 1) Create main folder + category subfolders
mkdir -p "$DEST_DIR"
for sub in "${SUBDIRS[@]}"; do
  mkdir -p "$DEST_DIR/$sub"
done

extracted=()

# 2) Process each zip
for zip in glitch-project-*.zip; do
  [ -e "$zip" ] || continue
  base="${zip%.zip}"                       # e.g. glitch-project-personal-myapp
  name="${base#glitch-project-}"           # e.g. personal-myapp

  # split into label and domain
  label="${name%%-*}"                      # 'personal', 'shared' or 'deleted'
  domain="${name#*-}"                      # the rest (allows hyphens)

  outdir="$DEST_DIR/$label/$domain"

  echo "Extracting $zip → $outdir"
  mkdir -p "$outdir"
  unzip -q "$zip" -d "$outdir"
  extracted+=("$zip")
done

echo
echo "All projects extracted into $DEST_DIR"

# 3) Offer to delete the ZIPs
if [ "${#extracted[@]}" -gt 0 ]; then
  echo
  read -p "Delete the original zip files? (y/n): " choice
  if [[ "$choice" == "y" ]]; then
    for file in "${extracted[@]}"; do
      rm -f "$file"
      echo "Deleted $file"
    done
  else
    echo "ZIP files retained."
  fi
fi

# 4) Pause before exit (only needed if run interactively)
echo
read -p "Press Enter to exit..."

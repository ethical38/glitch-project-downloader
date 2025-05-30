#!/usr/bin/env bash
set -euo pipefail

DEST_DIR="Glitch-Projects"
SUBDIRS=(personal shared deleted)

# 1) Create main folder and subfolders
mkdir -p "$DEST_DIR"
for sub in "${SUBDIRS[@]}"; do
  mkdir -p "$DEST_DIR/$sub"
done

extracted=()

# 2) Regex to capture label & domain
pattern='^glitch-project-(personal|shared|deleted)-(.+)$'

# 3) Process each TGZ
for archive in glitch-project-*.tgz; do
  [[ -e $archive ]] || continue
  base="${archive%.tgz}"    # strip extension

  if [[ $base =~ $pattern ]]; then
    label="${BASH_REMATCH[1]}"
    projDomain="${BASH_REMATCH[2]}"
    outdir="$DEST_DIR/$label/$projDomain"

    echo "Extracting '$archive' (TGZ) → '$outdir'"
    mkdir -p "$outdir"

    if tar -xzf "$archive" -C "$outdir"; then
      echo "  ✅ Successfully extracted '$archive'"
      extracted+=("$archive")
    else
      echo "  ⚠️  tar failed for '$archive'" >&2
    fi
  else
    echo "Skipping '$base': unexpected filename format" >&2
  fi
done

echo
echo "All projects extracted into '$DEST_DIR'."

# 4) Offer to delete the originals
if (( ${#extracted[@]} )); then
  read -rp $'\nDelete the successfully extracted original tgz files? (y/n): ' choice
  if [[ $choice == [Yy] ]]; then
    for f in "${extracted[@]}"; do
      rm -f "$f"
      echo "Deleted '$f'"
    done
  else
    echo "TGZ files retained."
  fi
fi

# 5) Pause before exit (only for interactive use)
read -rp $'\nPress Enter to exit...' _

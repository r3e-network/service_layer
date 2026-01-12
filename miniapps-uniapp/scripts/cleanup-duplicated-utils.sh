#!/bin/bash
# Cleanup duplicated utility files from miniapps
# These should use shared/utils instead

APPS_DIR="apps"
SHARED_UTILS="shared/utils"
DUPLICATED_FILES=("neo.ts" "format.ts" "hash.ts" "price.ts" "i18n.ts" "theme.ts" "price.test.ts")

echo "=== Cleaning up duplicated utility files ==="
echo "Shared utils location: $SHARED_UTILS"
echo ""

count=0
for app_dir in "$APPS_DIR"/*/; do
    app_name=$(basename "$app_dir")
    utils_dir="$app_dir/src/shared/utils"
    
    if [ -d "$utils_dir" ]; then
        for file in "${DUPLICATED_FILES[@]}"; do
            if [ -f "$utils_dir/$file" ]; then
                echo "Removing: $utils_dir/$file"
                rm "$utils_dir/$file"
                ((count++))
            fi
        done
        
        # Remove empty utils directory
        if [ -z "$(ls -A "$utils_dir" 2>/dev/null)" ]; then
            echo "Removing empty dir: $utils_dir"
            rmdir "$utils_dir"
        fi
    fi
done

echo ""
echo "=== Cleanup complete: $count files removed ==="

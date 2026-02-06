#!/bin/bash

# Fix SR field names from 'SR FieldName' to 'FieldName (SR)'
# This script converts all field references to match Airtable's actual field naming

cd "$(dirname "$0")"

# Use perl for in-place replacement with regex
perl -i -pe "s/'SR ([^']+)'/'\\1 (SR)'/g" src/index.ts

echo "✅ All field names updated from 'SR FieldName' to 'FieldName (SR)'"
echo "Verifying a few examples:"
grep -n "Player URL (SR)" src/index.ts | head -3
grep -n "Data Status (SR)" src/index.ts | head -3

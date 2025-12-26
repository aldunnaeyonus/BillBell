#!/bin/bash

# --- CONFIGURATION ---
API_KEY="AIzaSyCK2laJ-jDKODPsR8VhLvGZiA_qoOSaLsU"
SOURCE_FILE="/Users/andrewdunn/Documents/GitHubDunn/BillBell/src/locales/en.json"
MODEL="gemini-2.5-flash"
#LANGUAGES=("es-MX", "es-ES", "es" "de" "nl" "fr" "it" "ja" "zh-Hans" "pt-BR", "pt-PT", "zh-CN", "zh-Hant", "pt", "zh", "es-149", "ko-KR" )
LANGUAGES=("ko-KR" )

# ---------------------

if [ -z "$API_KEY" ]; then
    echo "❌ Error: API_KEY is empty."
    exit 1
fi

if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Error: $SOURCE_FILE not found."
    exit 1
fi

OUTPUT_DIR=$(dirname "$SOURCE_FILE")
RAW_CONTENT=$(cat "$SOURCE_FILE")

echo "📂 Working in: $OUTPUT_DIR"
echo "----------------------------------------"

for LANG in "${LANGUAGES[@]}"; do
    echo "Translating to $LANG..."

    # PROMPT: Explicitly asking for JSON only
    PROMPT="Translate the JSON values to ${LANG}. Do not change keys. Return valid JSON only."
    
    # PAYLOAD: Added SAFETY SETTINGS to prevent 'null' blocks on financial terms
    jq -n \
      --arg prompt "$PROMPT" \
      --arg json "$RAW_CONTENT" \
      --arg temp "0.2" \
      '{
        contents: [{ parts: [{ text: ($prompt + " " + $json) }] }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ],
        generationConfig: { temperature: ($temp | tonumber) }
      }' > payload.json

    # REQUEST
    RESPONSE=$(curl -s -X POST \
      -H "Content-Type: application/json" \
      -d @payload.json \
      "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}")

    # DEBUG: Check if we got an error instead of candidates
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error.message // empty')
    
    if [ ! -z "$ERROR_MSG" ]; then
        echo "❌ API ERROR for $LANG:"
        echo "$ERROR_MSG"
        # Skip to next language if this one failed
        continue
    fi

    # EXTRACT TEXT
    TRANSLATED_TEXT=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text // empty')

    if [ -z "$TRANSLATED_TEXT" ]; then
        echo "⚠️  Warning: API returned success but no text (Check Safety Filters in debug output)."
        echo "Debug Raw Response: $RESPONSE"
        continue
    fi

    # CLEANUP & SAVE
    CLEAN_JSON=$(echo "$TRANSLATED_TEXT" | sed 's/```json//g' | sed 's/```//g')
    OUTPUT_PATH="$OUTPUT_DIR/${LANG}.json"

    if echo "$CLEAN_JSON" | jq . > /dev/null 2>&1; then
        echo "$CLEAN_JSON" > "$OUTPUT_PATH"
        echo "✅ Saved: $OUTPUT_PATH"
    else
        echo "❌ JSON Parse Error for $LANG. The model returned invalid JSON."
        echo "Raw Output: $CLEAN_JSON"
    fi

    sleep 2
done

# Cleanup
rm payload.json
echo "----------------------------------------"
echo "All done!"

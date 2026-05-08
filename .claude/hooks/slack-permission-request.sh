#!/bin/bash
# Claude Code PermissionRequest 훅 — 슬랙으로 권한 요청 알림 전송

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "알 수 없는 도구"')
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // {}')

# 도구별 요약 메시지 생성
case "$TOOL_NAME" in
  Bash)
    SUMMARY=$(echo "$TOOL_INPUT" | jq -r '.command // ""' | head -c 100)
    ;;
  Write|Edit|MultiEdit)
    SUMMARY=$(echo "$TOOL_INPUT" | jq -r '.file_path // ""')
    ;;
  *)
    SUMMARY=$(echo "$TOOL_INPUT" | jq -r 'to_entries | map("\(.key): \(.value)") | join(", ")' | head -c 100)
    ;;
esac

PROJECT=$(basename "${CLAUDE_PROJECT_DIR:-$(pwd)}")
TIMESTAMP=$(date '+%H:%M:%S')

PAYLOAD=$(jq -n \
  --arg project "$PROJECT" \
  --arg tool "$TOOL_NAME" \
  --arg summary "$SUMMARY" \
  --arg time "$TIMESTAMP" \
  '{
    "text": ":lock: *[\($project)] 권한 요청* — \($time)",
    "attachments": [
      {
        "color": "#FFA500",
        "fields": [
          {"title": "도구", "value": $tool, "short": true},
          {"title": "내용", "value": (if $summary != "" then $summary else "(내용 없음)" end), "short": false}
        ],
        "footer": "Claude Code"
      }
    ]
  }')

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$SLACK_WEBHOOK_URL" > /dev/null 2>&1

exit 0

#!/bin/bash
# Claude Code Stop 훅 — 슬랙으로 작업 완료 알림 전송

# .claude/away 파일이 없으면 알림 비활성화
[ ! -f "$(dirname "$0")/../away" ] && cat > /dev/null && exit 0

INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""' | head -c 8)
PROJECT=$(basename "${CLAUDE_PROJECT_DIR:-$(pwd)}")
TIMESTAMP=$(date '+%H:%M:%S')

PAYLOAD=$(jq -n \
  --arg project "$PROJECT" \
  --arg session "$SESSION_ID" \
  --arg time "$TIMESTAMP" \
  '{
    "text": ":white_check_mark: *[\($project)] 작업 완료* — \($time)",
    "attachments": [
      {
        "color": "#36A64F",
        "fields": [
          {"title": "세션", "value": (if $session != "" then $session else "-" end), "short": true},
          {"title": "프로젝트", "value": $project, "short": true}
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

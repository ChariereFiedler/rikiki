#!/usr/bin/env bash
# Roll the live deployment back to a previous commit's image.
#
#   ./scripts/rollback.sh <short-sha>
#
# The pipeline tags every successful build twice:
#   registry.tordu-jardin.fr/rikiki:<CI_COMMIT_SHORT_SHA>
#   registry.tordu-jardin.fr/rikiki:latest
# `:latest` is what Portainer pulls on redeploy. To roll back we:
#   1. Pull the target SHA image from the registry
#   2. Retag it as `:latest`
#   3. Push the new `:latest`
#   4. Ask Portainer to PUT the stack with PullImage+ForceRecreate
#
# Requires: docker CLI, curl, jq, and these env vars:
#   TJ_REGISTRY            (e.g. registry.tordu-jardin.fr)
#   TJ_REGISTRY_USER
#   TJ_REGISTRY_PASSWORD
#   TJ_PORTAINER_URL       (e.g. https://portainer.tordu-jardin.fr)
#   TJ_PORTAINER_KEY
# Same secrets the CI job already uses · for a local rollback, source
# them from your shell's ~/.config or whatever you keep them in.

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: $0 <short-sha>" >&2
  echo "example: $0 86ab72ab" >&2
  exit 1
fi

TARGET_SHA="$1"
STACK_NAME="${STACK_NAME:-rikiki}"
STACK_ID="${STACK_ID:-54}"
IMAGE="${TJ_REGISTRY:?missing TJ_REGISTRY}/${IMAGE_NAME:-rikiki}"

for var in TJ_REGISTRY_USER TJ_REGISTRY_PASSWORD TJ_PORTAINER_URL TJ_PORTAINER_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "error: $var is not set" >&2
    exit 1
  fi
done

echo "── rollback target · ${IMAGE}:${TARGET_SHA}"

# 1. Confirm the target tag exists before we touch anything.
TOKEN_RESP=$(curl -sf -u "${TJ_REGISTRY_USER}:${TJ_REGISTRY_PASSWORD}" \
  "https://${TJ_REGISTRY}/v2/${IMAGE_NAME:-rikiki}/tags/list" 2>/dev/null) || {
  echo "warning · could not list tags (registry may not expose v2 to user creds), trying pull anyway"
  TOKEN_RESP=''
}
if [ -n "$TOKEN_RESP" ]; then
  if ! echo "$TOKEN_RESP" | jq -e --arg t "$TARGET_SHA" '.tags[] | select(. == $t)' >/dev/null; then
    echo "error · tag ${TARGET_SHA} not found in registry" >&2
    echo "available tags (truncated):" >&2
    echo "$TOKEN_RESP" | jq -r '.tags[]' | tail -10 >&2
    exit 1
  fi
fi

# 2. Pull, retag, push.
echo "── pull ${IMAGE}:${TARGET_SHA}"
docker login "$TJ_REGISTRY" -u "$TJ_REGISTRY_USER" -p "$TJ_REGISTRY_PASSWORD" >/dev/null
docker pull "${IMAGE}:${TARGET_SHA}"

echo "── retag ${IMAGE}:${TARGET_SHA} → ${IMAGE}:latest"
docker tag "${IMAGE}:${TARGET_SHA}" "${IMAGE}:latest"
docker push "${IMAGE}:latest"

# 3. Trigger Portainer to re-pull and recreate.
echo "── trigger Portainer redeploy of stack ${STACK_NAME} (id ${STACK_ID})"
endpoint_id=$(curl -sk -H "X-API-Key: $TJ_PORTAINER_KEY" \
  "${TJ_PORTAINER_URL}/api/endpoints" | jq -r '.[0].Id')
stack_compose=$(curl -sk -H "X-API-Key: $TJ_PORTAINER_KEY" \
  "${TJ_PORTAINER_URL}/api/stacks/${STACK_ID}/file" | jq -r '.StackFileContent')
stack_env=$(curl -sk -H "X-API-Key: $TJ_PORTAINER_KEY" \
  "${TJ_PORTAINER_URL}/api/stacks/${STACK_ID}" | jq '.Env // []')

# Append a redeploy marker so Portainer applies ForceRecreate even when
# the compose file is byte-identical to the previous one (same Portainer
# quirk the upstream template works around).
marker="# rolled-back to ${TARGET_SHA} at $(date -u +%FT%TZ)"
patched_compose=$(printf '%s\n%s\n' "$stack_compose" "$marker")

payload=$(jq -n --arg c "$patched_compose" --argjson e "$stack_env" \
  '{StackFileContent: $c, Env: $e, PullImage: true, Prune: false, ForceRecreate: true}')

http_code=$(curl -sk -o /tmp/rollback-response.json -w '%{http_code}' -X PUT \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $TJ_PORTAINER_KEY" \
  -d "$payload" \
  "${TJ_PORTAINER_URL}/api/stacks/${STACK_ID}?endpointId=${endpoint_id}")

if [ "$http_code" != "200" ]; then
  echo "error · Portainer returned HTTP $http_code" >&2
  cat /tmp/rollback-response.json >&2
  exit 1
fi

echo "── done · rolled back to ${TARGET_SHA}"
echo "── verify · curl -I https://rikiki.tordu-jardin.fr/"

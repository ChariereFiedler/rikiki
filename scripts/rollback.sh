#!/usr/bin/env bash
# Rollback to a previous commit's image.
#   ./scripts/rollback.sh <short-sha>
# Needs TJ_REGISTRY_USER, TJ_REGISTRY_PASSWORD, TJ_PORTAINER_URL, TJ_PORTAINER_KEY.
set -euo pipefail

[ $# -eq 1 ] || { echo "usage: $0 <short-sha>" >&2; exit 1; }
SHA="$1"
IMAGE="registry.tordu-jardin.fr/rikiki"
STACK_ID=54

docker login registry.tordu-jardin.fr -u "$TJ_REGISTRY_USER" -p "$TJ_REGISTRY_PASSWORD" >/dev/null
docker pull "${IMAGE}:${SHA}"
docker tag "${IMAGE}:${SHA}" "${IMAGE}:latest"
docker push "${IMAGE}:latest"

# Ask Portainer to redeploy. We append a timestamp marker to the compose
# to force ForceRecreate to actually take effect (Portainer quirk).
endpoint=$(curl -sk -H "X-API-Key: $TJ_PORTAINER_KEY" "$TJ_PORTAINER_URL/api/endpoints" | jq -r '.[0].Id')
compose=$(curl -sk -H "X-API-Key: $TJ_PORTAINER_KEY" "$TJ_PORTAINER_URL/api/stacks/${STACK_ID}/file" | jq -r '.StackFileContent')
env=$(curl -sk -H "X-API-Key: $TJ_PORTAINER_KEY" "$TJ_PORTAINER_URL/api/stacks/${STACK_ID}" | jq '.Env // []')
payload=$(jq -n --arg c "${compose}"$'\n''# rolled-back to '"${SHA}"' at '"$(date -u +%FT%TZ)" --argjson e "$env" \
  '{StackFileContent: $c, Env: $e, PullImage: true, Prune: false, ForceRecreate: true}')

curl -sk -fX PUT -H "X-API-Key: $TJ_PORTAINER_KEY" -H "Content-Type: application/json" \
  -d "$payload" "$TJ_PORTAINER_URL/api/stacks/${STACK_ID}?endpointId=${endpoint}" >/dev/null

echo "rolled back to ${SHA} · verify: curl -I https://rikiki.tordu-jardin.fr/"

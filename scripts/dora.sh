#!/usr/bin/env bash
# Quick-and-dirty DORA metrics on this repo.
#
#   ./scripts/dora.sh [window-days]    # default 30
#
# Reports the four key DORA metrics over the chosen window:
#
#   1. Deployment frequency   · successful pipelines on main per day
#   2. Lead time for changes  · median minutes from commit author-date
#                                to deploy job finished-at, per
#                                successful pipeline
#   3. Change failure rate    · % of pipelines on main that failed
#                                divided by total pipelines on main
#   4. Time to restore (MTTR) · median minutes between a failed
#                                pipeline and the next successful one
#                                on main
#
# Requires: curl, jq, python3, and GITLAB_TOKEN with read_api on the
# project. PROJECT_ID defaults to the tordu-jardin/rikiki id but can
# be overridden.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-82405490}"
WINDOW_DAYS="${1:-30}"

if [ -z "${GITLAB_TOKEN:-}" ]; then
  echo "error · GITLAB_TOKEN is not set" >&2
  exit 1
fi

since=$(date -u -d "${WINDOW_DAYS} days ago" +%FT%TZ)

echo "── DORA metrics · project ${PROJECT_ID} · last ${WINDOW_DAYS} days (since ${since}) ──"

# Pull up to 100 pipelines on main since the window started. 100 is the
# GitLab per_page max · for higher-traffic repos add pagination.
pipelines_json=$(curl -sf -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/${PROJECT_ID}/pipelines?ref=main&per_page=100&updated_after=${since}")

# Filter to terminal states only · running/pending pipelines distort
# the failure rate.
python3 - "$pipelines_json" "${WINDOW_DAYS}" <<'PY'
import json, sys, statistics, urllib.request, os
from datetime import datetime, timezone, timedelta

pipelines = json.loads(sys.argv[1])
window_days = int(sys.argv[2])

terminal = [p for p in pipelines if p.get('status') in ('success', 'failed')]
if not terminal:
    print("no terminal pipelines in window · nothing to compute")
    sys.exit(0)

success = [p for p in terminal if p['status'] == 'success']
failed = [p for p in terminal if p['status'] == 'failed']

# 1. Deployment frequency
freq_per_day = len(success) / window_days
print(f"\n  1. Deployment frequency     {freq_per_day:.2f}/day  ({len(success)} successful deploys / {window_days} d)")

# 2. Lead time · for each successful pipeline, compute commit_author_date → pipeline finished_at
def parse(t):
    return datetime.fromisoformat(t.replace('Z', '+00:00'))

token = os.environ['GITLAB_TOKEN']
project_id = os.environ.get('PROJECT_ID', '82405490')

lead_times_min = []
for p in success[:30]:  # sample up to 30 for speed
    req = urllib.request.Request(
        f"https://gitlab.com/api/v4/projects/{project_id}/repository/commits/{p['sha']}",
        headers={'PRIVATE-TOKEN': token},
    )
    with urllib.request.urlopen(req) as r:
        commit = json.load(r)
    commit_t = parse(commit['authored_date'])
    finish_t = parse(p['updated_at'])
    lead_times_min.append((finish_t - commit_t).total_seconds() / 60)

if lead_times_min:
    median = statistics.median(lead_times_min)
    p90 = statistics.quantiles(lead_times_min, n=10)[8] if len(lead_times_min) >= 10 else max(lead_times_min)
    print(f"  2. Lead time for changes    median {median:.1f} min · p90 {p90:.1f} min  (n={len(lead_times_min)})")

# 3. Change failure rate
total = len(terminal)
cfr = len(failed) / total * 100
print(f"  3. Change failure rate      {cfr:.1f}%  ({len(failed)} failed / {total} total)")

# 4. MTTR · for each failed pipeline on main, find the next successful pipeline on main
#    (chronologically). Take the median of those gaps.
terminal_sorted = sorted(terminal, key=lambda p: parse(p['updated_at']))
recoveries_min = []
for i, p in enumerate(terminal_sorted):
    if p['status'] != 'failed':
        continue
    fail_t = parse(p['updated_at'])
    next_ok = next((q for q in terminal_sorted[i+1:] if q['status'] == 'success'), None)
    if next_ok is None:
        continue
    recoveries_min.append((parse(next_ok['updated_at']) - fail_t).total_seconds() / 60)

if recoveries_min:
    median_mttr = statistics.median(recoveries_min)
    print(f"  4. Time to restore (MTTR)   median {median_mttr:.1f} min  (n={len(recoveries_min)} incidents)")
else:
    print(f"  4. Time to restore (MTTR)   n/a · no failed→success transitions in window")

# DORA tier hints (Accelerate / DORA report bands)
print()
print(f"  Reference bands (DORA / Accelerate · simplified):")
print(f"    Elite : deploys multiple times/day · lead time < 1h  · CFR <= 15%  · MTTR < 1h")
print(f"    High  : daily to weekly             · lead < 1 day   · CFR <= 30%  · MTTR < 1 day")
print(f"    Medium: weekly to monthly           · lead < 1 week  · CFR <= 45%  · MTTR < 1 week")
print(f"    Low   : monthly to bi-annual        · lead > 1 month · CFR  > 45%  · MTTR > 1 week")
PY

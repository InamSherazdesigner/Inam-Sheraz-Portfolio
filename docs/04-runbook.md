# Runbook

**Owner:** DevOps Engineer · **Covers:** Gates 11, 15, 17

---

## 1. Deploy

Frontend and backend deploy independently. The frontend is fully static, so it
can go out without the backend and vice versa.

```bash
npm run verify        # format · lint · typecheck · test · build — the CI order
npm run test:e2e      # desktop + mobile against a production build
```

**Frontend** — any static host or Node host.

```bash
npm run build --workspace @portfolio/frontend
# .next/ → your host. Set NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SITE_URL first;
# they are baked in at build time, so changing them needs a rebuild.
```

**Backend** — Docker, or plain Node.

```bash
docker build -f backend/Dockerfile -t portfolio-api .
docker run -p 4000:4000 --env-file backend/.env portfolio-api

npm run seed --workspace @portfolio/backend   # build indexes. Idempotent.
```

### Pre-deploy checklist

- [ ] `npm run verify` green
- [ ] `npm run test:e2e` green
- [ ] `npm audit --omit=dev` → 0 vulnerabilities
- [ ] `backend/.env` has a real `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`
- [ ] `VOICE_PROVIDER=elevenlabs` — the server refuses to boot as `mock` in production, but check anyway
- [ ] `CORS_ORIGINS` lists the real frontend origin
- [ ] `NEXT_PUBLIC_API_URL` points at the real API over **https**
- [ ] MongoDB reachable; `npm run seed` has run
- [ ] `docs/CHANGELOG.md` updated

---

## 2. Post-deploy smoke test

Two minutes, in this order.

```bash
curl -s $API/health/live   | jq .data.status      # "live"
curl -s $API/health/ready  | jq .data             # "ready", degraded: []

# Origin check is doing its job
curl -s -X POST $API/api/v1/voice/session | jq .error.code       # ORIGIN_NOT_ALLOWED

# And a real request works
curl -s -X POST $API/api/v1/voice/session -H "Origin: $SITE" | jq '.data.signedUrl[0:6]'
# "wss://"  — and confirm no key anywhere in the body:
curl -s -X POST $API/api/v1/voice/session -H "Origin: $SITE" | grep -ci "api.key\|sk_"   # 0
```

In a browser:

- [ ] `/` — eleven titles readable immediately
- [ ] D-pad and keyboard both move the selection
- [ ] Open project 01 — load, card, full view
- [ ] **Press START TALKING — the agent connects and speaks**
- [ ] `/everything` — thirteen sections, artwork loads
- [ ] `/work/liminal` — near-white ground, not amber
- [ ] Posters — Khushi Ya Majboori images hidden until acknowledged
- [ ] CAT — three watermarked details; the real password unlocks
- [ ] Phone — console fits, list readable, nothing cut off

---

## 3. Rollback

| Problem | Action | Time |
|---|---|---|
| Frontend broken | Redeploy previous static build | seconds |
| Backend broken | Redeploy previous image | ~1 min |
| Voice agent failing | `VOICE_PROVIDER=mock` + restart. The widget says so plainly; the screen recording still plays | ~1 min |
| Key compromised | Revoke at elevenlabs.io → new key → update env → restart. Old signed URLs die within ~45s on their own | ~5 min |
| Bad data | No destructive migration exists. Nothing to roll back |

---

## 4. Incident severity

| Level | Means | Response | Example |
|---|---|---|---|
| **SEV1** | Site down, or a credential exposed | Immediate | API key in a bundle; every route 500 |
| **SEV2** | A major feature is down | Within the hour | Voice agent failing for everyone |
| **SEV3** | Degraded | Same day | Mongo down — contact form 503, site fine |
| **SEV4** | Cosmetic | Next working day | A caption wraps oddly on one phone |

Single-owner project: escalation is to the owner. No on-call rotation — recorded
as **N/A with justification** rather than skipped.

---

## 5. Diagnosis

**Everything 500** → `GET /health/ready`, then the logs. Filter by the
`requestId` the visitor quotes; it is on every response and every log line.

**Voice agent failing** → `GET /health/metrics` → `voiceBreaker.state`.

| State | Means | Do |
|---|---|---|
| `closed` | Upstream healthy. The problem is elsewhere — check the browser console for a mic or CSP error | |
| `open` | Five consecutive upstream failures. Nothing is reaching ElevenLabs | Check status.elevenlabs.io and the credit balance. It probes itself after 30s |
| `half-open` | Probing recovery | Wait |

Then the ledger:

```js
db.voice_sessions.find({ outcome: "failed" }).sort({ createdAt: -1 }).limit(20)
```

`errorCode` distinguishes them: `VOICE_DISABLED` is a bad or expired key,
`RATE_LIMITED` is a quota, `UPSTREAM_UNAVAILABLE` is an outage.

**Contact form 503** → Mongo is unreachable. The site is fine; this is SEV3.

---

## 6. Cost — the one thing that can surprise you

The voice agent is the only usage-priced component.

**Daily**

```js
db.voice_sessions.aggregate([
  { $match: { createdAt: { $gte: new Date(Date.now() - 864e5) } } },
  { $group: { _id: "$outcome", n: { $sum: 1 },
              people: { $addToSet: "$clientHash" } } },
  { $project: { n: 1, people: { $size: "$people" } } }
])
```

**If it spikes**

1. Look at `people` vs `n`. Many sessions from few hashes is one caller looping.
2. Tighten `VOICE_GLOBAL_LIMIT_MAX` (default 120 per 15 min) and restart.
3. If it continues, `VOICE_PROVIDER=mock` is the kill switch. The widget says the
   agent is in mock mode, and the screen recording still plays — the thesis page
   still works.
4. Set a spend alert in the ElevenLabs dashboard. Do this **before** launch, not
   after the first surprising invoice.

---

## 7. Backup and recovery

| | RPO | RPO | RTO | How |
|---|---|---|---|---|
| Code + content | 0 | | minutes | git. Content is in the repo (ADR 0003) |
| Artwork | 0 | | minutes | Committed under `frontend/public/` |
| `asset-library/` (1.4 GB) | — | | — | **Not in git.** Operator-managed. A second copy still exists in the original `Portfolio Web/`. Put it somewhere backed up |
| MongoDB | 24h | | ~15 min | Atlas snapshots, or `mongodump` on a schedule |
| Secrets | — | | minutes | Held by the operator. Regenerable from the provider dashboards |

**Restore drill — do this before launch, not after an incident**

1. `mongorestore` into a scratch database
2. Point a local backend at it
3. `curl $API/health/ready` → `degraded: []`
4. Submit a contact message and read it back

A backup that has never been restored is a hypothesis.

**Single points of failure:** one backend instance; one MongoDB. Both accepted at
this scale, both documented, neither on the path that renders the portfolio.

---

## 8. Before scaling past one instance

**Move the rate limiters to a shared store first.**

They are in-memory, so counters are per process. At N instances the limits become
N× looser — including `VOICE_GLOBAL_LIMIT_MAX`, which is the ceiling on the
ElevenLabs bill. Swap `express-rate-limit`'s default store for `rate-limit-redis`
and point every instance at one Redis before adding the second instance.

The circuit breaker is also per-process. That one is fine: each instance learns
independently and the worst outcome is one extra failed call each.

---

## 9. Monitoring to configure at launch

| Watch | Threshold | Severity |
|---|---|---|
| `/health/live` | 2 consecutive failures | SEV1 |
| `/health/ready` degraded | 5 min | SEV3 |
| 5xx rate | > 1% over 5 min | SEV2 |
| `voiceBreaker.state == "open"` | any | SEV2 |
| Voice sessions per hour | > 50 | cost warning |
| ElevenLabs spend | > budget | cost warning |
| Memory RSS | > 400 MB | SEV3 |

Uptime pings should target `/health/live`, never `/health/ready` — ready returns
200 while degraded on purpose, because the portfolio works without either
dependency and pulling the instance would turn a partial outage into a total one.

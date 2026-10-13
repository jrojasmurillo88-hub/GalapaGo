# GalapaGo — Product & Business Brief (for building the platform)

_Last updated: 13 October 2026 · Stage: Idea → pilot · Founders: Juan Daniel Rojas & Caitlin (IE University, Venture Lab + Social Entrepreneurship)_

> **How to use this file:** This is the current source of truth for GalapaGo after the October 2026 pivot to e-waste. Older materials (pitch PDF, early business canvas) describe a multi-waste, traveler-focused app — **ignore those where they conflict with this brief.** Items marked **[ASSUMPTION]** are unvalidated; items marked **[OPEN]** are undecided — build them so they are easy to change.

---

## 1. One-liner

GalapaGo is a mobile-first app that helps young adults in Madrid get their unused electronics (e-waste / RAEE) out of the drawer and into official collection points — by showing them exactly where to take each device, rewarding verified drop-offs with points redeemable at local businesses, and turning those drop-offs into verified engagement and impact data for the producer compliance schemes that are legally required to hit collection targets.

---

## 2. The problem

- **Spain is missing its e-waste targets.** In 2023 Spain collected 448,202 t of RAEE against a target of 723,490 t (62% compliance). Spain has an open EU infringement procedure (July 2024) over missed targets.
- **The gap is in households, not infrastructure.** Collection points already exist in Madrid (City Council *Puntos Limpios* — fixed and mobile, retailer take-back, producer-scheme containers). The bottleneck is getting the item from the person's home into the official system.
- **Madrid specifically (2023):** 79,165 t collected, 77% of target. Weakest categories: **screens (laptops, monitors, TVs) at 48%** and **temperature-exchange equipment (fridges, AC) at 62%**. Small appliances and small IT already exceed targets. Re-use is almost nil (≈0.3% of what's collected).
- **Why people don't dispose properly** (hypotheses, partly supported by first interview): friction beats intention; low convenience; missing/confusing information about *where* and *what* is accepted; no personal incentive; **fear of personal data on devices** (a real barrier for laptops/phones); people keep old devices "just in case."

---

## 3. Who it's for (two-sided model)

### Side A — Users (supply of e-waste; they "pay" in effort, not money)
- **Primary:** young adults (≈18–35) living in Madrid who *intend* to dispose of electronics correctly but don't. Students and young professionals (IE community is the pilot recruitment channel).
- **Not now:** travelers/tourists (earlier concept — postponed to a later phase).

### Side B — Paying customers
1. **Producer compliance schemes (SCRAPs)** — e.g. Ecolec, Ecotic, Recyclia, ERP. **Strongest candidate.** Law 7/2022 obliges them to fund citizen communication/awareness campaigns, and they face legal consequences for missing collection targets (art. 108.3.z).
2. **Producers / brands (OEMs)** — may have more budget than schemes (founder's experience in Colombia: schemes said they had no money because producers didn't contribute more). **[OPEN]** which of the two actually pays first.
3. **Circular-economy ventures** (refurbishers, repair, e-waste startups) — want visibility for their drop-off points and access to devices.
4. **Maybe:** public disposal schemes / Ayuntamiento de Madrid.

### Side C — Reward partners (not necessarily paying)
- Local Madrid businesses (cafés, shops, experiences) that offer discounts in exchange for foot traffic and sustainability association. Discounts can be funded by sponsors (schemes/producers).

### Social mission (keep in the product's DNA)
- Volunteering and community initiatives (clean-ups, collection drives) were defined as central beneficiaries of the model. **[OPEN]** whether they stay in scope after the e-waste pivot — build as an optional, toggleable module (see §6.3), not core MVP.

---

## 4. Business model (current version)

| Element | Current answer |
|---|---|
| **Value to users** | One clear place to know *where* each device goes + data-wiping guidance + points/rewards for doing it |
| **Value to SCRAPs / producers** | Additional verified household collection (tonnage toward legal targets), a citizen-engagement channel that satisfies their awareness obligations, and **verified impact data** usable for reporting and for defensible green claims (EmpCo rules apply from 27 Sep 2026, vague claims are now risky) |
| **Value to reward partners** | New customers, sustainability association |
| **Revenue streams [ASSUMPTION]** | (1) Campaign/engagement fees paid by SCRAPs or producers (pay per verified drop-off or per kg collected, or a campaign fee); (2) Impact-data/reporting dashboard subscription; (3) Sponsored rewards (sponsors fund the discounts); (4) Later: listing/visibility fees for circular ventures |
| **Cost to serve** | Platform dev, user-acquisition campaigns, verification, partner management |
| **Key metric they buy** | Verified devices / kg diverted into official channels, by category and district |
| **Funding** | Planned seed round (amount TBD) for user-acquisition campaigns, app development, and measuring indicators that attract sponsors |
| **Differentiator** | Existing Spanish recycling-reward apps are single-stream and their rewards don't motivate. GalapaGo focuses on the hardest stream (e-waste in drawers), adds data-wiping trust, and sells verified data — not just a map |

### Milestone targets (user + environmental)
- **2 months:** 50 users · 15 kg collected
- **6 months:** 1,000 users · 300 kg
- **3 years:** 100,000 users · 30 t

### Scope exclusions (explicit)
Recycling/treatment processes · other waste streams (textiles, batteries-only, oil, etc.) · informal collectors (*chatarreros*) · cities beyond Madrid · travelers.

---

## 5. Pilot constraints (what the first build must support)

- **Dates:** one Madrid district, approx. **26 Oct – 5 Nov 2026** (≈2 weeks from today — build lean).
- **Targets:** 30–50 pilot users, 1 reward partner, ≥1 collection point/partner location.
- **Device focus for pilot [OPEN]:** small devices are the easiest to physically bring (phones, chargers, cables, small appliances); screens/laptops are the biggest gap in Madrid's data. Allow all RAEE categories, tag by category so data shows which works.
- **Verification [OPEN]:** manual (photo + admin approval) vs. **QR code at partner drop-off point**. Build both: QR scan as primary, photo-upload-with-admin-approval as fallback.
- **Language:** UI in **Spanish (es-ES)** with English toggle (IE has many international students).

---

## 6. What to build — MVP spec

### 6.1 User app (mobile-first web app / PWA, no app-store install needed)
1. **Onboarding & account** — email/magic-link or Google sign-in; name, district (*barrio/distrito*), age range, consent to data use (GDPR).
2. **"What do I have?" device picker** — choose device type (phone, laptop, charger/cable, monitor/TV, small appliance, battery-containing device, etc.), mapped internally to the **7 official RAEE categories**:
   1. Temperature exchange · 2. Screens · 3. Lamps · 4. Large appliances · 5. Small appliances · 6. Small IT & telecom · 7. PV panels (exclude from user flow).
3. **Map of drop-off points** — filter by device type accepted; shows Puntos Limpios (fixed + mobile schedule), retailer take-back, partner points. Each point: address, hours, what it accepts, distance. Seed with manually curated data for the pilot district.
4. **Data-wiping guide** — short step-by-step per device type (phone, laptop) shown *before* drop-off; a "I wiped my device" checkbox.
5. **Log a drop-off** — scan the QR at the point **or** upload a photo of the item at the point → status `pending` → `verified` / `rejected`.
6. **Points wallet** — balance, history, points per drop-off (see 6.4).
7. **Rewards catalogue** — partner offers; redeem → generates a one-time code/QR the business validates.
8. **Impact view** — "you diverted X devices / ~Y kg"; simple shareable card (social spread).
9. **Commitment / pledge** — "I'll bring [item] to the pilot" (a commitment test from user research) with reminder.

### 6.2 Admin / partner dashboard (web)
- **Admin (founders):** approve/reject photo submissions; manage drop-off points, device catalogue, point values, rewards, partners; export CSV.
- **Reward partner view:** validate redemption codes; see redemptions.
- **Sponsor (SCRAP/producer) view — this is what we sell:** verified drop-offs and estimated kg by RAEE category, district, date range; unique users; repeat rate; downloadable report. Keep figures traceable to individual verified events.

### 6.3 Optional module (feature-flagged, off by default)
- **Community actions:** list collection drives / volunteering events; join; check-in via QR; earn points.

### 6.4 Points economy **[OPEN — make fully configurable]**
- Points defined per device type in an admin-editable table. Suggested factors: estimated weight, category's collection gap (screens and fridges = higher), hazard (batteries), and sponsor priority.
- Sponsors can run **campaign multipliers** (e.g. "x2 points for laptops in Chamberí this week").
- Caps per user/day to limit fraud.

### 6.5 Anti-fraud basics
- QR codes rotate or are tied to location + time; one item per photo; admin review; daily caps; duplicate-photo check if cheap to add.

---

## 7. Core data model (suggested)

- `User` (id, name, email, district, age_range, locale, created_at, consent flags)
- `DeviceType` (id, name_es, name_en, raee_category 1–7, est_weight_kg, base_points, wipe_guide_id)
- `DropOffPoint` (id, name, type [punto_limpio_fijo | punto_limpio_movil | retailer | partner | scheme_container], address, lat, lng, district, hours, accepted_device_types[], qr_secret, operator/scheme)
- `DropOff` (id, user_id, point_id, device_type_id, quantity, method [qr | photo], photo_url, wiped_confirmed, status [pending | verified | rejected], points_awarded, est_kg, created_at, verified_by)
- `Partner` (id, name, kind [reward | sponsor | circular_venture | public], contact)
- `Reward` (id, partner_id, title, description, points_cost, stock, valid_until)
- `Redemption` (id, user_id, reward_id, code, status, redeemed_at)
- `Campaign` (id, sponsor_id, device_types[], districts[], multiplier, start, end)
- `PointsLedger` (id, user_id, delta, reason, ref_id) — wallet = sum of ledger
- `CommunityEvent` (optional module)

---

## 8. Success metrics to instrument from day 1
- Sign-ups, activation (first verified drop-off), repeat drop-offs
- Verified drop-offs and est. kg by category / district / campaign
- Time from sign-up to first drop-off; drop-off funnel (picker → map → logged → verified)
- Reward redemptions; partner foot traffic
- % users who confirmed data wiping
- Pledges made vs. fulfilled

---

## 9. Technical guidance
- **Priority is shipping a working pilot in ~2 weeks** — prefer a simple, well-supported stack (e.g. Next.js + a hosted DB/auth like Supabase, a map via Leaflet/OpenStreetMap or Mapbox, hosted on Vercel). Claude Code may propose alternatives.
- Mobile-first, PWA, fast on phones; i18n from the start (es-ES default, en).
- GDPR: minimal personal data, explicit consent, ability to delete account, EU-hosted DB if possible.
- Seed data: one district's drop-off points (manually entered), ~15 device types, 1 reward partner, 1 demo sponsor.
- Keep point values, device catalogue and sponsor campaigns in the DB (admin-editable), not hard-coded.

---

## 10. Open decisions (don't block on these — build configurable)
1. Who pays first: SCRAPs vs. producers vs. circular ventures?
2. Verification method for the pilot: QR vs. photo (build both).
3. How to make points "fair" across device types (configurable table).
4. Which pilot district and which device category to push.
5. Is volunteering/community still in scope post-pivot? (feature flag)
6. Attribution: when a user drops a device at a given point, which SCRAP gets credit?
7. Home pickup — user research suggests demand; out of MVP, note for later.

---

## 11. Key evidence sources
- MITECO, *Resultados gestión RAEE ejercicio 2023, nacional y por CCAA*
- Comunidad de Madrid e-waste plan (category-level tonnage)
- Law 7/2022 on waste and contaminated soils (incl. art. 108.3.z)
- UN Global E-waste Monitor 2024
- User interview #1 (IE classmate): friction > intention; prefers drop-off on daily routes or home pickup; money isn't the main motivator; data-wiping fear is a barrier

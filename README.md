# N54 Wiki + Tune Program

BMW N54 tuning reference wiki and BIN generator tool, powered by **Synergy BMW Tuning**.

Built with Next.js 16, Nextra 4.6, Tailwind CSS, and TypeScript.

---

## What This App Does

### N54 Wiki (`/wiki`)
A comprehensive reference wiki for BMW N54 tuning — engine specs, stage upgrades, datalogging guides, diagnostic codes, fueling references, and maintenance checklists. Built on Nextra (MDX-based docs).

### N54 Tune Program (`/tune-program`)
A client-side BIN generator and tune package management system.

**This app is NOT a flashing tool.**
- It does not connect to the car
- It does not flash the DME
- It does not perform RSA unlock or DME communication
- Its job is to generate a BIN file that the customer flashes using **MHD Flasher** or **N54 Quickflash**

**v1 Workflow:**
1. Customer uploads their stock I8A0S BIN (2,097,152 bytes)
2. App validates file size
3. Customer selects turbo type, stage, and fuel
4. App generates a correctly-named BIN for download
5. Customer flashes with MHD or Quickflash

**v2+ Roadmap:**
- ROM fingerprint verification (byte-level I8A0S signature check)
- Patch-package application (offset deltas applied client-side from JSON patch files)
- Checksum recalculation before export
- Protected server-side export for tuner-delivered packages

---

## Routes

| Route | Description |
|---|---|
| `/` | Home page |
| `/wiki` | N54 tuning wiki (Nextra MDX) |
| `/tune-program` | Main BIN generator (upload + select + generate) |
| `/tune-program/select` | Package selector (ROM/turbo/fuel/stage filter) |
| `/tune-program/intake` | Customer intake form |
| `/tune-program/packages` | All registered tune packages |
| `/tune-program/admin` | Admin dashboard (PIN protected) |
| `/tune-program/export` | Export locked `.synergytune` package |
| `/api/tune-program/export` | POST endpoint — server-side encrypted export |
| `/contact` | Contact Synergy BMW Tuning |

---

## Running Locally

```bash
npm install
cp .env.local.example .env.local
# Fill in SYNERGY_EXPORT_SECRET and SYNERGY_ADMIN_PIN in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Where Tune Files Go

### Private source files
```
_private_tuning_sources/    ← GITIGNORED — never commit
  base/                     ← Stock BIN files (I8A0S, IJE0S, INA0S)
  xdf/                      ← XDF calibration definitions
  deltas/                   ← Stage/fuel offset delta exports (JSON)
```

These are used to build `data/tune-program/patches/*.json` — only the JSON deltas are committed, never the source BIN/XDF files.

### Server-side tune files (protected export)
```
protected-tune-files/       ← GITIGNORED — place on server only
  I8A0S/
    stage1/91/  ← n54-i8a0s-s1-91-stock.bin
    stage2/93/  ← etc.
    ...
```

Files here are read server-side by `/api/tune-program/export` and encrypted before delivery. They are **never** in `public/` and **never** served via public URLs.

### Registering a new tune file
1. Place the BIN at `protected-tune-files/<ROM>/<stage>/<fuel>/<filename>.bin`
2. Find the entry in `data/tune-program/tuneFiles.ts` and set `fileExists: true`
3. Confirm the `protectedFilePath` matches the actual file location
4. Test the export API route

---

## How Protected Export Works

The `/api/tune-program/export` API route:
1. Authenticates with `SYNERGY_ADMIN_PIN`
2. Validates the request (customer data + tune file selection)
3. Reads the raw BIN from `protected-tune-files/`
4. Encrypts it with **AES-256-GCM** using a key derived via PBKDF2 from `SYNERGY_EXPORT_SECRET`
5. Packages it as a `.synergytune` JSON file containing:
   - Customer and selection metadata
   - SHA-256 hash of original content
   - Encrypted tune content (not directly readable)
6. Returns the package as a download

> **Important:** The exported `.synergytune` package prevents casual reading and copying of the raw tune file.
> It is not a claim of perfect security — it prevents casual extraction, not determined reverse engineering.
> For maximum protection, integrate server-side delivery with per-customer license keys.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `SYNERGY_EXPORT_SECRET` | Yes (export) | AES encryption key (min 32 chars, random) |
| `SYNERGY_ADMIN_PIN` | Yes (admin) | Admin dashboard PIN |

Generate a secret: `openssl rand -hex 32`

---

## Why Raw Files Should Not Be in `public/`

Files in `public/` are served directly via HTTP — anyone can download them with a direct URL. Tune files must never be in `public/` because:
- They are proprietary calibrations
- Direct downloads bypass customer review and safety checks
- There is no authentication on files served from `public/`

Always use server-side API routes to deliver tune content.

---

## Currently Not Supported

- Port injection tuning
- Single turbo conversions
- Tune revisions / version history
- Automatic custom calibration generation
- Flex fuel dynamic calibration (fixed E30/E40/E50 only in v1)

---

## Future: Database / CRM / Stripe / Email

The current admin dashboard and intake form use **localStorage** for demo persistence. For production:

| Feature | Suggested stack |
|---|---|
| Customer requests | PostgreSQL / Supabase / PlanetScale |
| File storage | S3 / Cloudflare R2 (server-side only, not public) |
| Email notifications | Resend / SendGrid |
| Payments | Stripe (tune program checkout) |
| CRM | Airtable or custom dashboard |
| Auth | NextAuth.js / Clerk |

---

## Safety Disclaimer

This application generates base tune packages. Final calibration depends on your specific vehicle, fuel quality, hardware condition, and tuner review.

- Do not promise horsepower numbers
- Do not promise safe boost levels
- All outputs are base guidance until reviewed by a Synergy tuner
- Misfires, knock, lean conditions, fuel pressure drops, or active fault codes require review before tuning
- Port injection and single turbo files are not supported in this version

**Always consult a professional tuner before flashing.**

---

## Next Biggest Feature: Tune File Compatibility Scanner

A scan tool that:
- Reads uploaded BIN byte offsets to detect ROM version (I8A0S/IJE0S/INA0S fingerprint)
- Validates selected ROM matches the registered tune file's target ROM
- Blocks wrong-file exports before they reach the customer
- Reports compatibility warnings (e.g., AT file selected for MT car)

---

© N54 Wiki — Powered by [Synergy BMW Tuning](https://synergybmwtuning.com)

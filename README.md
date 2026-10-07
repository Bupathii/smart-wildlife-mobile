# Mobile — Smart Wildlife Conservation App

Expo Router + React Native (TypeScript) app for the two field-facing roles that don't use the [web dashboard](../../frontend/smart-wildlife-frontend): `COMMUNITY_MEMBER` (reports human–wildlife conflicts) and `RANGER` / `COMMUNITY_LIAISON_OFFICER` (respond to those reports). See `AGENTS.md`/`CLAUDE.md` for Expo-version-specific coding rules — this file covers what the app actually does.

## Setup

```bash
npm install
npx expo start
```

No `.env` file exists yet. The API base URL comes from `EXPO_PUBLIC_API_URL` (`src/services/api.ts`), falling back to:
- `http://10.0.2.2:5000/api` on Android (emulator's alias for the host machine)
- `http://localhost:5000/api` on iOS

**On a physical device via Expo Go, neither fallback works** — create a `.env` with your machine's LAN IP:
```
EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:5000/api
```
and make sure the [backend](../../backend/smart-wildlife-backend)'s `CORS_ORIGIN` allows it. If Expo Go can't reach the dev server at all (`IOException: Failed to download remote update`), check that the phone and computer are on the same network and no VPN/virtual adapter is being advertised instead of the real LAN IP — `npx expo start --tunnel` sidesteps this.

## Stack

- Expo Router (file-based routing — every file in `src/app/` is a screen; see `AGENTS.md` for Expo-version caveats)
- NativeWind (Tailwind for React Native) + `expo-glass-effect`
- `expo/fetch` + native `fetch` for API calls (no Axios here, unlike the web frontend)
- `@react-native-async-storage/async-storage`, `@react-native-community/netinfo` (offline sync)

## Auth & routing flow

- `AuthContext` (`src/context/AuthContext.tsx`) holds `user`/`token` **in memory only** — not yet persisted to `AsyncStorage`, so the session is lost on app restart/reload.
- `src/app/index.tsx` redirects based on `user.role`:
  | Role | Redirects to |
  |---|---|
  | `COMMUNITY_MEMBER` | `/community` |
  | `RANGER` | `/ranger` |
  | `COMMUNITY_LIAISON_OFFICER` | `/liaison` |
  | anything else (web-only roles) | `/web-only` — tells the user to use the web dashboard and logs them out |
  | not logged in | `/login` |

## Status / known gaps

The routes `/login`, `/community`, `/ranger`, and `/liaison` are referenced by `index.tsx` and `web-only.tsx` but **do not exist yet** under `src/app/` — only `_layout.tsx`, `index.tsx`, and `web-only.tsx` are implemented. The app will currently fail to redirect anywhere useful until those screens are added. `RoleTabPage` (`src/components/RoleTabPage.tsx`) looks like the intended shared layout for the role screens (title/subtitle/numbered item list) but isn't wired into any route yet.

Implemented services (ready to call once the screens exist):
- `src/services/auth.service.ts` — `loginUser()` → `POST /api/auth/login`
- `src/services/conflict.service.ts` — full conflict-report API client: submit (with evidence images via `expo-file-system`), community member's own reports, staff list, single report, ranger/CLO response update
- `src/services/pendingConflict.service.ts` + `src/hooks/usePendingConflictSync.ts` — offline queue: `COMMUNITY_MEMBER` reports submitted without connectivity are queued locally and flushed automatically when `NetInfo` reports connectivity again (checked on mount and on every network-state change)

Implemented shared components (not yet wired into any route):
- `RoleTabPage` — generic title/subtitle/numbered-item-list layout, intended for the role landing screens
- `ProfilePage` — avatar/name/email/role card + logout confirmation; calls `logout()` then `router.replace('/login')`
- `ConflictReportContext` — holds the in-progress report draft (type, location, description, evidence, auto-generated `clientReportId`) across the multi-step report flow

## Structure

```
src/
  app/            # Expo Router screens (_layout, index, web-only — see gaps above)
  components/      # RoleTabPage, ProfilePage
  context/         # AuthContext (in-memory session), ConflictReportContext (draft report state)
  hooks/           # usePendingConflictSync
  services/        # api.ts (base URL), auth.service, conflict.service, pendingConflict.service
  types/           # auth.ts, conflict.ts
```

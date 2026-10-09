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

The role areas exist under `src/app/`: `(auth)/login.tsx`, `community/` (home, multi-step `report/` flow, `reports/` list and detail, profile), `ranger/` (home, `conflicts/`, alerts, incident, **patrol — implemented, see below**, profile) and `liaison/` (home, `conflicts/`, alerts, responses, profile). The human–wildlife conflict flow (community report → ranger / liaison response) is the implemented feature; check each remaining tab screen before assuming it is more than a `RoleTabPage` outline.

### Ranger "My Patrol" (`src/app/ranger/patrol.tsx`)

The ranger sees the patrol the Park Manager assigned on the web (route, waypoint checklist, team), presses **Start patrol**, and while the patrol is running the phone reports its position every 20 seconds so the manager can follow it on the web dashboard. **End patrol** completes it. The same screen shows insights: patrols completed, average coverage, total distance, average rating, the manager's latest evaluation and recent patrols.

- **Keep the screen open.** Tracking runs only while this screen is open (it is kept awake). Background tracking needs a development build, not Expo Go.
- **Offline.** A position taken without a connection is stored on the phone (`AsyncStorage`) and sent with the next successful report.
- **Demo walk.** A switch that sends positions along the assigned route instead of the phone's GPS, for demonstrations away from the park.
- **Logins** (password `Ranger@123`): `ranger.demo@wildlife.lk`, `ranger2.demo@wildlife.lk`, `ranger3.demo@wildlife.lk`. Create them with `npm run seed:app-rangers` in the backend.
- Code: `src/services/patrol.service.ts` (API calls, offline queue, demo walk), `src/types/patrol.ts`.

Implemented services:
- `src/services/auth.service.ts` — `loginUser()` → `POST /api/auth/login`
- `src/services/conflict.service.ts` — full conflict-report API client: submit (with evidence images via `expo-file-system`), community member's own reports, staff list, single report, ranger/CLO response update
- `src/services/pendingConflict.service.ts` + `src/hooks/usePendingConflictSync.ts` — offline queue: `COMMUNITY_MEMBER` reports submitted without connectivity are queued locally and flushed automatically when `NetInfo` reports connectivity again (checked on mount and on every network-state change)

Shared components:
- `RoleTabPage` — generic title/subtitle/numbered-item-list layout, intended for the role landing screens
- `ProfilePage` — avatar/name/email/role card + logout confirmation; calls `logout()` then `router.replace('/login')`
- `ConflictReportContext` — holds the in-progress report draft (type, location, description, evidence, auto-generated `clientReportId`) across the multi-step report flow

## Structure

```
src/
  app/            # Expo Router screens: (auth)/login, community/, ranger/, liaison/, web-only
  components/      # RoleTabPage, ProfilePage, conflicts/ (staff list + details)
  context/         # AuthContext (in-memory session), ConflictReportContext (draft report state)
  hooks/           # usePendingConflictSync
  services/        # api.ts (base URL), auth.service, conflict.service, pendingConflict.service
  types/           # auth.ts, conflict.ts
```

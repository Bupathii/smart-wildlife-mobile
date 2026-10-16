# WildSentinel — Install over your current MyApp

Keep the original backend running unchanged. The archive has a **MyApp/** top-level
folder and should be extracted into the existing `React native project` parent
folder (NOT inside `MyApp` itself).

## Before applying

In PowerShell:

```powershell
cd "C:\Users\Lenovo\Desktop\Y3S2\CSEE\Assignment 2\project\React native project"
# Back up key working files without copying node_modules:
Compress-Archive -Path ".\MyApp\src", ".\MyApp\assets", ".\MyApp\app.json", ".\MyApp\package.json", ".\MyApp\package-lock.json" -DestinationPath ".\MyApp_before_WildSentinel.zip" -Force
# Place the downloaded WildSentinel_Enhanced_MyApp.zip in this folder first.
Expand-Archive -Path ".\WildSentinel_Enhanced_MyApp.zip" -DestinationPath "." -Force
cd ".\MyApp"
npm ci
npx tsc --noEmit
npx expo start --clear
```

The existing `.env` is not overwritten. For the **Android Studio emulator**, set
`EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api` in your existing `MyApp/.env`
if your backend actually listens on port 5000. Use your current computer's LAN
IPv4 (not `10.0.2.2`) for a real Android phone on the same network. Keep secrets
out of Git.

## What's updated

- New WildSentinel elephant-shield brand assets and matching Expo icon/splash.
- Professional sign-in preserving email/password and all three role demo options.
- Ranger, community member, liaison dashboards with real API/locally stored metrics.
- Role quick actions navigate to existing patrol, reports, tracking, alerts.
- Liaison alerts is a functional, backend-backed read-only list; response activity
  is based on current case statuses and opens existing conflict details.
- Persistent light/dark toggle in headers and profile, including existing
  Tailwind/NativeWind screens and traditional StyleSheet-based ranger screens.
- Existing backend contract, offline queue and feature screens preserved.

No synthetic case counts or fabricated alerts are displayed. A connected backend
and permitted demo users are needed to populate live tiles.

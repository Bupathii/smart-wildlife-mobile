# Mobile — Wildlife Ranger App

React Native (Expo) application for Rangers.

## Setup

```bash
cd mobile
npm install
cp .env.example .env   # then set EXPO_PUBLIC_API_BASE_URL to your backend's LAN IP
npm start               # opens Expo Dev Tools; scan the QR code with Expo Go
```

Use `npm run android` / `npm run ios` / `npm run web` to target a specific platform.

> When testing on a physical device with Expo Go, `localhost` will not reach your backend.
> Use your computer's LAN IP address (e.g. `http://192.168.1.10:5000/api`) in `.env`.

## Stack

- Expo + React Native
- React Navigation (native stack)
- Axios (API client in `src/api/client.js`)
- AsyncStorage (offline/local storage)
- expo-location, expo-camera, react-native-maps
- @react-native-community/netinfo (connectivity detection for offline sync)

## Structure

```
src/
  api/         # Axios client
  context/     # Auth/offline context providers (added in later phases)
  navigation/  # React Navigation stack
  screens/     # Screen components
  utils/       # Helpers (e.g. local storage, sync queue)
App.js         # Entry component
```

Screens are currently placeholders; patrol tracking, incident reporting, animal
tracking/alerts, and offline sync will be implemented incrementally in later phases.

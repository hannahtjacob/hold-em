# Hold Em

A mobile app built with React Native, Expo, and TypeScript.

## Requirements

- Node.js (LTS recommended)
- npm
- The [Expo Go](https://expo.dev/go) app on a physical iOS or Android device, or a local simulator

## Start developing

Install dependencies and start the Expo development server:

```sh
npm install
npm start
```

Scan the QR code with Expo Go, or press `i` for the iOS Simulator / `a` for an
Android emulator. You can also use the platform-specific commands:

```sh
npm run ios
npm run android
```

The app entry point is `App.tsx`. Changes appear automatically while the app is
running.

## Useful commands

```sh
npm run typecheck   # Check TypeScript
npm run web         # Run in a browser
```

## iOS Screen Time development

The first tab uses Apple's Family Controls, Managed Settings, and Device Activity
frameworks. It requires a custom native build; it does not work in Expo Go.

Prerequisites:

- Xcode 16.1 or newer
- A paid Apple Developer account with the Family Controls capability
- Your Apple Developer Team ID added as `expo.ios.appleTeamId` in `app.json`
- A physical iPhone for testing app selection and shielding

After changing native configuration, regenerate the iOS project:

```sh
npx expo prebuild --platform ios --clean
```

To build and open the app in the iOS Simulator:

```sh
npm run ios
```

To select a connected physical iPhone and test Screen Time controls:

```sh
npm run ios:device
```

The native setup creates the `ActivityMonitorExtension`, `ShieldAction`, and
`ShieldConfiguration` targets. Family Controls distribution approval is required
for the app bundle ID and each extension bundle ID before distributing the app.

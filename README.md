# CheckIn360

GPS-gated attendance. **Admin stays on the web.** **Employees use the Android app.**

| Surface | What it is | How it runs |
| --- | --- | --- |
| Admin dashboard | Website for registering staff, attendance, reports, inbox | Vercel (`admin/`) |
| Employee app | Android app for check-in, attendance, reports, profile | React Native APK |
| Employee web | Same employee flows in a browser | Local testing only (`employee/`) |

Firebase (Auth + Firestore) is shared by all three.

GitHub remotes:

- https://github.com/Tawa58/360-CheckIn
- https://github.com/tagboiityrn-collab/checkIn-360

## Employee Android app

The React Native app at the repo root is the staff product:

- Check in with live GPS / geofence
- Monthly attendance and premises exits
- Absence and issue reports to admin
- Profile photo, access code, sign out

On a phone with Android Studio / SDK:

```sh
npm install
npm start
npm run android
```

Release APK (needs `ANDROID_HOME`):

```sh
npm run android:apk
```

That copies `admin/public/downloads/CheckIn360.apk`. If this PC has no Android SDK, GitHub Actions builds it on every push to `main` and publishes [the latest APK](https://github.com/Tawa58/360-CheckIn/releases/latest/download/CheckIn360.apk).

Add these **repository secrets** so the APK can talk to Firebase:

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and optionally `VITE_FIREBASE_MEASUREMENT_ID` plus the `VITE_GEOFENCE_*` values from `.env.example`.

Staff download the app from `/get-app` on the deployed admin site.

## Admin on Vercel

1. Import [this GitHub repo](https://github.com/Tawa58/360-CheckIn) into Vercel. Leave the **Root Directory** as the repository root. `vercel.json` already builds `admin/`.
2. Add the same `VITE_*` Firebase and geofence variables from `.env.example` in the Vercel project settings.
3. Deploy. Admin login is `/login`. Employee download is `/get-app`.

Local admin:

```sh
npm --prefix admin install
npm run admin
```

Open http://127.0.0.1:5173/

## Environment

Copy `.env.example` to `.env` at the repo root. Admin, employee web, and the React Native bundle all read those `VITE_*` keys.

## Employee login

Username + password + access code (`EMP-XXXXXX`). Not Gmail. Admin accounts sign in on the website only.

# CheckIn360

GPS-gated attendance. **Admin stays on the web.** **Employees use the Android app.**

| Surface | What it is | How it runs |
| --- | --- | --- |
| Admin dashboard | Website for registering staff, attendance, reports, inbox | Vercel (`admin/`) |
| Employee app | Android app for check-in, attendance, reports, profile | React Native APK |
| Employee web | Same employee flows in a browser | Local testing only (`employee/`) |

Firebase (Auth + Firestore) is shared by all three.

GitHub remotes:

- https://github.com/Tawa58/360-CheckIn (source of truth)
- https://github.com/tagboiityrn-collab/checkIn-360 (mirror)

Every push to `main` on Tawa58 is copied to tagboi by GitHub Actions. Connect **tagboi Vercel** to the tagboi GitHub repo so those pushes also redeploy the admin site.

Create a GitHub PAT for Tawa58 that can write to `tagboiityrn-collab/checkIn-360`, then add it on [Tawa58/360-CheckIn secrets](https://github.com/Tawa58/360-CheckIn/settings/secrets/actions) as `CHECKIN360_MIRROR_TOKEN`.

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

That copies `admin/public/downloads/CheckIn360.apk`. If this PC has no Android SDK, GitHub Actions builds it on every push to `main` and publishes [the latest APK](https://github.com/Tawa58/360-CheckIn/releases/latest/download/CheckIn360.apk). Until Firebase secrets exist, that job skips instead of failing.

Add these **repository secrets** on [Tawa58/360-CheckIn](https://github.com/Tawa58/360-CheckIn/settings/secrets/actions) so the APK can talk to Firebase:

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and optionally `VITE_FIREBASE_MEASUREMENT_ID` plus the `VITE_GEOFENCE_*` values from `.env.example`.

Staff download the app from `/get-app` on the deployed admin site.

## Admin on Vercel

1. In tagboi’s Vercel account, import [tagboiityrn-collab/checkIn-360](https://github.com/tagboiityrn-collab/checkIn-360). Leave the **Root Directory** as the repository root. `vercel.json` already builds `admin/`.
2. Add the same `VITE_*` Firebase and geofence variables from `.env.example` in the Vercel project settings.
3. Deploy. Admin login is `/login`. Employee download is `/get-app`.
4. Later Tawa58 pushes go to Tawa58 GitHub → the mirror Action updates tagboi GitHub → Vercel redeploys.

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

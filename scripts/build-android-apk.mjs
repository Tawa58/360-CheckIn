import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const apkFrom = path.join(
  androidDir,
  'app',
  'build',
  'outputs',
  'apk',
  'release',
  'app-release.apk',
);
const downloadsDir = path.join(root, 'admin', 'public', 'downloads');
const apkTo = path.join(downloadsDir, 'CheckIn360.apk');

if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  const localSdk = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
  if (existsSync(localSdk)) {
    process.env.ANDROID_HOME = localSdk;
    process.env.ANDROID_SDK_ROOT = localSdk;
  }
}

if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  console.error(
    'Android SDK not found. Install Android Studio, then set ANDROID_HOME, or rely on the GitHub Action to publish the APK.',
  );
  process.exit(1);
}

const result = spawnSync(gradle, ['assembleRelease', '--no-daemon'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!existsSync(apkFrom)) {
  console.error(`Gradle finished but ${apkFrom} is missing.`);
  process.exit(1);
}

mkdirSync(downloadsDir, {recursive: true});
copyFileSync(apkFrom, apkTo);
console.log(`Copied release APK to ${apkTo}`);

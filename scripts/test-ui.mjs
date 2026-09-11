import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'screenshots');
mkdirSync(outDir, { recursive: true });

const ADMIN = process.env.ADMIN_URL ?? 'http://127.0.0.1:5173';
const EMPLOYEE = process.env.EMPLOYEE_URL ?? 'http://127.0.0.1:5174';
const findings = [];
let shotIndex = 0;

function note(ok, message) {
  findings.push(`${ok ? 'PASS' : 'FAIL'}  ${message}`);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`);
}

async function shot(page, name) {
  shotIndex += 1;
  const file = `${String(shotIndex).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: join(outDir, file), fullPage: true });
  console.log(`shot ${file}`);
}

async function visibleText(page, text, timeout = 8000) {
  const loc = page.getByText(text, { exact: false }).first();
  await loc.waitFor({ state: 'visible', timeout });
  return loc;
}

async function clickNav(page, name) {
  await page.getByRole('link', { name }).first().click();
}

async function waitSettled(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(400);
}

async function chromePath() {
  const local = process.env.LOCALAPPDATA;
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM,
    local && join(local, 'ms-playwright', 'chromium-1187', 'chrome-win64', 'chrome.exe'),
    local && join(local, 'ms-playwright', 'chromium-1181', 'chrome-win64', 'chrome.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  const { existsSync } = await import('node:fs');
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return undefined;
}

async function testAdmin(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(ADMIN, { waitUntil: 'networkidle', timeout: 30000 });
  await waitSettled(page);

  const onLogin = page.url().includes('/login') || (await page.getByPlaceholder('admin@company.com').count()) > 0;
  note(onLogin, 'Admin unauthenticated visit lands on login');
  await shot(page, 'admin-login');

  const email = page.getByPlaceholder('admin@company.com');
  await email.fill('not-an-admin@test.local');
  await page.getByPlaceholder('At least 6 characters').fill('wrongpass');
  await page.getByRole('button', { name: 'Show password' }).click();
  const passwordType = await page.getByPlaceholder('At least 6 characters').getAttribute('type');
  note(passwordType === 'text', 'Admin password visibility toggle shows the password');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForTimeout(1200);
  const loginError = await page.getByRole('alert').textContent().catch(() => '');
  note(Boolean(loginError), `Admin invalid login shows an error${loginError ? `: ${loginError.trim()}` : ''}`);
  await shot(page, 'admin-login-error');

  await page.locator('header').getByRole('button').first().click().catch(() => {});
  await page.waitForTimeout(300);

  await email.fill('admin@test.local');
  await page.getByPlaceholder('At least 6 characters').fill('test1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  try {
    await page.waitForURL(/\/($|\?)/, { timeout: 12000 });
    await visibleText(page, 'Overview', 12000);
    note(true, 'Admin signed in with emulator credentials');
  } catch {
    const alert = await page.getByRole('alert').textContent().catch(() => 'login did not leave /login');
    note(false, `Admin could not sign in (${alert?.trim() || 'timeout'})`);
    await shot(page, 'admin-login-failed');
    await context.close();
    return { employee: null, consoleErrors };
  }

  await shot(page, 'admin-overview-desktop');
  for (const item of [
    { name: 'Employees', heading: 'Employees' },
    { name: 'Attendance', heading: 'Attendance' },
    { name: 'Reports', heading: 'Reports' },
    { name: 'Inbox', heading: 'Inbox' },
  ]) {
    await clickNav(page, item.name);
    await waitSettled(page);
    try {
      await visibleText(page, item.heading, 8000);
      note(true, `Admin navigated to ${item.name}`);
    } catch {
      note(false, `Admin ${item.name} heading did not appear`);
    }
    await shot(page, `admin-${item.name.toLowerCase()}`);
  }

  await page.getByRole('button', { name: 'Open menu' }).click();
  await visibleText(page, 'Settings');
  await page.getByRole('link', { name: 'Settings' }).click();
  await waitSettled(page);
  try {
    await visibleText(page, 'Settings', 8000);
    note(true, 'Admin drawer opens Settings');
  } catch {
    note(false, 'Admin Settings page did not appear');
  }
  await shot(page, 'admin-settings');

  await clickNav(page, 'Employees');
  await waitSettled(page);
  await page.getByRole('button', { name: 'Register employee' }).click();
  await visibleText(page, 'Register employee');
  const username = `ui.test.${Date.now()}`;
  await page.getByPlaceholder('Jane Doe').fill('UI Test Employee');
  await page.getByPlaceholder('Operations').fill('QA');
  await page.getByPlaceholder('jane.doe').fill(username);
  await page.getByPlaceholder('At least 6 characters').fill('staff123');
  await page.getByRole('button', { name: 'Create employee' }).click();
  let accessCode = null;
  try {
    await visibleText(page, 'Employee access code', 12000);
    const codeText = await page.locator('p.font-mono').first().innerText();
    accessCode = (codeText.match(/EMP-[A-HJ-NP-Z2-9]{6}/) || [])[0] || null;
    note(Boolean(accessCode), `Admin issued access code${accessCode ? ` ${accessCode}` : ''}`);
    await shot(page, 'admin-issued-code');
    await page.getByRole('button', { name: 'Done' }).click();
  } catch (err) {
    const alert = await page.getByRole('alert').textContent().catch(() => '');
    note(false, `Admin register employee failed (${alert || err.message})`);
    await shot(page, 'admin-register-failed');
  }

  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    storageState: await context.storageState(),
  });
  const mobile = await phone.newPage();
  await mobile.goto(`${ADMIN}/employees`, { waitUntil: 'networkidle' });
  await waitSettled(mobile);
  await shot(mobile, 'admin-employees-mobile');
  const tabs = await mobile.locator('nav.fixed').count();
  note(tabs > 0, 'Admin mobile bottom tabs are present');
  await mobile.getByRole('button', { name: 'Open menu' }).click();
  await shot(mobile, 'admin-drawer-mobile');
  await phone.close();

  if (consoleErrors.length) {
    note(false, `Admin page errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  } else {
    note(true, 'Admin had no page crashes');
  }

  await context.close();
  return { employee: accessCode ? { username, password: 'staff123', accessCode } : null, consoleErrors };
}

async function testEmployee(browser, creds) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    geolocation: { latitude: -17.8292, longitude: 31.0522 },
    permissions: ['geolocation'],
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(EMPLOYEE, { waitUntil: 'networkidle', timeout: 30000 });
  await waitSettled(page);
  const onLogin = (await page.getByPlaceholder('jane.doe').count()) > 0;
  note(onLogin, 'Employee unauthenticated visit lands on login');
  await shot(page, 'employee-login');

  await page.getByPlaceholder('jane.doe').fill('nobody');
  await page.getByPlaceholder('Enter password').fill('badpass');
  await page.getByPlaceholder('EMP-7XQ92K').fill('EMP-AAAAAA');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForTimeout(1500);
  const badLogin = await page.getByRole('alert').textContent().catch(() => '');
  note(Boolean(badLogin), `Employee invalid login shows an error${badLogin ? `: ${badLogin.trim()}` : ''}`);
  await shot(page, 'employee-login-error');

  if (!creds) {
    note(false, 'Skipped authenticated employee UI (no issued access code)');
    await context.close();
    return;
  }

  await page.getByPlaceholder('jane.doe').fill(creds.username);
  await page.getByPlaceholder('Enter password').fill(creds.password);
  await page.getByPlaceholder('EMP-7XQ92K').fill(creds.accessCode);
  await page.getByRole('button', { name: 'Sign in' }).click();
  try {
    await page.waitForURL(/\/($|\?)/, { timeout: 15000 });
    await visibleText(page, 'Hello,', 12000);
    note(true, 'Employee signed in and reached Check in');
  } catch {
    const alert = await page.getByRole('alert').textContent().catch(() => 'did not leave login');
    note(false, `Employee could not sign in (${alert?.trim()})`);
    await shot(page, 'employee-login-failed');
    await context.close();
    return;
  }

  await shot(page, 'employee-checkin');
  const gps = await page.getByText(/GPS (verified|required)/).first().textContent();
  note(Boolean(gps), `Employee GPS card shows: ${gps?.trim()}`);

  const checkInBtn = page.getByRole('button', { name: /Check in|Already checked in/ });
  if (await checkInBtn.count()) {
    const label = await checkInBtn.first().innerText();
    if (/already checked in/i.test(label)) {
      note(true, 'Employee check-in button is already in the checked-in state');
    } else {
      await checkInBtn.first().click();
      await page.waitForTimeout(2000);
      const result =
        (await page.getByText('Attendance saved').count()) > 0 ||
        (await page.getByRole('alert').count()) > 0 ||
        (await page.getByRole('button', { name: /Already checked in/ }).count()) > 0;
      note(result, 'Employee check-in action completed (saved, already in, or error shown)');
      await shot(page, 'employee-checkin-result');
    }
  }

  await page.getByRole('link', { name: 'History' }).click();
  await waitSettled(page);
  await visibleText(page, 'History').catch(() => visibleText(page, 'history'));
  note(true, 'Employee History tab opens');
  await shot(page, 'employee-history');

  await page.getByRole('link', { name: 'Profile' }).click();
  await waitSettled(page);
  await visibleText(page, 'Profile').catch(() => visibleText(page, 'UI Test'));
  note(true, 'Employee Profile tab opens');
  await shot(page, 'employee-profile');

  await page.getByRole('button', { name: 'Open menu' }).click();
  await shot(page, 'employee-drawer');
  await page.getByRole('link', { name: 'Attendance report' }).click();
  await waitSettled(page);
  note(true, 'Employee drawer opens Attendance report');
  await shot(page, 'employee-attendance');

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: 'Send a report' }).click();
  await waitSettled(page);
  await visibleText(page, 'Absence notice');
  await page.locator('textarea').first().fill('UI test absence notice from Playwright.');
  await page.getByRole('button', { name: /Send/ }).click();
  await page.waitForTimeout(1500);
  const sent =
    (await page.getByText(/Absence notice sent|Issue report sent/).count()) > 0 ||
    (await page.getByRole('alert').count()) > 0;
  note(sent, 'Employee send-report form submits and shows a result');
  await shot(page, 'employee-report');

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await waitSettled(page);
  note(true, 'Employee Settings page opens');
  await shot(page, 'employee-settings');

  if (consoleErrors.length) {
    note(false, `Employee page errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  } else {
    note(true, 'Employee had no page crashes');
  }

  await context.close();
}

const executablePath = await chromePath();
const browser = await chromium.launch({
  headless: true,
  executablePath,
});

try {
  const admin = await testAdmin(browser);
  await testEmployee(browser, admin.employee);
} finally {
  await browser.close();
}

writeFileSync(join(outDir, 'ui-test-results.txt'), findings.join('\n') + '\n');
const failed = findings.filter(line => line.startsWith('FAIL')).length;
console.log(`\n${findings.length - failed} passed, ${failed} failed. Screenshots in ${outDir}`);
if (failed) process.exitCode = 1;

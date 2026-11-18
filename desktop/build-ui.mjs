import {cpSync, rmSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const adminDir = join(repoRoot, 'admin');
const uiDir = join(here, 'ui');

const build = spawnSync('npm', ['run', 'build:desktop'], {
  cwd: adminDir,
  stdio: 'inherit',
  shell: true,
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

rmSync(uiDir, {recursive: true, force: true});
cpSync(join(adminDir, 'dist'), uiDir, {recursive: true});
console.log('Copied admin/dist → desktop/ui');

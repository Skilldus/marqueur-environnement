import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const type = process.argv[2];
if (!['patch', 'minor', 'major'].includes(type) && !/^\d+\.\d+\.\d+$/.test(type ?? '')) {
  console.error('Usage: node scripts/release.mjs <patch|minor|major|x.y.z>');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8'));

const [maj, min, pat] = pkg.version.split('.').map(Number);
let next;
if (type === 'patch') next = `${maj}.${min}.${pat + 1}`;
else if (type === 'minor') next = `${maj}.${min + 1}.0`;
else if (type === 'major') next = `${maj + 1}.0.0`;
else next = type;

pkg.version = next;
manifest.version = next;

writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

const changelog = readFileSync('CHANGELOG.md', 'utf8');
if (!changelog.includes('## [Unreleased]')) {
  console.error('Error: no [Unreleased] section found in CHANGELOG.md — aborting.');
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
const updatedChangelog = changelog.replace(
  /^## \[Unreleased\]/m,
  `## [Unreleased]\n\n## [${next}] - ${today}`
);
writeFileSync('CHANGELOG.md', updatedChangelog);

const exec = cmd => execSync(cmd, { stdio: 'inherit' });
exec('git add package.json public/manifest.json CHANGELOG.md');
exec(`git commit -m "chore: release v${next}"`);
exec(`git tag v${next}`);
exec('git push');
exec('git push --tags');

console.log(`\nRelease v${next} pushed — GitHub Actions will create the GitHub Release automatically.`);

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface CliOptions {
  check: boolean;
}

interface PackageChange {
  filePath: string;
  changes: Array<{ depName: string; oldValue: string; section: string }>;
}

function parseArgs(argv: string[]): CliOptions {
  const args = new Set(argv);

  return {
    check: args.has('--check'),
  };
}

function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

function writeTextFile(filePath: string, text: string): void {
  fs.writeFileSync(filePath, text, 'utf8');
}

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);

    return true;
  }
  catch {
    return false;
  }
}

function isDirectory(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  }
  catch {
    return false;
  }
}

function parseWorkspacePackages(workspaceYamlText: string): string[] {
  const lines = workspaceYamlText.split(/\r?\n/);
  const packagesIndex = lines.findIndex(l => l.trim() === 'packages:');

  if (packagesIndex === -1)
    return [];

  const patterns: string[] = [];

  for (let i = packagesIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];

    if (!line.startsWith('  - '))
      break;
    const raw = line.slice('  - '.length).trim();
    const unquoted = (raw.startsWith('\'') && raw.endsWith('\'')) || (raw.startsWith('"') && raw.endsWith('"')) ? raw.slice(1, -1) : raw;

    if (unquoted.length > 0)
      patterns.push(unquoted);
  }

  return patterns;
}

function expandWorkspacePackageJsonPaths(repoRoot: string, patterns: string[]): string[] {
  const out = new Set<string>();

  for (const pattern of patterns) {
    if (pattern === '.' || pattern === './') {
      const pkg = path.join(repoRoot, 'package.json');

      if (fileExists(pkg))
        out.add(pkg);
      continue;
    }

    const normalized = pattern.replace(/\/+$/, '');

    if (normalized.endsWith('/*')) {
      const base = path.join(repoRoot, normalized.slice(0, -2));

      if (!isDirectory(base))
        continue;
      const entries = fs.readdirSync(base, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory())
          continue;
        const pkg = path.join(base, entry.name, 'package.json');

        if (fileExists(pkg))
          out.add(pkg);
      }

      continue;
    }

    const prefix = normalized.split(/[*{[]/, 1)[0];
    const startDir = path.join(repoRoot, prefix);

    if (!isDirectory(startDir))
      continue;

    const queue: string[] = [startDir];

    while (queue.length > 0) {
      const dir = queue.shift();

      if (!dir)
        continue;
      const pkg = path.join(dir, 'package.json');

      if (fileExists(pkg))
        out.add(pkg);

      let entries: fs.Dirent[];

      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      }
      catch {
        continue;
      }

      for (const entry of entries) {
        if (!entry.isDirectory())
          continue;
        if (entry.name === 'node_modules' || entry.name.startsWith('.'))
          continue;
        queue.push(path.join(dir, entry.name));
      }
    }
  }

  return Array.from(out).sort();
}

function readPackageJson(filePath: string): PackageJson {
  const raw = readTextFile(filePath);

  return JSON.parse(raw) as PackageJson;
}

function collectAllDependencyNames(pkg: PackageJson): Set<string> {
  const sections: Array<Record<string, string> | undefined> = [pkg.dependencies, pkg.devDependencies, pkg.optionalDependencies, pkg.peerDependencies];
  const out = new Set<string>();

  for (const deps of sections) {
    if (!deps)
      continue;
    for (const name of Object.keys(deps)) {
      out.add(name);
    }
  }

  return out;
}

function collectNonCatalogDependencySpecs(pkg: PackageJson): Map<string, string> {
  const sections: Array<Record<string, string> | undefined> = [pkg.dependencies, pkg.devDependencies, pkg.optionalDependencies, pkg.peerDependencies];
  const out = new Map<string, string>();

  for (const deps of sections) {
    if (!deps)
      continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (spec === 'workspace:*')
        continue;
      if (spec.startsWith('catalog'))
        continue;
      const existing = out.get(name);

      if (!existing || spec > existing) {
        out.set(name, spec);
      }
    }
  }

  return out;
}

function findCatalogBlockRange(lines: string[]): { start: number; end: number } {
  const start = lines.findIndex(l => l.trim() === 'catalog:');

  if (start === -1) {
    throw new Error('pnpm-workspace.yaml 缺少 catalog: 区块');
  }

  let end = start + 1;

  while (end < lines.length && lines[end].startsWith('  ')) end += 1;

  return { start, end };
}

function parseYamlKey(raw: string): string {
  const trimmed = raw.trim();

  if ((trimmed.startsWith('\'') && trimmed.endsWith('\'')) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseExistingCatalog(lines: string[], start: number, end: number): Map<string, string> {
  const out = new Map<string, string>();

  for (let i = start + 1; i < end; i += 1) {
    const line = lines[i];

    if (line.trim().length === 0)
      continue;
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const match = /^ {2}(.+?):\s*(.+?)\s*$/.exec(line);

    if (!match)
      continue;
    const key = parseYamlKey(match[1]);
    const value = match[2].trim();

    out.set(key, value);
  }

  return out;
}

function normalizeYamlKey(key: string): string {
  if (key.startsWith('@'))
    return `'${key}'`;
  if (key.includes(':') || key.includes('#') || key.includes('{') || key.includes('[')) {
    return `"${key.replace(/"/g, '\\"')}"`;
  }

  return key;
}

interface Semver { major: number; minor: number; patch: number; prerelease: string | null }

function parseSemver(version: string): Semver | null {
  const match = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/.exec(version);

  if (!match)
    return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
}

function compareSemver(a: Semver, b: Semver): number {
  if (a.major !== b.major)
    return a.major - b.major;
  if (a.minor !== b.minor)
    return a.minor - b.minor;
  if (a.patch !== b.patch)
    return a.patch - b.patch;
  if (a.prerelease === b.prerelease)
    return 0;
  if (a.prerelease === null)
    return 1;
  if (b.prerelease === null)
    return -1;

  return a.prerelease.localeCompare(b.prerelease);
}

function pickCatalogValue(candidates: Iterable<string>): string | null {
  const arr = Array.from(candidates);

  if (arr.length === 0)
    return null;

  const npmAlias = arr.find(v => v.startsWith('npm:'));

  if (npmAlias)
    return npmAlias;

  const semvers = arr.map(v => ({ raw: v, semver: parseSemver(v) })).filter((x): x is { raw: string; semver: Semver } => x.semver !== null);

  if (semvers.length > 0) {
    semvers.sort((a, b) => compareSemver(a.semver, b.semver));
    const best = semvers[semvers.length - 1].raw;

    if (best.includes('-'))
      return best;

    return `^${best}`;
  }

  return arr[0];
}

function formatCatalogBlock(entries: Array<{ name: string; value: string }>): string[] {
  const lines: string[] = ['catalog:'];

  for (const { name, value } of entries) {
    lines.push(`  ${normalizeYamlKey(name)}: ${value}`);
  }

  return lines;
}

function detectPackageJsonChanges(filePath: string, depNames: Set<string>): PackageChange | null {
  const content = readTextFile(filePath);
  const pkg = JSON.parse(content) as PackageJson;
  const changes: Array<{ depName: string; oldValue: string; section: string }> = [];
  const sections: Array<'dependencies' | 'devDependencies' | 'optionalDependencies'> = ['dependencies', 'devDependencies', 'optionalDependencies'];

  for (const section of sections) {
    const deps = pkg[section];

    if (!deps)
      continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (depNames.has(name) && !spec.startsWith('catalog') && spec !== 'workspace:*') {
        changes.push({ depName: name, oldValue: spec, section });
      }
    }
  }

  if (changes.length === 0)
    return null;

  return { filePath, changes };
}

function applyPackageJsonChanges(filePath: string, depNames: Set<string>): PackageChange | null {
  const content = readTextFile(filePath);
  const pkg = JSON.parse(content) as PackageJson;
  const changes: Array<{ depName: string; oldValue: string; section: string }> = [];
  const sections: Array<'dependencies' | 'devDependencies' | 'optionalDependencies'> = ['dependencies', 'devDependencies', 'optionalDependencies'];

  for (const section of sections) {
    const deps = pkg[section];

    if (!deps)
      continue;
    for (const [name, spec] of Object.entries(deps)) {
      if (depNames.has(name) && !spec.startsWith('catalog') && spec !== 'workspace:*') {
        changes.push({ depName: name, oldValue: spec, section });
        deps[name] = 'catalog:';
      }
    }
  }

  if (changes.length === 0)
    return null;

  const updatedContent = `${JSON.stringify(pkg, null, '\t')}\n`;

  writeTextFile(filePath, updatedContent);

  return { filePath, changes };
}

function main(): void {
  const repoRoot = process.cwd();
  const options = parseArgs(process.argv.slice(2));
  const workspacePath = path.join(repoRoot, 'pnpm-workspace.yaml');

  if (!fileExists(workspacePath)) {
    throw new Error(`未找到 pnpm-workspace.yaml：${workspacePath}`);
  }

  const workspaceText = readTextFile(workspacePath);
  const workspaceLines = workspaceText.split(/\r?\n/);
  const patterns = parseWorkspacePackages(workspaceText);
  const packageJsonPaths = expandWorkspacePackageJsonPaths(repoRoot, patterns);
  const allDepNames = new Set<string>();
  const nonCatalogVersions = new Map<string, Set<string>>();

  for (const pkgJsonPath of packageJsonPaths) {
    const pkg = readPackageJson(pkgJsonPath);

    for (const name of collectAllDependencyNames(pkg)) {
      allDepNames.add(name);
    }

    const nonCatalogSpecs = collectNonCatalogDependencySpecs(pkg);

    for (const [name, spec] of nonCatalogSpecs) {
      const set = nonCatalogVersions.get(name) ?? new Set<string>();

      set.add(spec);
      nonCatalogVersions.set(name, set);
    }
  }

  const { start: catalogStart, end: catalogEnd } = findCatalogBlockRange(workspaceLines);
  const existingCatalog = parseExistingCatalog(workspaceLines, catalogStart, catalogEnd);
  const newEntries: Array<{ name: string; value: string }> = [];
  const newCatalogDeps = new Set<string>();
  const sortedDepNames = Array.from(allDepNames).sort((a, b) => a.localeCompare(b));

  for (const name of sortedDepNames) {
    const existing = existingCatalog.get(name);

    if (existing) {
      newEntries.push({ name, value: existing });
      continue;
    }

    const candidates = nonCatalogVersions.get(name);
    const picked = candidates ? pickCatalogValue(candidates) : null;

    if (picked) {
      newEntries.push({ name, value: picked });
      newCatalogDeps.add(name);
    }
  }

  const newCatalogBlockLines = formatCatalogBlock(newEntries);
  const nextLines = [...workspaceLines.slice(0, catalogStart), ...newCatalogBlockLines, ...workspaceLines.slice(catalogEnd)];
  const nextText = `${nextLines.join('\n').replace(/\s+$/u, '')}`.trim();
  const catalogChanged = nextText !== `${workspaceLines.join('\n').trim()}`;

  const catalogChangedLines = [
    ...nextLines.filter(s => !workspaceLines.includes(s)).map(s => `新增 catalog 依赖：${s}`),
    ...workspaceLines.filter(s => !nextLines.includes(s)).map(s => `删除 catalog 依赖：${s}`),
  ];

  const allCatalogDeps = new Set([...existingCatalog.keys(), ...newCatalogDeps]);
  const packageChanges: PackageChange[] = [];

  for (const pkgJsonPath of packageJsonPaths) {
    if (options.check) {
      const change = detectPackageJsonChanges(pkgJsonPath, allCatalogDeps);

      if (change) {
        packageChanges.push(change);
      }
    }
    else {
      const change = applyPackageJsonChanges(pkgJsonPath, allCatalogDeps);

      if (change) {
        packageChanges.push(change);
      }
    }
  }

  const hasChanges = catalogChanged || packageChanges.length > 0;

  if (options.check) {
    if (hasChanges) {
      process.stderr.write('需要更新：\n');
      if (catalogChanged) {
        process.stderr.write('\n[pnpm-workspace.yaml]\n');
        process.stderr.write(`${catalogChangedLines.join('\n')}\n`);
      }

      if (packageChanges.length > 0) {
        process.stderr.write('\n[package.json 需要改为 catalog:]\n');
        for (const change of packageChanges) {
          process.stderr.write(`${change.filePath}:\n`);
          for (const c of change.changes) {
            process.stderr.write(`  - ${c.depName}: ${c.oldValue} -> catalog:\n`);
          }
        }
      }

      // @ts-expect-error exitCode 是只读属性
      process.exitCode = 1;
    }
    else {
      process.stdout.write('无需更新\n');
    }

    return;
  }

  if (catalogChanged) {
    writeTextFile(workspacePath, nextText);
    process.stdout.write('已更新 pnpm-workspace.yaml\n');
  }

  if (packageChanges.length > 0) {
    process.stdout.write(`\n已更新 ${packageChanges.length} 个 package.json:\n`);
    for (const change of packageChanges) {
      process.stdout.write(`  ${change.filePath}\n`);
      for (const c of change.changes) {
        process.stdout.write(`    - ${c.depName}: ${c.oldValue} -> catalog:\n`);
      }
    }
  }

  if (!catalogChanged && packageChanges.length === 0) {
    process.stdout.write('无需更新\n');
  }
}

main();

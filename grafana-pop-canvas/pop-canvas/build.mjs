import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const source = fileURLToPath(new URL('./src/', import.meta.url));
const target = fileURLToPath(new URL('../plugins/poplab-popcanvas-panel/', import.meta.url));
const esbuild = process.argv[2] ? resolve(process.argv[2]) : 'esbuild';
const external = ['react', '@grafana/data', '@grafana/ui'];
const compiled = execFileSync(esbuild, [
  resolve(source, 'module.jsx'), '--bundle', '--format=cjs', '--platform=browser',
  '--target=es2022', ...external.map((name) => '--external:' + name),
], { encoding: 'utf8' });

const systemModule = `System.register(${JSON.stringify(external)}, function (publish) {
  const modules = Object.create(null);
  return {
    setters: ${JSON.stringify(external)}.map(name => value => { modules[name] = value; }),
    execute: function () {
      const module = { exports: {} };
      const exports = module.exports;
      function require(name) { return modules[name]; }
${compiled}
      publish('plugin', module.exports.plugin);
    }
  };
});
`;
mkdirSync(target, { recursive: true });
writeFileSync(resolve(target, 'module.js'), systemModule);
for (const file of ['plugin.json', 'icon.svg']) {
  copyFileSync(resolve(source, file), resolve(target, file));
}

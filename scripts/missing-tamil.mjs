// Lists every message key whose Tamil value is empty (brief, section 10).
import fs from 'node:fs';
import path from 'node:path';

const dir = 'src/i18n';
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]],
  );

let missing = 0;
for (const file of fs.readdirSync(path.join(dir, 'en'))) {
  const ns = file.replace('.json', '');
  const en = flatten(JSON.parse(fs.readFileSync(path.join(dir, 'en', file), 'utf8')));
  const taPath = path.join(dir, 'ta', file);
  const ta = Object.fromEntries(
    fs.existsSync(taPath) ? flatten(JSON.parse(fs.readFileSync(taPath, 'utf8'))) : [],
  );
  for (const [key] of en) {
    if (!ta[key]) {
      console.log(`${ns}:${key}`);
      missing++;
    }
  }
}
console.log(`\n${missing} keys have no Tamil value.`);

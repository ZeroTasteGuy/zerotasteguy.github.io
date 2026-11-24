// Docusaurus copies static/ into every language folder. The German site only needs
// its own copy of the files its pages use, so the second copy of the VLTL app and
// the domain files are removed from build/de/ (VLTL stays at /vltl/).
import fs from 'node:fs';
import path from 'node:path';

const de = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../build/de');
for (const name of ['vltl', 'CNAME', 'robots.txt', 'google54c41ed56dcd890e.html']) {
  fs.rmSync(path.join(de, name), {recursive: true, force: true});
}

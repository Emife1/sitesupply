import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const htmlFiles = ['index.html','compare.html','suppliers.html','about.html','accessibility.html','contact.html','privacy.html','terms.html','workspace.html','404.html'];
const jsFiles = ['site.js','analytics.js','app.js','components.js','data.js','services.js','store.js','api/_shared.js','api/health.js','api/quotes.js','api/suppliers.js','api/contact.js'];
const errors = [];

for (const file of htmlFiles) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  if (!/<title>[^<]+<\/title>/i.test(text)) errors.push(`${file}: missing title`);
  if (!/<meta name="description" content="[^"]+"/i.test(text)) errors.push(`${file}: missing description`);
  if (!/<link rel="canonical" href="https:\/\/sitesupply-eight\.vercel\.app/i.test(text)) errors.push(`${file}: missing canonical`);
  if (!/<main[^>]*id="main"/i.test(text)) errors.push(`${file}: missing main landmark`);
  if (/<body[^>]*>\s*<\/body>/i.test(text)) errors.push(`${file}: empty body`);
}
const workspace = fs.readFileSync(path.join(root, 'workspace.html'), 'utf8');
if (!workspace.includes('id="app"') || !workspace.includes('src="/app.js"')) errors.push('workspace.html: app mount or module missing');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!/early access/i.test(index) || !/href=[\"']\/compare[\"']/i.test(index)) errors.push('index.html: launch CTA missing');

for (const file of jsFiles) {
  try { execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' }); }
  catch (error) { errors.push(`${file}: JavaScript syntax error\n${error.stderr?.toString() || error.message}`); }
}
for (const required of ['robots.txt','sitemap.xml','vercel.json','site.webmanifest','assets/logo.svg','assets/og-image.svg']) {
  if (!fs.existsSync(path.join(root, required))) errors.push(`${required}: missing`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${htmlFiles.length} HTML pages, ${jsFiles.length} JavaScript files, and launch metadata.`);

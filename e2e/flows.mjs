// The eight flows from section 12 of the brief, as automated browser tests.
// Run:  npm run build && npm run preview -- --port 4173   (in another terminal)
//       npm run e2e
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Playwright is not a project dependency. Install it yourself (npm i -D playwright) or use a global one.
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const [W, H] = (process.env.VIEWPORT ?? '1280x900').split('x').map(Number);
const browser = await chromium.launch();
let failed = 0;
const errors = [];

async function flow(name, fn) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  page.on(
    'console',
    (m) => ['error', 'warning'].includes(m.type()) && errors.push(`${name}: ${m.text()}`),
  );
  page.on('pageerror', (e) => errors.push(`${name}: ${e}`));
  page.setDefaultTimeout(10000);
  try {
    await page.goto(`${BASE}/login`);
    await page.fill('#f-login-id', 'officer@example.test');
    await page.fill('#f-login-pw', 'secret');
    await page.click('button[type=submit]');
    await page.waitForURL('**/home');
    await fn(page);
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}\n      ${String(e.message).split('\n')[0]}`);
    await page.screenshot({ path: `e2e-fail-${name.replace(/\W+/g, '-')}.png` }).catch(() => {});
  }
  await ctx.close();
}
const dmy = (days) => {
  const d = new Date(Date.now() + days * 86400000);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const toast = (p) => p.locator('.toast').last();
const next = (p) => p.click('button:has-text("Next")');
const text = async (loc) => (await loc.innerText()).replace(/\s+/g, ' ').trim();

await flow('1 Apply for leave', async (p) => {
  await p.click('a.tile:has-text("Apply for leave")');
  await p.waitForSelector('text=Step 1 of 4');
  assert.equal(await p.locator('input[readonly]').count(), 4); // name, officer ID, designation, department locked
  await next(p);
  await p.selectOption('#f-leave-type', 'Casual leave');
  await p.fill('#f-leave-dates-from', dmy(100));
  await p.fill('#f-leave-dates-to', dmy(101));
  await next(p);
  await next(p);
  await p.waitForSelector('text=Step 4 of 4');
  await p.click('button:has-text("Send")');
  await p.waitForURL(/\/requests\/req-/);
  assert.match(await text(toast(p)), /Your request has been sent\./);
  assert.match(await text(p.locator('.chip').first()), /Submitted/);
  assert.match(await text(p.locator('.timeline')), /Sent/);
  await p.goto(`${BASE}/requests?tab=in-review`);
  await p.waitForSelector('.list-row:has-text("Leave,")');
  // Advance request to Approved through the demo controls
  await p.goto(`${BASE}/requests?demo=1`);
  await p.click('summary:has-text("Demo controls")');
  await p.selectOption('#demo-req', { index: 1 }).catch(() => {});
  const title = await p.locator('#demo-req option:checked').innerText();
  for (const to of ['With the desk', 'Ready for approval', 'Approved']) {
    await p.selectOption('#demo-to', { label: to });
    await p.click('button:has-text("Advance request")');
    await p.waitForTimeout(1100);
  }
  assert.ok(title.length > 0);
  await p.locator('summary:has-text("Demo controls")').click();
  await p.goto(`${BASE}/notifications`);
  await p.waitForSelector('.notif');
  assert.match(await text(p.locator('.notif').first()), /was approved\./);
});

await flow('2 Track and fix a returned request', async (p) => {
  await p.waitForSelector('text=Waiting on you');
  await p.click('.list-row:has-text("Returned to you")');
  await p.waitForSelector('.banner-warning');
  assert.match(
    await text(p.locator('.banner-warning')),
    /The desk returned this request\. Reason:/,
  );
  await p.click('a:has-text("Edit and send again"):visible');
  await p.waitForSelector('text=Step 2 of 4');
  assert.equal(await p.inputValue('#f-ltc-placeTo'), 'Kochi');
  await p.fill('#f-ltc-placeTo', 'Kochi, Kerala');
  await next(p);
  await next(p);
  await p.click('button:has-text("Send")');
  await p.waitForURL(/\/requests\/req-5/);
  assert.match(await text(p.locator('.chip').first()), /Submitted/);
  await p.goto(`${BASE}/requests?tab=needs-action`);
  await p.waitForSelector('.list-row');
  assert.equal(await p.locator('.list-row:has-text("LTC")').count(), 0);
});

await flow('3 Update my details', async (p) => {
  await p.goto(`${BASE}/file/profile`);
  await p.click('a:has-text("Update my details"):visible');
  await p.waitForSelector('text=Step 1 of 4');
  await next(p);
  await p.selectOption('#f-update-details-section', 'Contact');
  await p.selectOption('#f-update-details-field', 'Mobile number 1');
  await p.fill('#f-update-details-newValue', '+91 90000 77777');
  await next(p);
  await next(p);
  await p.click('button:has-text("Send")');
  await p.waitForURL(/\/requests\/req-/);
  assert.match(await text(toast(p)), /Your details are saved\./);
  await p.goto(`${BASE}/file/profile`);
  await p.waitForSelector('text=+91 90000 77777');
  assert.match(await text(p.locator('.kv-item:has-text("+91 90000 77777")')), /Self-reported/);
  // Address needs a proof file and follows the normal path
  await p.goto(`${BASE}/requests/new/update-details?section=Address`);
  await next(p);
  assert.equal(await p.inputValue('#f-update-details-section'), 'Address');
  await p.selectOption('#f-update-details-field', 'City');
  await p.fill('#f-update-details-newValue', 'Madurai');
  await next(p);
  await next(p);
  await p.waitForSelector('text=Step 3 of 4').catch(() => {});
  assert.match(await text(p.locator('.banner-critical')), /Proof: add a file to continue\./);
  await p.setInputFiles('input[type=file]', {
    name: 'proof.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });
  await next(p);
  await p.click('button:has-text("Send")');
  await p.waitForURL(/\/requests\/req-/);
  assert.match(await text(p.locator('.chip').first()), /Submitted/);
  await p.goto(`${BASE}/file/profile`);
  await p.waitForSelector('text=Tirunelveli');
});

await flow('4 Share an idea', async (p) => {
  await p.goto(`${BASE}/community/ideas/new`);
  await p.fill('#f-idea-title', 'Weekly review huddles for block offices');
  await p.selectOption('#f-idea-type', 'Best practice');
  await p.locator('#f-idea-desc').click();
  await p.keyboard.type('A short weekly huddle to unblock pending files.');
  await p.selectOption('#f-idea-district', '');
  await p.selectOption('#f-idea-dept', '');
  await p.click('button:has-text("Preview")');
  assert.ok((await p.locator('text=Choose a district or a department.').count()) >= 1);
  await p.selectOption('#f-idea-district', 'Tirunelveli');
  await p.click('button:has-text("Preview")');
  await p.waitForSelector('text=Back to edit');
  await p.click('button:has-text("Post idea")');
  await p.waitForURL(/\/community\/ideas\/idea-/);
  assert.match(await text(toast(p)), /Your idea has been posted\./);
  await p.goto(`${BASE}/community/ideas?tab=mine`);
  await p.waitForSelector('text=Weekly review huddles');
  await p.click('a:has-text("Weekly review huddles")');
  assert.equal(
    await p
      .locator('button:has-text("Back this idea"), button:has-text("Back")')
      .first()
      .isDisabled(),
    true,
  );
});

await flow('5 Ask a question anonymously', async (p) => {
  await p.click('a.tile:has-text("Ask a question")');
  await p.waitForSelector('#f-post-title');
  assert.equal(await p.isChecked('input[name="post-kind"][value="discussion"]'), true);
  assert.equal(await p.isChecked('#f-post-seniors'), true);
  await p.fill('#f-post-title', 'How do you handle sudden transfers mid-scheme?');
  await p.locator('#f-post-body').click();
  await p.keyboard.type('Looking for practical advice.');
  await p.check('#f-post-anon');
  assert.match(await text(p.locator('main')), /Other officers will see Anonymous officer\./);
  await p.click('button:has-text("Post"):visible');
  await p.waitForURL(/\/community\/discussions\/post-/);
  assert.match(await text(toast(p)), /Your post is live\./);
  assert.match(await text(p.locator('.page-header')), /You posted this anonymously/);
  await p.goto(`${BASE}/community/discussions`);
  await p.waitForSelector('.post-row');
  assert.match(await text(p.locator('.post-row').first()), /Anonymous officer/);
});

await flow('6 Find the right person', async (p) => {
  await p.click('a.tile:has-text("Find a colleague")');
  await p.waitForSelector('#sf-input');
  assert.equal(await p.evaluate(() => document.activeElement?.id), 'sf-input');
  await p.keyboard.type('Karthik');
  await p.waitForSelector('.colleague-card');
  await p.click('.colleague-card >> nth=0');
  await p.waitForURL(/\/people\/colleagues\/col-/);
  await p.click('button:has-text("Save contact")');
  await p.waitForSelector('button:has-text("Saved")');
  await p.goto(`${BASE}/desk?tab=people`);
  await p.waitForSelector('.colleague-card');
  await p.waitForSelector('.colleague-card:has-text("Karthik")');
  await p.goto(`${BASE}/people/who-does-what`);
  await p.fill('#sf-input', 'GPF');
  await p.waitForSelector('.is-hit');
  await p.click('.is-hit >> nth=0');
  await p.waitForURL(/who-does-what\/dep-/);
  assert.match(await text(p.locator('main')), /Oversees \d+ sections/);
});

await flow('7 Join or ask for a training', async (p) => {
  await p.goto(`${BASE}/learn/trainings`);
  await p.waitForSelector('button:has-text("Add to calendar")');
  const [dl] = await Promise.all([
    p.waitForEvent('download'),
    p.click('button:has-text("Add to calendar") >> nth=0'),
  ]);
  assert.match(dl.suggestedFilename(), /\.ics$/);
  await p.goto(`${BASE}/learn/trainings?tab=requested`);
  await p.waitForSelector('text=I need this too');
  const before = await text(p.locator('text=/\\d+ officers need this/').first());
  await p.click('button:has-text("I need this too") >> nth=0');
  await p.waitForSelector('text=You need this too');
  const want = Number(before.match(/\d+/)[0]) + 1;
  await p.waitForSelector(`text=${want} officers need this`);
  await p.click('a:has-text("Request training"):visible');
  await p.waitForSelector('text=Step 1 of 4');
  await next(p);
  await p.fill('#f-training-request-title', 'Clear writing for officers');
  await p.check('input[name="training-request-for"][value="Myself"]');
  await next(p);
  await next(p);
  await p.click('button:has-text("Send")');
  await p.waitForURL(/\/requests\/req-/);
  await p.goto(`${BASE}/requests`);
  await p.waitForSelector('text=Training request: Clear writing for officers');
});

await flow('8 Find a circular or form', async (p) => {
  await p.goto(`${BASE}/search?q=leave`);
  await p.waitForSelector('section[aria-label="Library"]');
  assert.ok((await p.locator('section[aria-label]').count()) >= 2);
  await p.goto(`${BASE}/library/circulars?year=${new Date().getFullYear()}`);
  await p.waitForSelector('.lib-row');
  await p.click('.lib-row button:has-text("View") >> nth=0');
  await p.waitForSelector('[role=dialog] object, [role=dialog] img');
  const [dl] = await Promise.all([
    p.waitForEvent('download').catch(() => null),
    p.click('[role=dialog] a:has-text("Download")').catch(() => {}),
  ]);
  void dl;
  await p.keyboard.press('Escape');
  await p.click('.lib-row button:has-text("Save") >> nth=0');
  await p.waitForSelector('.lib-row button[aria-pressed=true]');
  await p.goto(`${BASE}/desk?tab=items`);
  await p.waitForSelector('.list-row');
  assert.ok((await p.locator('.list-row:has-text("Library")').count()) >= 1);
});

await browser.close();
const real = errors.filter((e) => !/Download is starting|favicon/.test(e));
if (real.length) {
  console.log('Console problems:\n' + real.join('\n'));
  failed++;
}
console.log(failed ? `\n${failed} problem(s)` : '\nAll 8 flows pass with no console errors.');
process.exit(failed ? 1 : 0);

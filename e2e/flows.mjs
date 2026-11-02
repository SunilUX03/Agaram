// The fourteen flows from section 8 of the v2 spec, as automated browser tests.
// Run:  npm run build && npm run preview -- --port 4173   (in another terminal)
//       npm run e2e        (VIEWPORT=390x800 npm run e2e for a phone)
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
  if (process.env.ONLY && !name.startsWith(process.env.ONLY + ' ')) return;
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
    await fn(page, ctx);
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}\n      ${String(e.message).split('\n').slice(0, 6).join(' | ')}`);
    await page.screenshot({ path: `e2e-fail-${name.replace(/\W+/g, '-')}.png` }).catch(() => {});
  }
  await ctx.close();
}
const dmy = (days) => {
  const d = new Date(Date.now() + days * 86400000);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const toast = (p) => p.locator('.toasts .ux4g-alert').last();
const text = async (loc) => (await loc.innerText()).replace(/\s+/g, ' ').trim();
/** Choose an option in a UX4G dropdown. Empty label picks the blank option. */
const pick = async (p, sel, label) => {
  await p.click(sel);
  await p
    .locator(`${sel}-list [role=option]${label ? `:text-is("${label}")` : ''}`)
    .first()
    .click();
};
/** Leave types show the days left beside them, so the option text is "Casual leave (CL)12 left". */
const pickLeave = async (p, label, left) => {
  await p.click('#f-leave-type');
  if (left)
    await p.waitForSelector(
      '#f-leave-type-list [role=option]:has-text("Earned leave (EL)"):has-text("120 left")',
    );
  await p.locator(`#f-leave-type-list [role=option]:has-text("${label}")`).first().click();
  if (left) await waitText(p, `You have ${left} days of Casual leave left.`);
};
const radio = (p, label) => p.locator(`label.ux4g-radio:has-text("${label}")`).first().click();
const sendBtn = (p) => p.click('button:has-text("Send for approval"):visible');
const newMenu = async (p, item) => {
  await p.click('button[aria-haspopup=menu]:has-text("New request"):visible');
  await p.click(`[role=menuitem]:has-text("${item}")`);
};
/** The approver's decision, through the demo controls (the page is reloaded with ?demo=1). Pass the request id when more than one is waiting. */
const decide = async (p, path, button, reason, id) => {
  await p.goto(`${BASE}${path}${path.includes('?') ? '&' : '?'}demo=1`);
  await p.waitForSelector('summary:has-text("Demo controls")');
  await p.click('summary:has-text("Demo controls")');
  await p.waitForFunction(() => {
    const o = document.querySelector('#demo-req option');
    return o && !/No request waiting/.test(o.textContent ?? '');
  });
  const want = id ?? /\/records\/requests\/(req-\d+)/.exec(path)?.[1];
  if (want) await p.selectOption('#demo-req', want);
  if (reason) await p.fill('#demo-reason', reason);
  await p.click(`details.demo-panel button:has-text("${button}")`);
  await p.waitForSelector('.toasts .ux4g-alert:has-text("Request updated.")');
  await p.waitForTimeout(500);
};
const waitText = (p, t) => p.waitForSelector(`text=${t}`);

await flow('1 Apply for leave', async (p) => {
  await p.goto(`${BASE}/records`);
  await newMenu(p, 'Apply for leave');
  await p.waitForSelector('#f-leave-type');
  assert.equal(await p.locator('input[readonly]').count(), 4); // name, officer ID, designation, department
  await pickLeave(p, 'Casual leave (CL)', 12);
  await p.fill('#f-leave-dates-from', dmy(100));
  await p.fill('#f-leave-dates-to', dmy(101));
  await waitText(p, 'This uses 2 days. 10 will be left.');
  await sendBtn(p);
  await p.waitForURL(/\/records\/requests\/req-/);
  assert.match(await text(toast(p)), /Your request has been sent for approval\./);
  await p.waitForSelector('[class*="ux4g-tag-"]:has-text("Waiting for approval")');
  const url = new URL(p.url()).pathname;
  await decide(p, url, 'Approve');
  await p.goto(`${BASE}/notifications?filter=requests`);
  await p.waitForSelector('.list-row:has-text("was approved")');
  assert.match(
    await text(p.locator('.list-row:has-text("was approved")').first()),
    /Leave, .* was approved\./,
  );
  await p.goto(`${BASE}/records/services/leave`);
  await waitText(p, '10 of 20 left');
  await p.click('[role=tab]:has-text("History")');
  await p.waitForSelector('td:has-text("Casual leave"), li:has-text("Casual leave")');
});

await flow('2 Add a past leave from paper', async (p) => {
  await p.goto(`${BASE}/records/services/leave`);
  await p.click('a:has-text("Add a past leave")');
  await waitText(p, 'You are adding something that already happened');
  await pickLeave(p, 'Casual leave (CL)', 12);
  await p.fill('#f-leave-dates-from', dmy(-620));
  await p.fill('#f-leave-dates-to', dmy(-619));
  await sendBtn(p); // no proof file yet
  await waitText(p, 'Scan of the paper record or order: add a file to continue.');
  // overlap with an approved leave is blocked in this form too
  await p.fill('#f-leave-dates-from', dmy(-95));
  await p.fill('#f-leave-dates-to', dmy(-94));
  await p.setInputFiles('#f-leave-proof', {
    name: 'scan.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });
  await sendBtn(p);
  await waitText(p, 'These dates overlap with');
  await p.fill('#f-leave-dates-from', dmy(-620));
  await p.fill('#f-leave-dates-to', dmy(-619));
  await sendBtn(p);
  await p.waitForURL(/\/records\/requests\/req-/);
  await waitText(p, 'Added from paper record');
  const url = new URL(p.url()).pathname;
  await decide(p, url, 'Approve');
  await p.goto(`${BASE}/records/services/leave?tab=history`);
  await p.waitForSelector('text=Added from paper record');
  await p.goto(`${BASE}/records/services/leave`);
  await waitText(p, '10 of 20 left');
});

await flow('3 Edit a profile field', async (p) => {
  await p.goto(`${BASE}/records/profile`);
  await p.waitForSelector('text=Contact and address');
  assert.ok((await p.locator('.lock').count()) > 5);
  await p.click('button:has-text("Edit"):has-text("Contact and address")');
  await p.fill('#f-pe-line', '99, Changed Road, Sample Nagar');
  await sendBtn(p);
  assert.match(await text(toast(p)), /Your change has been sent for approval\./);
  await waitText(p, 'Change pending');
  await waitText(p, 'You asked for: 99, Changed Road');
  assert.match(await p.innerText('main'), /12, Sample Colony/); // the old value stays until approved
  await p.click('button:has-text("Edit"):has-text("Contact and address")');
  assert.equal(
    (await p
      .locator('#f-pe-line')
      .isDisabled()
      .catch(() => false)) || (await p.locator('#f-pe-line[readonly]').count()) > 0,
    true,
  );
  await waitText(p, 'A change to this is waiting for approval.');
  await p.keyboard.press('Escape');
  await decide(p, '/records/profile', 'Approve');
  await p.goto(`${BASE}/records/profile`);
  await p.waitForSelector('text=99, Changed Road');
  // the address no longer shows a pending chip (the seeded email change still does)
  assert.equal(
    await p.locator('.kv-item:has-text("Residential address"):has-text("Change pending")').count(),
    0,
  );
  // a locked field: Report a correction opens the correction form
  await p.click('button:has-text("Report a correction"):visible >> nth=0');
  await waitText(p, 'What is wrong');
});

await flow('4 Career', async (p) => {
  await p.goto(`${BASE}/records/profile?tab=career`);
  await p.click('button:has-text("Add posting")');
  await pick(p, '#f-posting-postingIn', 'Chennai');
  await pick(p, '#f-posting-department', 'Finance Department');
  await pick(p, '#f-posting-designation', 'Deputy Secretary');
  await radio(p, 'Permanent');
  await pick(p, '#f-posting-locationChange', 'Within state');
  await p.fill('#f-posting-fromDate', dmy(30));
  await p.click('button:has-text("Send for approval"):visible');
  await waitText(p, 'End your current posting on');
  await p.click('button:has-text("End it and send")');
  assert.match(await text(toast(p)), /Your change has been sent for approval\./);
  await decide(p, '/records/profile?tab=career', 'Approve');
  await p.goto(`${BASE}/records/profile?tab=career`);
  await p.waitForSelector('.career-item:has-text("Deputy Secretary"):has-text("Added by you")');
  // promotion updates Last Promotion Date
  await p.click('button:has-text("Add promotion")');
  await pick(p, '#f-promotion-fromGrade', 'Selection Grade');
  await pick(p, '#f-promotion-toGrade', 'Super Time Scale');
  await p.fill('#f-promotion-promotionDate', dmy(-5));
  await p.setInputFiles('#f-promotion-orderFile', {
    name: 'order.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });
  await p.click('button:has-text("Send for approval"):visible');
  await p.waitForSelector('.toasts .ux4g-alert');
  await decide(p, '/records/profile', 'Approve');
  await p.goto(`${BASE}/records/profile`);
  await waitText(p, 'Last Promotion Date');
});

await flow('5 Record an LTC trip', async (p) => {
  await p.goto(`${BASE}/records/services/ltc`);
  await waitText(p, 'This page records trips. It does not process claims.');
  await p.click('a:has-text("Record an LTC trip")');
  await p.fill('#f-ltc-blockYear', '2024 to 2027');
  await p.fill('#f-ltc-dates-from', dmy(-40));
  await p.fill('#f-ltc-dates-to', dmy(-35));
  await p.fill('#f-ltc-placeFrom', 'Tirunelveli');
  await p.fill('#f-ltc-placeTo', 'Goa');
  await radio(p, 'Family');
  await pick(p, '#f-ltc-leaveAvailed', 'Casual leave');
  await sendBtn(p); // past dates need the scan
  await waitText(p, 'Scan of the paper record or order: add a file to continue.');
  await p.setInputFiles('#f-ltc-proof', {
    name: 'scan.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });
  await sendBtn(p);
  await p.waitForURL(/\/records\/requests\/req-/);
  const url = new URL(p.url()).pathname;
  await decide(p, url, 'Approve');
  await p.goto(`${BASE}/records/services/ltc`);
  await p.waitForSelector('text=Goa');
  await waitText(p, 'Trips recorded: 2.');
});

await flow('6 Medical and GPF', async (p) => {
  await p.goto(`${BASE}/records/services/medical/new`);
  await p.fill('#f-medical-description', 'Check-up and tests');
  await p.fill('#f-medical-hospital', 'Sample Hospital');
  await p.fill('#f-medical-treatment', 'General care');
  await p.fill('#f-medical-cost', '7500');
  await pick(p, '#f-medical-who', 'Self');
  await p.fill('#f-medical-applicationDate', dmy(-2));
  await radio(p, 'Yes');
  await p.setInputFiles('#f-medical-bills', {
    name: 'bills.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });
  await sendBtn(p);
  await p.waitForURL(/\/records\/requests\/req-/);
  const m = new URL(p.url()).pathname;
  await p.goto(`${BASE}/records/services/gpf/new`);
  await pick(p, '#f-gpf-type', 'Temporary');
  await pick(p, '#f-gpf-purpose', 'Medical');
  await p.fill('#f-gpf-amount', '100000');
  await p.fill('#f-gpf-date', dmy(-1));
  await sendBtn(p);
  await p.waitForURL(/\/records\/requests\/req-/);
  const g = new URL(p.url()).pathname;
  await decide(p, m, 'Approve');
  await decide(p, g, 'Approve');
  await p.goto(`${BASE}/records/services/medical`);
  await waitText(p, 'Medical concurrence');
  await p.waitForSelector('text=Pending');
  await p.goto(`${BASE}/records/services/gpf`);
  await waitText(p, 'Withdrawn so far: ₹4,70,000');
  for (const c of ['medical', 'gpf']) {
    await p.goto(`${BASE}/records/services/${c}/add-past`);
    await waitText(p, 'You are adding something that already happened');
  }
});

await flow('7 Fix a returned request', async (p) => {
  await p.goto(`${BASE}/records?demo=1`);
  await p.click('summary:has-text("Demo controls")');
  await p.click('details.demo-panel button:has-text("Create sample returned request")');
  await p.waitForTimeout(1200);
  await p.goto(`${BASE}/records`);
  await p.waitForSelector('text=Waiting on you');
  await p.waitForSelector('[role=tab]:has-text("Needs my action") .ux4g-tag-tonal-neutral');
  const action = await text(p.locator('[role=tab]:has-text("Needs my action")'));
  await p.click('.list-row:has-text("Returned to you"):has-text("Leave") >> nth=0');
  await waitText(p, 'The Under Secretary returned this request. Reason:');
  await p.click('a:has-text("Edit and send again")');
  await p.waitForSelector('#f-leave-dates-from');
  await p.fill('#f-leave-dates-from', dmy(200));
  await p.fill('#f-leave-dates-to', dmy(201));
  await sendBtn(p);
  await p.waitForURL(/\/records\/requests\/req-/);
  await p.waitForSelector('[class*="ux4g-tag-"]:has-text("Waiting for approval")');
  await p.goto(`${BASE}/records`);
  await p.waitForSelector('[role=tab]:has-text("Needs my action") .ux4g-tag-tonal-neutral');
  const after = await text(p.locator('[role=tab]:has-text("Needs my action")'));
  assert.notEqual(action, after);
});

await flow('8 Withdraw', async (p) => {
  await p.goto(`${BASE}/records/requests/req-3`); // a profile change that is waiting for approval
  await waitText(p, 'Waiting for approval');
  await p.goto(`${BASE}/records/profile`);
  await waitText(p, 'Change pending');
  await p.goto(`${BASE}/records/requests/req-3`);
  await p.click('button:has-text("Withdraw")');
  await p.click('[role=alertdialog] button:has-text("Withdraw")');
  await waitText(p, 'Withdrawn');
  await p.goto(`${BASE}/records/profile`);
  await p.waitForSelector('text=Contact and address');
  assert.equal(await p.locator('text=Change pending').count(), 0);
});

await flow('9 Submit a policy proposal', async (p) => {
  await p.goto(`${BASE}/community`);
  await p.click('a:has-text("Submit a proposal"):visible >> nth=0');
  await p.waitForSelector('#f-idea-title');
  await p.fill('#f-idea-title', 'Weekly review huddles for block offices');
  await pick(p, '#f-idea-type', 'Best practice');
  await p.locator('#f-idea-desc').click();
  await p.keyboard.type('A short weekly huddle to unblock pending files.');
  await p.waitForSelector('#f-idea-district:has-text("Tirunelveli")');
  await pick(p, '#f-idea-district', '');
  await pick(p, '#f-idea-dept', '');
  await p.click('button:has-text("Preview")');
  assert.ok((await p.locator('text=Choose a district or a department.').count()) >= 1);
  await pick(p, '#f-idea-district', 'Tirunelveli');
  await p.click('button:has-text("Preview")');
  await p.waitForSelector('text=Back to edit');
  await p.click('button:has-text("Submit proposal")');
  await p.waitForURL(/\/community\/proposals\/idea-/);
  assert.match(await text(toast(p)), /Your proposal has been submitted\./);
  await p.goto(`${BASE}/community/proposals?tab=mine`);
  await p.click('a:has-text("Weekly review huddles")');
  await p.waitForSelector('.page-header button[aria-pressed]');
  assert.equal(await p.locator('.page-header button[aria-pressed]').first().isDisabled(), true);
});

await flow('10 Start a discussion anonymously', async (p) => {
  await p.goto(`${BASE}/home`);
  await p.click('a:has-text("Start a discussion"):visible');
  await p.waitForSelector('#f-post-title');
  await p.fill('#f-post-title', 'How do you handle sudden transfers mid-scheme?');
  await p.locator('#f-post-body').click();
  await p.keyboard.type('Looking for practical advice.');
  await p.locator('label:has(#f-post-anon)').click();
  await p.click('button:has-text("Post"):visible');
  await p.waitForURL(/\/community\/discourse\/post-/);
  await p.waitForSelector('.page-header:has-text("You posted this anonymously")');
  await p.goto(`${BASE}/community/discourse`);
  await p.waitForSelector('.post-row');
  assert.match(await text(p.locator('.post-row').first()), /Anonymous officer/);
});

await flow('10b A reply opens under its comment', async (p) => {
  await p.goto(`${BASE}/community/discourse/post-1`);
  await p.waitForSelector('ul.thread > li.comment');
  const first = p.locator('ul.thread > li.comment').first();
  await first.locator('button:has-text("Reply")').first().click();
  await first.locator('.reply-composer textarea').fill('Thank you, this helped.');
  await first.locator('button:has-text("Post reply")').click();
  await first.locator('.reply-composer').waitFor({ state: 'detached' });
  assert.match(await text(first), /Thank you, this helped\./);
  assert.equal(await p.locator('.reply-composer').count(), 0);
});

await flow('11 Find a person or a subject', async (p) => {
  await p.goto(`${BASE}/community/colleagues`);
  await p.fill('input[type=search], #sf-input', 'Karthik');
  await p.waitForSelector('.colleague-card:has-text("Karthik Kumar")');
  await p.fill('input[type=search], #sf-input', 'GPF');
  await waitText(p, 'No colleague found. Try searching by subject instead.');
  await p.click('button:has-text("Search by subject")');
  await p.waitForSelector('.who');
  assert.equal(await p.inputValue('input[type=search], #sf-input'), 'GPF');
  await p.click('.is-hit >> nth=0');
  await p.waitForURL(/\/community\/colleagues\/subject\//);
  await p.click('a:has-text("Open officer\'s profile")');
  await p.waitForURL(/\/community\/colleagues\/col-/);
  await waitText(p, 'Reporting structure');
  await waitText(p, 'Personal numbers are not shown.');
  await p.click('a:has-text("See in By subject")');
  await p.waitForURL(/\/community\/colleagues\/subject\//);
});

await flow('12 Capacity Building', async (p) => {
  await p.goto(`${BASE}/community/capacity-building`);
  await p.click('button:has-text("Request training")');
  await p.fill('#f-tr-title', 'Disaster drills for block teams');
  await radio(p, 'My team');
  await p.click('[role=dialog] button:has-text("Send"), .ux4g-modal button:has-text("Send")');
  assert.match(await text(toast(p)), /Your request is now visible to other officers/);
  await p.waitForSelector(
    '.ux4g-card:has-text("Disaster drills for block teams"):has-text("1 officers need this")',
  );
  await p.click('[role=tab]:has-text("Upcoming")');
  const [dl] = await Promise.all([
    p.waitForEvent('download'),
    p.click('button:has-text("Add to calendar") >> nth=0'),
  ]);
  assert.match(dl.suggestedFilename(), /\.ics$/);
});

await flow('13 Home, search and the bell', async (p) => {
  await p.goto(`${BASE}/home`);
  await p.waitForSelector('text=Waiting on you');
  assert.ok(await p.locator('text=From the Community').count());
  await p.fill('#home-search', 'leave');
  await p.click('button:has-text("Search"):visible >> nth=0');
  await p.waitForURL(/\/search\?q=leave/);
  await p.waitForSelector('section[aria-label="My requests"], section[aria-label="Downloads"]');
  await p.goto(`${BASE}/notifications`);
  await p.waitForSelector('.list-row');
  const all = await p.locator('.list-row').count();
  await p.click('button:has-text("Requests")');
  const req = await p.locator('.list-row').count();
  await p.click('button:has-text("Community")');
  const com = await p.locator('.list-row').count();
  assert.ok(req > 0 && com > 0 && req + com === all);
});

await flow('14 Downloads, password and sign-out', async (p, ctx) => {
  await p.goto(`${BASE}/records/downloads?tab=circulars`);
  await p.waitForSelector('a:has-text("View")');
  const [popup] = await Promise.all([
    ctx.waitForEvent('page'),
    p.click('a:has-text("View") >> nth=0'),
  ]);
  assert.ok(popup);
  await p.goto(`${BASE}/records/downloads?tab=faqs`);
  await p.waitForSelector('.ux4g-accordion');
  if (W >= 1024) {
    await p.click('button[aria-haspopup=menu][aria-label*="Account"]');
    assert.equal(await p.locator('[role=menuitem]').count(), 2);
    await p.click('[role=menuitem]:has-text("Change Password")');
  } else {
    await p.click('.bottombar button:has-text("Me")');
    await p.click('button:has-text("Change Password")');
  }
  await p.click('[role=dialog] button:has-text("Change password")');
  await waitText(p, 'This field is required.');
  await p.keyboard.press('Escape');
  if (W >= 1024) {
    await p.click('button[aria-haspopup=menu][aria-label*="Account"]');
    await p.click('[role=menuitem]:has-text("Logout")');
  } else {
    await p.click('.bottombar button:has-text("Me")');
    await p.click('button:has-text("Logout")');
  }
  await p.waitForURL('**/login');
});

await browser.close();
const real = errors.filter((e) => !/Download is starting|favicon/.test(e));
if (real.length) {
  console.log('Console problems:\n' + real.join('\n'));
  failed++;
}
console.log(failed ? `\n${failed} problem(s)` : '\nAll 14 flows pass with no console errors.');
process.exit(failed ? 1 : 0);

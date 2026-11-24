import {escapeHtml as h, safeHref} from './core.js';
import {routeUrl} from './urls.js';

const link = (route, text, id = null, anchor = '') =>
  `<a href="${h(routeUrl(route, id) + (anchor ? '#' + anchor : ''))}">${h(text)}</a>`;
const source = (db, id, label) => {
  const record = db.sources.find(item => item.id === id);
  return `<a href="${h(safeHref(record.url))}" target="_blank" rel="noopener noreferrer">${h(label || record.title)}</a>`;
};

export const recognitionTitle = 'The recognition problem';
export const recognitionSummary = 'What could tell a player which action to try? The clue may describe how to find the action, how to perform it, or both.';
export const wordEdgeTitle = 'Word-edge check: R1–R6';
export const wordEdgeSummary = 'First and last letters of each word, in clue order. R1 gives THROWINLAKE. Neither direct extraction gives a readable R6 action.';

const branches = [
  ['Physical or game state',
    'Identify a particular object or body, what survives its loss, and a native action that assembles those survivors.',
    'R1 demonstrates an intact object revealed after an offering. R5 shows that existing items can be part of a condition.',
    'No source selects the R6 body, survivor or assembly. R1’s Journal emerges intact.'],
  ['Information or method',
    'Use information outside the main clue to recognize the next action, then perform that action.',
    'R1 gives a genuine instruction to decode. The Journal retains solved actions and their conditions.',
    'No field or fixed rule selects an R6 action. The direct word-edge check stops at R1.'],
  ['Physical evidence leading to information',
    'A change in the game could reveal information that identifies a different action.',
    'R1 shows that an offering can reveal a physical Journal carrying the next clue.',
    'No returned object or new signal has been established for R6. The Alpha R5 clip cannot settle what happens on Main.']
];

export function recognitionOverview() {
  return `<section class="r6-context prose" id="why-r6">
    <h2>Why is R6 so difficult?</h2>
    <p>“The body is not enough” means it is insufficient <em>for finding what comes next</em>. It could be complete for its usual purpose. What survives may be materials, an independent object, or information.</p>
    <p>${h(recognitionSummary)}</p>
    <details class="recognition-note" id="recognition-branches">
      <summary>Compare three ways to find the next step</summary>
      <div class="recognition-body">
        ${branches.map(([title, proposal, precedent, gap]) => `<article><h3>${h(title)}</h3><p>${h(proposal)}</p><p><strong>Precedent.</strong> ${h(precedent)}</p><p><strong>Open question.</strong> ${h(gap)}</p></article>`).join('')}
        <p>The loss could create fragments, reveal something that already exists, mark an absence condition, or have happened before the player acts.</p>
        <p class="recognition-links">
          ${link('interpretation', 'I028 · Purpose of the assembly', 'R6I028')}
          ${link('interpretation', 'I029 · What disappearance does', 'R6I029')}
          ${link('interpretation', 'I008 · Body of text', 'R6I008')}
          ${link('guide', 'Journal evidence and recording notes', null, 'journal-evidence')}
        </p>
      </div>
    </details>
  </section>`;
}

export function wordEdgeRows(db) {
  return [...db.riddles, {id:'R6', clue:db.config.riddle}].map(({id, clue}) => {
    const words = clue.match(/[A-Za-z]+/g) || [];
    return {
      id, count: words.length,
      first: words.map(word => word[0]).join('').toUpperCase(),
      last: words.map(word => word.at(-1)).join('').toUpperCase()
    };
  });
}

export function riddleComparison(db) {
  const conditions = [
    ['Offer the Chestplate', 'Great Glacite Lake.', 'The eleven word initials spell THROWINLAKE.'],
    ['Offer Enchanted Packed Ice', 'Exact center of the lake.', '“Heart” points to the center. The full route to the item choice is incompletely documented.'],
    ['Offer a Feather Talisman', 'Be 50+ blocks away when it hits the water.', '“From afar” suggests distance. The solved Journal supplies the threshold.'],
    ['Drop Arachne’s Calling', 'Three separate drops within ten seconds.', '“Call” suggests the item and a third try. The solved Journal supplies the time limit.'],
    ['Offer a Griffin Feather', 'Three Calling units already in the lake. A fresh stack of three worked.', 'The clue points back to earlier offerings. Jonas explained his Feather choice after success. The intended cue remains unclear.']
  ];
  const rows = db.riddles.map((r,index) => {
    const [action, condition, recognition] = conditions[index];
    return `<tr><th scope="row"><a href="#${h(r.id)}">${h(r.id)}</a></th><td>${h(action)}</td><td>${h(condition)}</td><td>${h(recognition)}</td></tr>`;
  });
  return `<section class="riddle-comparison" id="riddle-comparison">
    <h2>R1–R6 at a glance</h2>
    <div class="table-wrap" role="region" aria-label="Riddle comparison" tabindex="0">
      <table aria-label="Known riddle actions and discovery clues">
        <thead><tr><th scope="col">Step</th><th scope="col">Action</th><th scope="col">Condition</th><th scope="col">What pointed to it</th></tr></thead>
        <tbody>${rows.join('')}<tr><th scope="row">${link('explore','R6')}</th><td>Unresolved</td><td>Unknown</td><td>The clue asks what survives and how to assemble it. The intended way to find the action is an open question.</td></tr></tbody>
      </table>
    </div>
  </section>`;
}

export function journalEvidence(db) {
  return `<section class="journal-evidence" id="journal-evidence" aria-labelledby="journal-evidence-heading">
    <h2 id="journal-evidence-heading">What the Journal preserves</h2>
    <p>Completed entries preserve item names and the conditions used to solve them. The captured R6 solution and next locked clue still show question marks.</p>
    <details class="recognition-note" id="journal-recordings">
      <summary>See the recording evidence and its limits</summary>
      <div class="recognition-body">
        <h3>Before and after the R1 clear</h3>
        <p>In the sampled original clip, the Chestplate at 6.00 s has no singled-out red initials. A separate object appears over the lake at 8–16 s and the later interface identifies the Journal. The solved R1 tooltip at 20.00 s highlights the acrostic in red. At 22.00 s the unsolved R2 tooltip shows gray italic text, a lime icon and a red unknown solution field.</p>
        <p>The clip appears to show “killing owning owns” where the reference reads “kills.” The client also shows unusual textures. Use the guide and known lore transcription for the extraction. The reason for the recording discrepancy remains unknown.</p>
        <h3>From R4 arrivals to R5 presence</h3>
        <p>R4 counts three Calling arrivals within ten seconds. R5 requires three Calling units already in the lake when the Griffin Feather arrives. Fresh Callings work in the recorded Alpha procedure. Each solved field has its own conditions, including R2’s location and R3’s distance at arrival.</p>
        <p>In the Alpha R5 clip, neither drop is visible in the filmed pool by about 3.10 s. The earlier clip review found no replacement in view through about 5.15 s. The completed R5 tooltip is readable at 5.90 s. The view lacks a full pickup or inventory check, so a physical return on Main remains open.</p>
        <h3>Guide wording and discovery history</h3>
        <p>The early forum guide uses “what” where the R3 tooltip transcription uses “which.” Its R2 punctuation also differs. Choose the exact text source before testing a rule. AR-03 preserves Jonas / JustCody’s explanation involving past offerings, feathers and item initials. That explanation followed the successful attempt.</p>
        <p class="recognition-links">${source(db, 'S052', 'Open Journal GUI evidence in Sheets')} ${source(db, 'S053', 'Open Active Research in Sheets')} ${source(db, 'S004', 'Early forum guide')}</p>
      </div>
    </details>
    <details class="recognition-note" id="word-edge-check">
      <summary>${wordEdgeTitle}</summary>
      <div class="recognition-body">
        <p><strong>Desk check, 24 November 2026.</strong> ${h(wordEdgeSummary)}</p>
        <p>Use the guide’s R1 Chestplate wording and the R2–R6 Journal transcriptions. Take the first or last letter of each alphabetic word, uppercase the result and keep the original order.</p>
        <div class="table-wrap word-edge-table">
          <table aria-label="Direct word-edge extraction results">
            <thead><tr><th scope="col">Clue</th><th scope="col">Words</th><th scope="col">First letters</th><th scope="col">Last letters</th></tr></thead>
            <tbody>${wordEdgeRows(db).map(r => `<tr><th scope="row">${h(r.id)}</th><td>${r.count}</td><td><code>${h(r.first)}</code></td><td><code>${h(r.last)}</code></td></tr>`).join('')}</tbody>
          </table>
        </div>
        <p>The result covers these two extraction rules. Any further decoding needs a source that selects the input and rule in advance.</p>
        <p class="recognition-links">${source(db, 'S052', 'Journal transcriptions')} ${source(db, 'S004', 'R1 Chestplate text')} ${link('route','R002 · Earlier text reconstruction','R002')}</p>
      </div>
    </details>
  </section>`;
}

export function releaseNotes(db) {
  return `<section id="changelog">
    <h2>Changelog</h2>
    <details class="recognition-note">
      <summary>v${h(db.config.version)} · ${h(db.config.release_name)} · 24 Nov 2026</summary>
      <div class="recognition-body">
        <ul>
          <li>Added the recognition comparison and spreadsheet readings I028 and I029.</li>
          <li>Documented R1 pre-clear and solved formatting, the R5 Alpha aftermath, and the direct word-edge check.</li>
          <li>Added attributed tests with their actual outcome limits and redirected current research toward original clues and footage.</li>
          <li>Preserved ${db.routes.length} routes, ${db.interpretations.length} readings and ${db.breakdowns.length} detailed records in the current archive.</li>
        </ul>
        <p>R6 still has no verified completion. Its body, survivor, and assembly action remain unidentified.</p>
        <p>${link('explore','Explore the recognition problem',null,'why-r6')} · ${link('investigations','Investigation Log')}</p>
      </div>
    </details>
  </section>`;
}

export function openLinkedEvidence() {
  const id = location.hash.slice(1);
  if (!['recognition-branches', 'journal-recordings', 'word-edge-check', 'R1', 'R2', 'R3', 'R4', 'R5'].includes(id)) return;
  const details = document.getElementById(id);
  if (details?.tagName === 'DETAILS') {
    details.open = true;
    details.scrollIntoView({block:'start'});
  }
}

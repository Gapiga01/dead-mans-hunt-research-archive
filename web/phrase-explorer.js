import {escapeHtml as h} from './core.js';
import {routeUrl} from './urls.js';

// Navigation into existing readings, not additional theories or a combination generator.
export const phraseReadings=[
 {id:'next',phrase:'To find out which comes next',meanings:[
  ['Discover the next Journal instruction.',['R6I013']],
  ['Identify the next item or action.',['R6I019']],
  ['Reconstruct information from previous riddles.',['R6I008','R6I013']],
  ['Use surviving knowledge rather than a physical object.',['R6I013']]
 ],examples:[['theory','T001','R1 leaves an intact Journal after the Chestplate is consumed.'],['theory','T003','The Journal reading asks whether earlier answers preserve useful information.']],limit:'These are possible targets of the instruction. None supplies a verified extraction rule or identifies the next R6 action.'},
 {id:'body',phrase:'The body',meanings:[
  ['A corpse or living creature.',['R6I001']],
  ['A player, as a particular case of the creature reading.',['R6I001']],
  ['An item’s physical shell or base.',['R6I004','R6I006']],
  ['An armor torso or an incomplete equipment set.',['R6I005','R6I011']],
  ['A body of text.',['R6I008']],
  ['A body of water.',['R6I009']],
  ['A collective body or group.',['R6I010']]
 ],examples:[['theory','T001','R1 provides a real container-and-contents example.'],['theory','T009','The Arachne research includes equipment and native assembly ideas, with earlier tests kept visible.']],limit:'A familiar meaning of “body” is only a reading. It still needs evidence selecting an object and explaining the rest of the sentence.'},
 {id:'enough',phrase:'Is not enough',meanings:[
  ['The body is required, but needs additional components.',['R6I004','R6I011']],
  ['An initial action needs another condition.',['R6I019']],
  ['The physical body is not the intended answer; its survivor matters instead.',['R6I013','R6I012']],
  ['Speculative: more than one body or object might be required.',['R6I012']]
 ],examples:[['interpretation','R6I004','An incomplete base illustrates the complement reading.'],['theory','T002','R4/R5 show that an item choice can come with an additional condition; they do not establish the R6 condition.']],limit:'“Not enough” denies sufficiency. It does not prove the body is necessary, specify a quantity or establish that several bodies are required.'},
 {id:'assemble',phrase:'Assemble',meanings:[
  ['Craft or forge an item.',['R6I014']],
  ['Fuse or combine components.',['R6I014','R6I012']],
  ['Arrange offerings in a location or order.',['R6I015']],
  ['Gather players or entities.',['R6I016','R6I010']],
  ['Reconstruct information or a sequence.',['R6I008','R6I013']]
 ],examples:[['theory','T009','Shaggy manufacturing a Crystal is an assembly-like operation already covered by a player report.'],['theory','T003','Information assembly is a different proposal and still lacks a selected rule.']],limit:'These operations have different evidence and testing histories. A real recipe or gathering mechanic is not proof of an R6 trigger.'},
 {id:'remains',phrase:'That which remains',meanings:[
  ['Physical fragments, bones or drops.',['R6I012']],
  ['Possessions left behind.',['R6I003']],
  ['Essence, souls or persistent effects.',['R6I002']],
  ['Information, names, memories or recorded Journal entries.',['R6I013']],
  ['Other material surviving a transformation.',['R6I006','R6I007']]
 ],examples:[['theory','T001','The recovered Journal is a documented survivor; that does not give it an assembly recipe.'],['route','R080','Salvage converts an item into another resource, but no R6 spending or reconstruction action is selected.']],limit:'The body, survivor and assembly must belong to a supported relationship. Swapping referents just to make each word fit can hide the missing connection.'},
 {id:'gone',phrase:'When it is gone',meanings:[
  ['Death or disappearance.',['R6I001']],
  ['Natural despawning.',['R6I017']],
  ['Consumption by the lake.',['R6I018']],
  ['Destruction or salvaging.',['R6I007']],
  ['The end of an event or temporary effect.',['R6I010','R6I002']],
  ['Something already absent before the current riddle.',['R6I019','R6I020']]
 ],examples:[['theory','T001','The lake consuming the Chestplate is an established Hunt event.'],['theory','T005','Better Together ending is one proposed event reading, not a confirmed R6 condition.']],limit:'The wording does not prove that the player must cause a disappearance during R6. An already absent body is grammatically possible; an actual selector is still needed.'}
];
function readingLinks(db,ids){return ids.map(id=>{const i=db.interpretations.find(i=>i.id===id);return `<a href="${routeUrl('interpretation',id)}">${h(i.source_id+' · '+i.title)}</a>`;}).join(' · ');}
export function insufficiencyComparison(){return `<section class="insufficiency-comparison" aria-labelledby="insufficiency-heading"><h4 id="insufficiency-heading">Two readings of “not enough”</h4><div class="insufficiency-columns"><div><h5>A · Complement</h5><p>The body is required, but incomplete. Something else must be added.</p><p><strong>Example:</strong> a base item needing more components.</p><p><strong>Problem:</strong> if the body is gone, how is it involved in the final assembly?</p></div><div><h5>B · Substitution</h5><p>The answer is something surviving the body’s disappearance, rather than the body itself.</p><p><strong>Example:</strong> a creature leaves fragments that can be assembled.</p><p><strong>Problem:</strong> what selects this particular body and reconstruction mechanic?</p></div></div><p class="source-note">Both are grammatically plausible. Neither is verified. The wording does not establish that the body is a required ingredient.</p></section>`;}
export function phraseExplorer(db){return `<section class="clue-explorer" id="clue-explorer" aria-labelledby="explorer-heading"><h2 id="explorer-heading">What could Riddle 6 mean?</h2><blockquote class="clue-quote">“${h(db.config.riddle)}”</blockquote><p class="source-note">Choose one phrase to explore its possible meanings and existing research. These readings have different evidence behind them; selecting a phrase does not build a theory.</p><fieldset class="phrase-picker"><legend>Choose a phrase</legend>${phraseReadings.map((p,n)=>`<input class="phrase-radio sr-only" type="radio" name="r6-phrase" id="phrase-${p.id}" value="${p.id}"${n===0?' checked':''}><label class="phrase-label" id="label-${p.id}" for="phrase-${p.id}">${h(p.phrase)}</label>`).join('')}<div class="phrase-panels">${phraseReadings.map(p=>`<section class="phrase-panel" id="panel-${p.id}" aria-labelledby="label-${p.id}"><h3>${h(p.phrase)}</h3><ul class="phrase-meanings">${p.meanings.map(([text,ids])=>`<li>${h(text)}<span class="phrase-links">${readingLinks(db,ids)}</span></li>`).join('')}</ul><p class="phrase-examples"><strong>Examples in the archive:</strong> ${p.examples.map(([route,id,text])=>`<a href="${routeUrl(route,id)}">${h(id)}</a> — ${h(text)}`).join(' ')}</p><p class="phrase-limit"><strong>Keep in mind:</strong> ${h(p.limit)}</p>${p.id==='enough'?insufficiencyComparison():''}</section>`).join('')}</div></fieldset><p class="source-note">The phrase selector works without JavaScript. Keyboard: Tab to the choices, then use the arrow keys. The full 27 interpretations remain below.</p></section>`;}

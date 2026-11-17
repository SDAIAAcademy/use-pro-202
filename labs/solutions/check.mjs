// Runs the reference solution of every lab against the course files and prints PASS or the first
// difference.
//
//     node labs/solutions/check.mjs              every lab
//     node labs/solutions/check.mjs 1.3 2.2      some labs
//
// What runs for real: every check a participant does on a file (the job description against the
// role card, the line-by-line comparison of each CV pair, the arithmetic of the forty scores,
// the identifiers left in a pseudonymised profile, the gaps, the task numbers). What a
// participant does in an assistant is not run against a model: the scripted stand-in scorer of
// labs/_tools/standin.mjs replays the scores from the CV files, and the recorded plan draft
// stands for the assistant's draft. No model is called and nothing is written to disk.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import * as S from "../_tools/standin.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILES = path.join(HERE, "..", "files");
const REF = path.join(HERE, "reference");
const only = process.argv.slice(2).filter(a => !a.startsWith("--"));

const read = (base, rel) => fs.readFileSync(path.join(base, rel), "utf8").replace(/^﻿/, "");
const json = rel => JSON.parse(read(REF, rel));
function csv(text) {
  const rows = []; let row = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') inQ = false; else cell += ch; }
    else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  return rows.filter(r => r.some(c => c !== ""));
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
// Half away from zero, as a spreadsheet rounds: -0.875 is -0.88
const r2 = x => Math.sign(x) * Math.round(Math.abs(x) * 100) / 100;
// The lines of two files that differ, compared position by position
const diffLines = (a, b) => { const A = a.split("\n"), B = b.split("\n"); assert.equal(A.length, B.length, "the two files have a different number of lines"); return A.map((l, i) => [l, B[i]]).filter(([x, y]) => x !== y); };
const roleCard = read(FILES, "case/role_card_data_analyst.md");

const LABS = {};

// ------------------------------------------------------------------ 1.1
LABS["1.1"] = () => {
  const start = csv(read(FILES, "start/hr_uses_six.csv")), ref = csv(read(REF, "D1_1_risk_tiers.csv")).slice(1);
  assert.equal(ref.length, 6);
  assert.ok(start.slice(1, 7).every(r => r[2] === "" && r[3] === "" && r[4] === ""), "the start table is not empty");
  const tiers = start.at(-1)[1].split(" / ");
  assert.equal(tiers.length, 3);
  const count = tiers.map(t => ref.filter(r => r[2] === t).length);
  assert.deepEqual(count, [2, 2, 2], "two uses per tier");
  assert.ok(ref.every(r => r[3] && r[4]), "every row names who decides and why");
  // The two uses that decide about a person: ranking by score, exclusion by a detector
  assert.deepEqual(ref.filter(r => r[2] === tiers[2]).map(r => r[0]), ["2", "4"]);
  return "6 uses, 2 per tier; uses 2 and 4 stay with people";
};

// ------------------------------------------------------------------ 1.2
LABS["1.2"] = () => {
  const draft = read(FILES, "start/job_description_ai_draft.md"), planted = json("D1_2_planted.json"), table = csv(read(REF, "D1_2_change_table.csv")).slice(1);
  assert.equal(planted.length, 13);
  for (const p of planted) assert.ok(draft.includes(p.line), `planted line missing from the draft: ${p.n}`);
  assert.equal(table.length, planted.length);
  for (const r of table) { assert.ok(r[2] && r[4], `change ${r[0]} has no revision or no reason`); assert.notEqual(r[1], r[2]); }
  // The inflated requirements really contradict the role card
  assert.ok(draft.includes("ماجستير في علم البيانات (شرط)") && roleCard.includes("مفضَّل وليس شرطًا"));
  assert.ok(draft.includes("ثماني سنوات") && roleCard.includes("من سنة إلى ثلاث سنوات"));
  assert.ok(draft.includes("خبرة سابقة في قطاع الأثاث") && roleCard.includes("لا تُشترط خبرة في قطاع الأثاث"));
  assert.ok(draft.includes("تعلم عميق") && roleCard.includes("بناء نماذج التعلم العميق"));
  // Applying the reference changes leaves no planted line and keeps the sound ones
  let revised = draft;
  for (const r of table) revised = revised.replace(r[1], /^تُحذف/.test(r[2]) ? "" : r[2]);
  for (const p of planted) assert.ok(!revised.includes(p.line), `planted line survives: ${p.n}`);
  assert.ok(revised.includes("إتقان SQL") && revised.includes("تنظيف بيانات المبيعات"));
  const w = planted.filter(p => p.kind === "w").length;
  return `${planted.length} planted faults (${w} wording, ${planted.length - w} requirements), all in the draft, none after the reference changes`;
};

// ------------------------------------------------------------------ 1.3
const index = () => csv(read(FILES, "cv/pairs_index.csv")).slice(1);
const cvText = id => read(FILES, `cv/${id}.md`);
const secondList = () => index().filter(r => r[6] === "الاسم" && r[5] === "الاسم (ب)").map(r => S.features(cvText(r[4])).name);
LABS["1.3"] = () => {
  // The three draft pairs: one sound, two with a second difference
  const expected = { 1: 1, 2: 2, 3: 2 }, verdict = csv(read(REF, "D1_3_pair_check.csv")).slice(1);
  for (const n of [1, 2, 3]) {
    const d = diffLines(read(FILES, `cv_draft/D${n}-A.md`), read(FILES, `cv_draft/D${n}-B.md`)).filter(([x]) => !x.startsWith("# "));
    assert.equal(d.length, expected[n], `draft pair D${n}`);
    assert.equal(verdict[n - 1][2], d.length === 1 ? "نعم" : "لا");
  }
  // The ten pairs of the test: exactly the intended line differs, and nothing in it is gendered
  const idx = index();
  assert.equal(idx.length, 10);
  for (const r of idx) {
    const d = diffLines(cvText(r[2]), cvText(r[4])).filter(([x]) => !x.startsWith("# "));
    assert.equal(d.length, 1, `pair ${r[0]} differs in ${d.length} lines`);
    assert.ok(d[0][0].startsWith(`${r[6]}:`), `pair ${r[0]} differs in the wrong line`);
  }
  assert.deepEqual(["الاسم", "الجنس", "العمر"].map(k => idx.filter(r => r[1] === k).length), [4, 3, 3]);
  // The repaired prompt: criteria of the role card, a scale, one CV per conversation, no ranking
  const prompt = read(FILES, "start/screening_prompt_test.md"), weak = read(FILES, "start/screening_prompt_weak.md");
  for (const part of ["من 0 إلى 100", "سيرة واحدة في كل محادثة جديدة", "تُقيَّم مرتين", "لا تستخدم الاسم"]) assert.ok(prompt.includes(part), part);
  assert.ok(!/رتّب/.test(prompt) && /رتّبهم/.test(weak) && /ثقافة فريقنا الشاب/.test(weak));
  // The live run of pairs 1 and 8, with the stand-in scorer in place of the room's assistant
  const second = secondList();
  const live = csv(read(FILES, "start/live_runs_sheet.csv")).slice(1).map(r => [r[1], S.score(cvText(r[1]), 1, second), S.score(cvText(r[1]), 2, second)]);
  assert.equal(live.length, 4);
  return `draft pairs: D1 sound, D2 and D3 not matched; 10 test pairs differ in one line each; stand-in live run ${live.map(l => `${l[0]} ${l[1]}/${l[2]}`).join(", ")}`;
};

// ------------------------------------------------------------------ 1.4
LABS["1.4"] = () => {
  const rows = csv(read(FILES, "start/pair_scores_recorded.csv")).slice(1).filter(r => /^\d+$/.test(r[0]));
  assert.equal(rows.length, 20);
  // The recorded scores are what the stand-in scorer gives on the CV files
  const second = secondList();
  for (const r of rows) assert.deepEqual([Number(r[4]), Number(r[5])], [S.score(cvText(r[2]), 1, second), S.score(cvText(r[2]), 2, second)], `recorded score of ${r[2]}`);
  // The participant's arithmetic, done here from the start file alone
  const variation = r2(mean(rows.map(r => Math.abs(r[4] - r[5]))));
  const shift = n => { const [ref, alt] = ["مرجعية", "معدَّلة"].map(w => rows.find(r => r[0] === String(n) && r[3].startsWith(w))); return mean([+alt[4], +alt[5]]) - mean([+ref[4], +ref[5]]); };
  const kinds = { name: "الاسم", gender: "الجنس", age: "العمر" }, out = {};
  for (const [k, label] of Object.entries(kinds)) {
    const shifts = [...new Set(rows.filter(r => r[1] === label).map(r => r[0]))].map(shift);
    const m = r2(mean(shifts));
    out[k] = { mean: m, larger: Math.abs(m) > variation, same: shifts.every(x => x < 0) || shifts.every(x => x > 0) };
  }
  const ref = json("D1_4_summary.json");
  assert.equal(variation, ref.variation);
  for (const b of ref.byKind) assert.deepEqual([out[b.kind].mean, out[b.kind].larger, out[b.kind].same], [b.mean, b.larger, b.sameDirection], b.kind);
  // The reading: age counts, gender and name do not; and single runs mislead
  assert.ok(out.age.larger && out.age.same && out.age.mean < 0);
  assert.ok(!(out.gender.larger && out.gender.same) && !(out.name.larger && out.name.same));
  assert.ok(json("D1_4_single_run_traps.json").length >= 2);
  return `variation ${variation}; mean shift: age ${out.age.mean}, gender ${out.gender.mean}, name ${out.name.mean}; only age counts`;
};

// ------------------------------------------------------------------ 2.1
LABS["2.1"] = () => {
  const guide = read(REF, "D2_1_interview_guide.md"), rows = guide.split("\n").filter(l => /^\| \d/.test(l)).map(l => l.split("|").map(c => c.trim()));
  assert.equal(rows.length, 6);
  const ids = [...roleCard.matchAll(/^\| (M\d) /gm)].map(m => m[1]);
  assert.deepEqual(rows.map(r => r[2]), ids, "one question per criterion of the role card");
  for (const r of rows) assert.ok(r[3].length > 20 && r[4] && r[5] && r[6], `question ${r[1]} lacks an anchor`);
  for (const banned of ["عمرك", "متزوج", "الإنجاب", "منطقة أهلك", "الذكاء الاصطناعي في كتابة"]) assert.ok(!rows.some(r => r[3].includes(banned)), banned);
  assert.ok(guide.includes("سطر الإفصاح للمرشح") && guide.includes("الطريق إلى الاعتراض"));
  const mq = csv(read(REF, "D2_1_manager_questions.csv")).slice(1), drop = mq.filter(r => r[2] === "يُحذف").length;
  assert.equal(mq.length, 8); assert.equal(drop, 4);
  assert.equal(read(FILES, "start/manager_questions.md").split("\n").filter(l => /^\d+\./.test(l)).length, 8);
  return `6 questions, one per criterion, anchors at 1, 3 and 5; of the manager's 8 questions ${drop} are dropped`;
};

// ------------------------------------------------------------------ 2.2
LABS["2.2"] = () => {
  const ids = json("D2_2_identifiers.json"), rawDir = path.join(FILES, "profiles", "raw"), raws = fs.readdirSync(rawDir);
  assert.equal(raws.length, 3);
  let n = 0;
  for (const [code, set] of Object.entries(ids)) {
    const rawName = raws.find(f => f.includes(set.direct[2])), raw = read(rawDir, rawName), clean = read(FILES, `profiles/pseudonymised/${code}.md`);
    assert.ok(rawName.includes(set.direct[1]), "the raw file name carries the first name");
    for (const item of [...set.direct, ...set.indirect, ...set.sensitive]) {
      assert.ok(raw.includes(item), `${code}: planted item missing from the raw profile: ${item}`);
      assert.ok(!clean.includes(item), `${code}: still in the pseudonymised profile: ${item}`);
      n++;
    }
    assert.ok(!/@|05\d{8}|AR-\d+|\b1\d{9}\b/.test(clean), `${code}: an identifier pattern is left`);
    assert.equal((clean.match(/^\| M\d/gm) || []).length, 6, `${code}: the six criteria are kept`);
    assert.ok(clean.includes("يفضّل:"));
  }
  const log = csv(read(REF, "D2_2_sanitisation_log.csv")).slice(1);
  assert.ok(log.every(r => r[3] && r[4]), "every log row has an action and a reason");
  for (const code of Object.keys(ids)) for (const a of ["ترميز", "حذف", "تعميم", "إبقاء"]) assert.ok(log.some(r => r[0] === code && r[3].startsWith(a)), `${code}: no row with ${a}`);
  return `${n} planted identifiers and sensitive items: all in the raw profiles, none in the pseudonymised ones; ${log.length} log rows`;
};

// ------------------------------------------------------------------ 2.3
LABS["2.3"] = () => {
  const ref = json("D2_3_gaps.json"), out = [];
  for (const code of ["T1", "T2", "T3"]) {
    const rows = read(FILES, `profiles/pseudonymised/${code}.md`).split("\n").filter(l => /^\| M\d/.test(l)).map(l => l.split("|").map(c => c.trim()));
    const gaps = rows.filter(r => +r[3] > +r[2]).map(r => r[1].split(" ")[0]);
    assert.deepEqual(gaps, ref[code].map(g => g.id), code);
    // The target levels are the role card's
    for (const r of rows) assert.ok(new RegExp(`^\\| ${r[1].split(" ")[0]} \\|[^|]+\\| ${r[3]} \\|`, "m").test(roleCard), `${code} ${r[1]}`);
    out.push(`${code} ${gaps.join("+")}`);
  }
  // The recorded draft for T2: a line is sound only when it names a criterion that has a gap
  const draft = read(FILES, "start/plan_draft_recorded_T2.md").split("\n").filter(l => /^\d+\./.test(l)), faults = json("D2_3_plan_draft_faults.json");
  assert.equal(draft.length, 7);
  const t2 = ref.T2.map(g => g.id);
  const unsupported = faults.filter(f => !t2.includes(f.criterion)).map(f => f.n);
  assert.deepEqual(unsupported, faults.filter(f => f.fault).map(f => f.n));
  assert.equal(unsupported.length, 4);
  const sol = read(HERE, "D2_3_learning_plans.md");
  for (const code of ["T1", "T2", "T3"]) for (const g of ref[code].sort((a, b) => b.gap - a.gap).slice(0, 3)) assert.ok(sol.includes(`${g.id} ${g.name}: ${g.now} ثم ${g.target}`), `${code} ${g.id} has no plan line`);
  return `gaps: ${out.join(", ")}; recorded draft: lines ${unsupported.join(", ")} have no gap behind them`;
};

// ------------------------------------------------------------------ 2.4
LABS["2.4"] = () => {
  const rows = csv(read(FILES, "start/task_log_reply_letters.csv")).slice(1).filter(r => /^\d+$/.test(r[2]));
  assert.equal(rows.length, 5);
  const base = rows.filter(r => r[0].startsWith("خط الأساس")), ai = rows.filter(r => r[0].startsWith("بمساعدة"));
  assert.equal(base.length, 3); assert.equal(ai.length, 2);
  const minutes = r2(mean(base.map(r => +r[2]))), errors = r2(mean(base.map(r => +r[3])));
  const saving = r => Math.round((minutes - r[2]) / minutes * 100);
  const ref = json("D2_4_task_numbers.json");
  assert.deepEqual([minutes, errors], [ref.baseline.minutes, ref.baseline.errors]);
  assert.deepEqual(ai.map(saving), [ref.assisted1.saving_pct, ref.assisted2.saving_pct]);
  // The honest reading: the first assisted run is faster and worse; the second is kept
  assert.ok(+ai[0][3] > errors && +ai[0][4] < 3, "run 1 has more errors and fails the paired check");
  assert.ok(+ai[1][3] < errors && +ai[1][4] === 3 && +ai[1][2] > +ai[0][2]);
  return `baseline ${minutes} min and ${errors} errors; assisted 1: ${ai[0][2]} min (${saving(ai[0])}% less), ${ai[0][3]} errors, ${ai[0][4]}/3 pairs; assisted 2: ${ai[1][2]} min (${saving(ai[1])}% less), ${ai[1][3]} error, ${ai[1][4]}/3 pairs`;
};

let failed = 0;
for (const [id, run] of Object.entries(LABS)) {
  if (only.length && !only.includes(id)) continue;
  try { console.log(`PASS ${id}  ${run()}`); }
  catch (e) { failed++; console.log(`FAIL ${id}  ${e.message}`); }
}
process.exit(failed ? 1 : 0);

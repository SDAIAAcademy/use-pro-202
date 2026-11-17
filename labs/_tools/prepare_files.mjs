// Writes the Araek Furniture file pack (labs/files/) and the trainer's reference files
// (labs/solutions/reference/ and labs/solutions/*.md).
//
//     node labs/_tools/prepare_files.mjs
//
// Deterministic: no clock, no network; the only random numbers are the noise of the stand-in
// scorer (standin.mjs), seeded. Everything about Araek is fictional.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as D from "./data.mjs";
import * as S from "./standin.mjs";

const LABS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = path.join(LABS, "files");
const SOL = path.join(LABS, "solutions");
const REF = path.join(SOL, "reference");

let written = 0;
function write(base, rel, text) {
  const file = path.join(base, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.replace(/\r\n/g, "\n"), "utf8");
  written++;
}
// A spreadsheet opens a UTF-8 file with Arabic correctly only when it starts with a byte order mark
const BOM = String.fromCharCode(0xfeff);
const csv = rows => BOM + rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n") + "\n";
const md = (head, rows) => `| ${head.join(" | ")} |\n|${head.map(() => "---").join("|")}|\n${rows.map(r => `| ${r.join(" | ")} |`).join("\n")}\n`;
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
// Half away from zero, as a spreadsheet rounds: -0.875 is -0.88
const r2 = x => Math.sign(x) * Math.round(Math.abs(x) * 100) / 100;
const CHECK = "التحقق بالكود: `node labs/solutions/check.mjs`";

for (const dir of [FILES, REF]) fs.rmSync(dir, { recursive: true, force: true });
for (const f of fs.existsSync(SOL) ? fs.readdirSync(SOL) : []) if (/^(D\d_\d_.*|answer_key)\.md$/.test(f)) fs.rmSync(path.join(SOL, f));

// ------------------------------------------------------------ the case, the log, the pre-work
write(FILES, "case/case_brief.md", D.caseBrief);
write(FILES, "case/role_card_data_analyst.md", D.roleCard);
write(FILES, "start/session_log.csv", csv([
  ["المختبر", "الأداة والنموذج", "ما طلبته من المساعد", "ما ألصقته فيه (ونوع بياناته)", "ما تحققت منه بنفسي", "القرار ومن اتخذه"],
  ["مثال", "ناصح", "مسودة إعلان من بطاقة الدور", "بطاقة الدور (لا بيانات شخصية)", "قارنت المتطلبات بالبطاقة سطرًا سطرًا", "نشرت النص المنقح، والقرار لي"],
  ...["خط الأساس", "1.1", "1.2", "1.3", "1.4", "2.1", "2.2", "2.3", "2.4"].map(l => [l, "", "", "", "", ""]),
]));
write(FILES, "prework/baseline_sheet.md", `# العمل التحضيري: خط الأساس

قبل الورشة، اختر **مهمة متكررة واحدة** من عملك في الموارد البشرية: مهمة إعداد، لا قرار في شأن شخص. أمثلة: رسائل الرد على المتقدمين، ومسودة إعلان وظيفة، وتلخيص استبيان، وإعداد دليل مقابلة.

نفّذها **ثلاث مرات كما تنفذها اليوم**، وسجّل في كل مرة:

| التنفيذ | الدقائق | الأخطاء التي وجدتها المراجعة | سؤال الإنصاف |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

- **الدقائق:** من البداية إلى أن يصير المخرج صالحًا للإرسال.
- **الأخطاء:** ما وجده مراجع، أو وجدته أنت بعد يوم: اسم خطأ، ورقم خطأ، وسطر ناقص.
- **سؤال الإنصاف:** سؤال واحد يُجاب عنه بعدد. مثال: كم مخرجًا من المخرجات حصل صاحبه على السبب نفسه الذي حصل عليه من يماثله؟

لا تكتب في هذه الورقة اسمًا ولا رقمًا وظيفيًا ولا أي بيان عن شخص. أحضرها معك في اليوم الأول.
`);

// ------------------------------------------------------------ lab 1.1
write(FILES, "start/hr_uses_six.csv", csv([["#", "الاستخدام كما وُصف", "المستوى", "من يقرر", "السبب"],
  ...D.uses.map(u => [u.id, u.text, "", "", ""]), [], ["المستويات الثلاثة", D.TIERS.join(" / ")]]));
write(REF, "D1_1_risk_tiers.csv", csv([["#", "الاستخدام كما وُصف", "المستوى", "من يقرر", "السبب"], ...D.uses.map(u => [u.id, u.text, D.TIERS[u.tier], u.who, u.why])]));
write(SOL, "D1_1_risk_tiers.md", `# الحل المرجعي: المختبر 1.1 جدول مستويات المخاطر

نقطة البداية: \`files/start/hr_uses_six.csv\`. ${CHECK}.

${md(["#", "المستوى", "من يقرر", "السبب"], D.uses.map(u => [u.id, D.TIERS[u.tier], u.who, u.why]))}
دليل الناتج الأول: خمسة صفوف صحيحة من ستة. الصف يُعد صحيحًا حين يطابق المستوى المرجع ويذكر السبب من يتأثر بالمخرج.

أكثر ما يُختلف فيه: الاستخدام 3 (التلخيص نفسه إعداد، والمانع الأسماء والأداة)، والاستخدام 5 (اقتراحات لا قرار، لكنها تمس مسار موظف).
`);

// ------------------------------------------------------------ lab 1.2
const planted = D.jd.filter(([k]) => k).map(([k, line, key], i) => { const [type, why, fix] = key.split("|"); return { n: i + 1, k, line: line.replace(/^- /, ""), type, why, fix }; });
const nW = planted.filter(p => p.k === "w").length, nR = planted.filter(p => p.k === "r").length;
write(FILES, "start/job_description_ai_draft.md", D.jd.map(([, line]) => line).join("\n") + "\n");
write(FILES, "start/jd_change_table.csv", csv([["#", "النص الأصلي", "النص بعد التنقيح", "النوع: صياغة إقصائية أو متطلب مبالغ فيه", "السبب (مع سطر بطاقة الدور إن وُجد)"], ...Array.from({ length: 14 }, (_, i) => [i + 1, "", "", "", ""])]));
write(REF, "D1_2_change_table.csv", csv([["#", "النص الأصلي", "النص بعد التنقيح", "النوع", "السبب"], ...planted.map(p => [p.n, p.line, p.fix, `${p.k === "w" ? "صياغة إقصائية" : "متطلب مبالغ فيه"}: ${p.type}`, p.why])]));
write(REF, "D1_2_planted.json", JSON.stringify(planted.map(p => ({ n: p.n, kind: p.k, line: p.line })), null, 2));
write(SOL, "D1_2_job_description.md", `# الحل المرجعي: المختبر 1.2 تنقيح وصف وظيفي

نقطة البداية: \`files/start/job_description_ai_draft.md\` وبطاقة الدور. ${CHECK}.

المزروع ${planted.length}: ${nW} صياغات إقصائية و${nR} متطلبات مبالغ فيها أمام بطاقة الدور.

${md(["#", "النص الأصلي", "بعد التنقيح", "النوع", "السبب"], planted.map(p => [p.n, p.line, p.fix, `${p.k === "w" ? "صياغة" : "متطلب"}: ${p.type}`, p.why]))}
جدول التغييرات هو «النسخة المنقحة بتتبع التغييرات» في دليل الناتج الثاني: كل تغيير له نص أصلي ونص جديد وسبب. تغيير بلا سبب لا يُحتسب.
`);

// ------------------------------------------------------------ labs 1.3 and 1.4
const index = [], scores = [];
for (const p of D.pairs) {
  const f = D.pairFiles(p);
  write(FILES, `cv/${f.refId}.md`, f.ref);
  write(FILES, `cv/${f.altId}.md`, f.alt);
  const [refLabel, altLabel] = D.VERSION[p.kind];
  index.push([p.n, D.KIND[p.kind], f.refId, refLabel, f.altId, altLabel, p.kind === "age" ? "سنة الميلاد" : "الاسم"]);
  for (const [id, text, label, which] of [[f.refId, f.ref, refLabel, "مرجعية"], [f.altId, f.alt, altLabel, "معدَّلة"]])
    scores.push({ n: p.n, kind: p.kind, id, label, which, runs: [1, 2].map(run => S.score(text, run, D.secondListNames)) });
}
write(FILES, "cv/pairs_index.csv", csv([["الزوج", "ما يختلف", "الملف المرجعي", "نسخته", "الملف المعدَّل", "نسخته", "السطر المختلف"], ...index]));
for (const d of D.draftPairs)
  for (const [letter, v] of [["A", d.a], ["B", d.b]]) write(FILES, `cv_draft/D${d.n}-${letter}.md`, D.cv(`D${d.n}-${letter}`, { ...D.draftBase, ...v }));
write(FILES, "start/pair_check.csv", csv([["الزوج", "ما يُفترض أن يختلف", "عدد الأسطر المختلفة", "الأسطر التي وجدتها", "زوج متطابق؟"], ...D.draftPairs.map(d => [`D${d.n}`, D.KIND[d.kind], "", "", ""])]));
write(REF, "D1_3_pair_check.csv", csv([["الزوج", "ما يُفترض أن يختلف", "زوج متطابق؟", "الملاحظة"], ...D.draftPairs.map(d => [`D${d.n}`, D.KIND[d.kind], d.sound ? "نعم" : "لا", d.note])]));
write(FILES, "start/screening_prompt_weak.md", D.weakPrompt);
write(FILES, "start/screening_prompt_test.md", D.testPrompt);
const LIVE = [1, 8];
write(FILES, "start/live_runs_sheet.csv", csv([["الزوج", "الملف", "النسخة", "التشغيل 1", "التشغيل 2"],
  ...LIVE.flatMap(n => scores.filter(s => s.n === n).map(s => [s.n, s.id, s.label, "", ""]))]));
write(FILES, "start/pair_scores_recorded.csv", csv([["الزوج", "ما يختلف", "الملف", "النسخة", "التشغيل 1", "التشغيل 2"],
  ...scores.map(s => [s.n, D.KIND[s.kind], s.id, `${s.which}: ${s.label}`, ...s.runs]),
  [], ["ملاحظة", "درجات مسجلة من مقيِّم بديل مبرمج (ليس نموذجًا لغويًا ولا منتجًا)، بالأمر في screening_prompt_test.md، كل سيرة مرتين"]]));

const variation = r2(mean(scores.map(s => Math.abs(s.runs[0] - s.runs[1]))));
const perPair = D.pairs.map(p => {
  const [ref, alt] = ["مرجعية", "معدَّلة"].map(w => scores.find(s => s.n === p.n && s.which === w));
  return { n: p.n, kind: p.kind, ref: mean(ref.runs), alt: mean(alt.runs), shift: mean(alt.runs) - mean(ref.runs), run1: alt.runs[0] - ref.runs[0], run2: alt.runs[1] - ref.runs[1] };
});
const byKind = Object.keys(D.KIND).map(kind => {
  const rows = perPair.filter(x => x.kind === kind), shifts = rows.map(x => x.shift), m = r2(mean(shifts));
  const sameDirection = shifts.every(x => x < 0) || shifts.every(x => x > 0);
  const larger = Math.abs(m) > variation;
  return { kind, pairs: rows.length, shifts, mean: m, sameDirection, larger, finding: larger && sameDirection ? "فرق يتجاوز التباين وفي اتجاه واحد" : "لا يتميز عن التباين" };
});
write(REF, "D1_4_summary.json", JSON.stringify({ seed: S.SEED, scores: scores.length * 2, variation, perPair, byKind }, null, 2));
write(REF, "D1_4_pair_analysis.csv", csv([["الزوج", "ما يختلف", "متوسط المرجعية", "متوسط المعدَّلة", "الفرق", "فرق التشغيل 1 وحده", "فرق التشغيل 2 وحده"], ...perPair.map(x => [x.n, D.KIND[x.kind], x.ref, x.alt, x.shift, x.run1, x.run2])]));
const K = k => byKind.find(b => b.kind === k);
// A signed number, isolated so that the sign stays on its side in a right-to-left line
const fmt = x => (x > 0 ? "+" : x < 0 ? "-" : "") + String(Math.abs(x));
const recommendation = `1. **النتيجة:** في أزواج العمر الثلاثة نزلت درجة النسخة الأكبر سنًا ${Math.abs(K("age").mean)} نقطة في المتوسط، والتباين بين التشغيلين ${variation} نقطة. الفرق أكبر من التباين وفي الاتجاه نفسه في الأزواج الثلاثة.
2. **ما لم نجده:** فرق الجنس (${Math.abs(K("gender").mean)} نقطة) وفرق الاسم (${Math.abs(K("name").mean)} نقطة) لا يتميزان عن التباين. هذا لا يثبت غياب التحيز: عشرة أزواج قُيّمت مرتين تكشف الفرق الكبير، ولا تنفي الفرق الصغير.
3. **التوصية:** لا يُستخدم هذا الأمر ولا «ناصح» لإعطاء درجات للمتقدمين ولا لترتيبهم. تفرز اللجنة الطلبات بمعايير بطاقة الدور.
4. **ما يجوز:** يساعد «ناصح» في الإعداد: مسودة الإعلان، وأسئلة المقابلة من المعايير، ورسائل الرد بعد قرار اللجنة.`;
write(SOL, "D1_3_matched_pairs.md", `# الحل المرجعي: المختبر 1.3 تجهيز اختبار الأزواج وتشغيله

نقطة البداية: \`files/cv_draft/\` و\`files/start/screening_prompt_weak.md\`. ${CHECK}.

## فحص الأزواج الثلاثة

${md(["الزوج", "يُفترض أن يختلف", "متطابق؟", "الملاحظة"], D.draftPairs.map(d => [`D${d.n}`, D.KIND[d.kind], d.sound ? "نعم" : "لا", d.note]))}
## عيوب أمر الفرز الضعيف

${D.weakPromptFaults.map((f, i) => `${i + 1}. ${f}`).join("\n")}

الأمر بعد الإصلاح: \`files/start/screening_prompt_test.md\`.

## التشغيل الحي للزوجين 1 و8

درجات القاعة تختلف من مساعد إلى آخر ومن تشغيل إلى آخر، ولا مرجع لها. المقيِّم البديل المبرمج أعطى:

${md(["الملف", "النسخة", "التشغيل 1", "التشغيل 2"], LIVE.flatMap(n => scores.filter(s => s.n === n).map(s => [s.id, s.label, ...s.runs])))}
ما يُقيَّم في المختبر: محادثة جديدة لكل سيرة، والأمر نفسه حرفيًا، وثماني درجات مسجلة مع اسم الأداة والنموذج في سجل الجلسة.
`);
const traps = perPair.filter(x => x.kind !== "age" && (Math.abs(x.run1) >= 4 || Math.abs(x.run2) >= 4));
write(REF, "D1_4_single_run_traps.json", JSON.stringify(traps, null, 2));
write(SOL, "D1_4_read_scores.md", `# الحل المرجعي: المختبر 1.4 قراءة الدرجات والتوصية

نقطة البداية: \`files/start/pair_scores_recorded.csv\` (${scores.length * 2} درجة من المقيِّم البديل المبرمج، البذرة ${S.SEED}). ${CHECK}.

**تباين التشغيلين:** متوسط الفرق المطلق بين التشغيل 1 والتشغيل 2 على العشرين سيرة = **${variation}** نقطة.

الفرق = متوسط المعدَّلة ناقص متوسط المرجعية. السالب يعني أن النسخة المعدَّلة نزلت.

${md(["الزوج", "ما يختلف", "متوسط المرجعية", "متوسط المعدَّلة", "الفرق", "التشغيل 1 وحده", "التشغيل 2 وحده"], perPair.map(x => [x.n, D.KIND[x.kind], x.ref, x.alt, fmt(x.shift), fmt(x.run1), fmt(x.run2)]))}
${md(["النوع", "عدد الأزواج", "فروق الأزواج", "متوسط الفرق", "أكبر من التباين؟", "اتجاه واحد؟", "القراءة"], byKind.map(b => [D.KIND[b.kind], b.pairs, b.shifts.map(fmt).join(" ، "), fmt(b.mean), b.larger ? "نعم" : "لا", b.sameDirection ? "نعم" : "لا", b.finding]))}
## التوصية المرجعية

${recommendation}

## فخ التشغيل الواحد

${traps.map(x => `- الزوج ${x.n} (${D.KIND[x.kind]}): تشغيل واحد يعطي فرقًا قدره ${fmt(Math.abs(x.run1) >= 4 ? x.run1 : x.run2)}، ومتوسط التشغيلين ${fmt(x.shift)}.`).join("\n")}

من يقرأ تشغيلًا واحدًا يكتب «تحيز ضد الاسم» أو «تحيز ضد النساء» من ضجيج. الفرق الحقيقي يثبت في التشغيلين وفي كل أزواج نوعه.

## ما زُرع في المقيِّم البديل

فرق العمر ${Math.abs(S.AGE_SHIFT)} نقاط، وفرق الاسم نقطة واحدة، ولا فرق للجنس. الفرق الصغير في الاسم مزروع ولا يكشفه هذا الاختبار: هذا هو الدرس في السطر الثاني من التوصية.
`);

// ------------------------------------------------------------ lab 2.1
write(FILES, "start/manager_questions.md", `# أسئلة المقابلة كما كتبها سلمان\n\n${D.managerQuestions.map(([q], i) => `${i + 1}. ${q}`).join("\n")}\n`);
write(FILES, "start/interview_guide_template.md", `# دليل مقابلة: محلل بيانات (المستوى الأول)

القاعدة: كل مرشح يُسأل الأسئلة نفسها بالترتيب نفسه، وكل إجابة تُقدَّر على مرتكزاتها، وكل مقابِل يكتب ملاحظته قبل النقاش.

| # | المعيار من بطاقة الدور | السؤال | مرتكز الدرجة 1 | مرتكز الدرجة 3 | مرتكز الدرجة 5 |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

**سطر الإفصاح للمرشح:**

**الطريق إلى الاعتراض:**
`);
const DISCLOSE = "أُعدّت أسئلة هذه المقابلة بمساعدة أداة ذكاء اصطناعي وراجعتها اللجنة. يقدّر إجاباتك أعضاء اللجنة، ولا تُدخل إجاباتك ولا سيرتك في أي أداة تعطي درجة أو ترتيبًا.";
const CONTEST = "يحق للمرشح أن يطلب سبب القرار. يُجاب من ملاحظات اللجنة على المرتكزات، وتراجع الاعتراضَ سميرة الخضير، وهي ليست عضوًا في اللجنة.";
write(REF, "D2_1_interview_guide.md", `# دليل مقابلة مرجعي: محلل بيانات (المستوى الأول)

${md(["#", "المعيار", "السؤال", "الدرجة 1", "الدرجة 3", "الدرجة 5"], D.guide.map((g, i) => [i + 1, g.c, g.q, ...g.a]))}
**سطر الإفصاح للمرشح:** ${DISCLOSE}

**الطريق إلى الاعتراض:** ${CONTEST}
`);
write(REF, "D2_1_manager_questions.csv", csv([["#", "السؤال", "القرار", "السبب"], ...D.managerQuestions.map(([q, d, w], i) => [i + 1, q, d, w])]));
write(SOL, "D2_1_interview_guide.md", `# الحل المرجعي: المختبر 2.1 دليل مقابلة

نقطة البداية: بطاقة الدور، و\`files/start/manager_questions.md\`، و\`files/start/interview_guide_template.md\`. ${CHECK}.

## أسئلة سلمان الثمانية

${md(["#", "السؤال", "القرار", "السبب"], D.managerQuestions.map(([q, d, w], i) => [i + 1, q, d, w]))}
## الدليل المرجعي

في \`labs/solutions/reference/D2_1_interview_guide.md\`: ستة أسئلة، سؤال لكل معيار، ولكل سؤال مرتكزات للدرجات 1 و3 و5. المطلوب من المشارك أربعة أسئلة ومرتكزات لسؤالين.

ما يُقيَّم: كل سؤال يسمّي معياره، ويطلب موقفًا أو مهمة لا رأيًا، والمرتكز يصف ما يُسمع أو يُرى لا صفة في الشخص («واثق»، «لبق»). المسودة الأولى للأسئلة تُكتب دون مساعد.
`);

// ------------------------------------------------------------ labs 2.2 and 2.3
const identifiers = {};
for (const s of D.staff) {
  write(FILES, `profiles/raw/${s.emp}_${s.name.replace(/ /g, "_")}.md`, D.rawProfile(s));
  write(FILES, `profiles/pseudonymised/${s.code}.md`, D.pseudoProfile(s));
  identifiers[s.code] = { direct: [s.name, s.name.split(" ")[0], s.emp, s.id, s.phone, s.email, D.MANAGER], indirect: [s.born, s.district, s.tenure, ...s.indirect], sensitive: s.sensitive };
}
write(REF, "D2_2_identifiers.json", JSON.stringify(identifiers, null, 2));
const LOGHEAD = ["الملف", "البند", "نوعه", "الإجراء: ترميز أو حذف أو تعميم أو إبقاء", "السبب"];
write(FILES, "start/sanitisation_log.csv", csv([LOGHEAD, ["مثال", "الاسم", "معرِّف مباشر", "ترميز: T1", "الخطة لا تحتاج إلى الاسم، والمفتاح عند الإدارة"], ...Array.from({ length: 16 }, () => ["", "", "", "", ""])]));
const logRows = s => [
  [s.code, "الاسم", "معرِّف مباشر", `ترميز: ${s.code}`, "الخطة لا تحتاج إلى الاسم"],
  [s.code, "الرقم الوظيفي ورقم الهوية والجوال والبريد", "معرِّفات مباشرة", "حذف", "لا يلزم أي منها للغرض"],
  [s.code, "اسم المدير", "معرِّف مباشر لشخص آخر، وغير مباشر للموظف", "حذف", "وحدة من ثلاثة محللين: المدير يدل عليهم"],
  [s.code, "اسم الملف", "معرِّف مباشر", "ترميز", "اسم الملف يُرفع مع الملف"],
  [s.code, "سنة الميلاد والسكن", "معرِّفان غير مباشرين", "حذف", "لا يلزمان لخطة تعلم، والعمر يستدعي صورًا نمطية"],
  [s.code, `مدة الخدمة: ${s.tenure}`, "معرِّف غير مباشر", `تعميم: ${s.band}`, "الفئة تكفي، والرقم الدقيق يدل على صاحبه في وحدة صغيرة"],
  ...s.indirect.map(x => [s.code, x, "معرِّف غير مباشر في نص حر", "حذف", "وصف ينطبق على شخص واحد"]),
  ...s.sensitive.map(x => [s.code, x, /إنذار/.test(x) ? "بيان لا يلزم للغرض" : "بيان حساس أو ظرف شخصي", "حذف", "لا يلزم للخطة، ولا يدخل أي أمر"]),
  [s.code, "مستويات المعايير الستة", "بيانات الغرض", "إبقاء", "منها تُحسب الفجوات"],
  [s.code, "آخر الدورات وطريقة التعلم المفضلة", "بيانات الغرض", "إبقاء", "تلزم لاختيار الإجراء"],
];
write(REF, "D2_2_sanitisation_log.csv", csv([LOGHEAD, ...D.staff.flatMap(logRows)]));
const OTHER = { T1: "اسمها الأول في أول الملاحظات", T2: "بريده داخل ملاحظات المدير", T3: "واقعة مشاركة ملف العملاء: تدعم فجوة M6، وتدخل الخطة فجوةً لا واقعةً" };
write(SOL, "D2_2_pseudonymise.md", `# الحل المرجعي: المختبر 2.2 ترميز ثلاثة ملفات وسجل التنقيح

نقطة البداية: \`files/profiles/raw/\` و\`files/start/sanitisation_log.csv\`. ${CHECK}.

الملفات المرمَّزة المرجعية هي \`files/profiles/pseudonymised/\`، وهي نقطة بداية المختبر 2.3. سجل التنقيح المرجعي في \`labs/solutions/reference/D2_2_sanitisation_log.csv\`.

## ما دُفن في النص الحر

${md(["الملف", "بيان حساس أو ظرف شخصي", "وصف ينطبق على شخص واحد", "غير ذلك"], D.staff.map(s => [s.code, s.sensitive.join("؛ "), s.indirect.join("؛ "), OTHER[s.code]]))}
## القاعدة

- **المفتاح:** جدول الرمز والاسم يبقى في نظام الموارد البشرية، ولا يدخل أي أمر ولا أي مجلد مشترك.
- **الترميز ليس إخفاء هوية:** الملف المرمَّز ما زال بيانات شخصية، لأن من يملك المفتاح يعيد صاحبه.
- **اختبار الزميل:** زميل يعرف الوحدة يقرأ الملف المرمَّز. إن عرف صاحبه ففيه معرِّف غير مباشر باقٍ.
- في وحدة من ثلاثة أشخاص تبقى مستويات المهارات نفسها قادرة على الدلالة على صاحبها عند من يعرف الوحدة: لهذا يبقى الملف المرمَّز داخل الأداة المصرح بها.
`);
const planRef = s => D.gaps(s).sort((a, b) => b.gap - a.gap).slice(0, 3);
const ACTION = {
  M1: ["تنظيف ملف شهري كامل مع توثيق كل تغيير، بمراجعة زميل", "ملفان موثقان يُعاد تنفيذهما دون سؤال"],
  M2: ["دورة قصيرة في التحليل الاستكشافي، ثم تحليل لبيانات التوريد", "تحليل واحد يُعرض على الوحدة"],
  M3: ["بناء لوحة معلومات واحدة لحاجة مدير معرض، بإشراف زميل", "لوحة يستخدمها مدير معرض في قرار شهري"],
  M4: ["عرض نتيجة تحليل على مديري المعارض كل شهر، مع ملاحظات مكتوبة من حاضر", "ثلاثة عروض تبدأ بالتوصية"],
  M5: ["تمارين أسبوعية في الاستعلام على مستودع البيانات، بمراجعة زميل", "ثلاثة استعلامات تدخل تقريرًا شهريًا"],
  M6: ["ورشة داخلية في حماية البيانات مع مسؤول حماية البيانات، ثم مراجعة ملف قبل مشاركته", "قائمة فحص تُطبق على كل ملف يخرج من الوحدة"],
};
write(FILES, "start/learning_plan_template.md", `# خطة تعلم · [رمز الملف]

| الفجوة (المعيار، الحالي، المطلوب) | الإجراء | المقياس |
|---|---|---|
| | | |
| | | |
| | | |

**ما يراه الموظف وما يحق له:**
`);
write(FILES, "start/plan_draft_recorded_T2.md", `# مسودة خطة تعلم للملف T2 (مسودة مسجلة من مساعد بديل مبرمج)

ليست مخرج منتج ولا نموذج. كُتبت للتدريب وفيها عيوب مزروعة.

${D.planDraft.map(([, line], i) => `${i + 1}. ${line}`).join("\n")}
`);
write(REF, "D2_3_gaps.json", JSON.stringify(Object.fromEntries(D.staff.map(s => [s.code, D.gaps(s)])), null, 2));
write(REF, "D2_3_plan_draft_faults.json", JSON.stringify(D.planDraft.map(([c, , fault], i) => ({ n: i + 1, criterion: c, fault })), null, 2));
const SEES = "يرى الموظف خطته والفجوات التي بُنيت عليها ومن أين جاء كل مستوى. يصحح ما يراه خطأ، ويقترح إجراء آخر، ويعترض عند أخصائية التعلم والتطوير. الخطة اقتراح حتى يوافق عليها هو ومديره.";
write(SOL, "D2_3_learning_plans.md", `# الحل المرجعي: المختبر 2.3 خطط تعلم مرمَّزة

نقطة البداية: \`files/profiles/pseudonymised/\` وبطاقة الدور و\`files/start/plan_draft_recorded_T2.md\`. ${CHECK}.

## الفجوات

${md(["الملف", "الفجوات (المعيار: الحالي ثم المطلوب)", "بلا فجوة"], D.staff.map(s => [s.code, D.gaps(s).map(g => `${g.id}: ${g.now} ثم ${g.target}`).join("؛ "), D.CRITERIA.filter(([id]) => !D.gaps(s).some(g => g.id === id)).map(([id]) => id).join("، ")]))}
## المسودة المسجلة للملف T2: أربعة أسطر لا تسندها فجوة

${md(["السطر", "العيب"], D.planDraft.map(([, , fault], i) => [i + 1, fault || "سليم: فجوة وإجراء ومقياس"]))}
## خطط مرجعية

${D.staff.map(s => `**${s.code}** (يفضّل: ${s.prefers})\n\n${md(["الفجوة", "الإجراء", "المقياس"], planRef(s).map(g => [`${g.id} ${g.name}: ${g.now} ثم ${g.target}`, ...ACTION[g.id]]))}`).join("\n")}
**ما يراه الموظف وما يحق له:** ${SEES}
`);

// ------------------------------------------------------------ lab 2.4
const RUNHEAD = ["التنفيذ", "الطريقة", `الدقائق (${D.LETTERS} رسالة)`, "رسائل فيها خطأ", `أزواج متطابقة خرجت رسالتاها بالسبب نفسه (من ${D.FAIR_PAIRS})`];
write(FILES, "start/task_log_reply_letters.csv", csv([RUNHEAD, ...D.taskRuns, [],
  ["المهمة", `رسائل الرد على المتقدمين الذين لم يُختاروا بعد قرار اللجنة: ${D.LETTERS} رسالة في كل تنفيذ`],
  ["مقياس الإنصاف", `${D.FAIR_PAIRS} أزواج من المتقدمين المتماثلين في المعيار الذي لم يستوفوه، يختلفون في الاسم أو الجنس أو العمر: هل خرجت الرسالتان بالسبب نفسه وبطول متقارب؟`]]));
const base = D.taskRuns.slice(0, 3), ai1 = D.taskRuns[3], ai2 = D.taskRuns[4];
const baseMin = r2(mean(base.map(r => r[2]))), baseErr = r2(mean(base.map(r => r[3])));
const pct = x => Math.round((baseMin - x) / baseMin * 100);
const task = { baseline: { minutes: baseMin, errors: baseErr, fair: `${D.FAIR_PAIRS} من ${D.FAIR_PAIRS}` }, assisted1: { minutes: ai1[2], errors: ai1[3], fair: `${ai1[4]} من ${D.FAIR_PAIRS}`, saving_pct: pct(ai1[2]) }, assisted2: { minutes: ai2[2], errors: ai2[3], fair: `${ai2[4]} من ${D.FAIR_PAIRS}`, saving_pct: pct(ai2[2]) } };
write(REF, "D2_4_task_numbers.json", JSON.stringify(task, null, 2));
write(FILES, "start/redesign_card_template.md", `# بطاقة إعادة التصميم

**المهمة المتكررة:**
**لماذا هي مهمة إعداد لا قرار:**

| الخطوة | من ينفذها: إنسان، أو المساعد ثم إنسان يراجع | البيانات التي تدخل المساعد |
|---|---|---|
| | | |
| | | |
| | | |

**ما يبقى بيد البشر:**

| المقياس | خط الأساس (ثلاثة تنفيذات) | بمساعدة 1 | بمساعدة 2 |
|---|---|---|---|
| الوقت بالدقائق | | | |
| الأخطاء | | | |
| الإنصاف: [السؤال وطريقة قياسه] | | | |

**القراءة الصادقة:** ما تحسّن، وما ساء، وما لم يُقَس.

**القرار:** أعتمد التصميم، أو أعدّله، أو أعود إلى الطريقة القديمة. ومن يوافق عليه.
`);
write(SOL, "D2_4_redesign_card.md", `# الحل المرجعي: المختبر 2.4 بطاقة إعادة التصميم

نقطة البداية: \`files/start/task_log_reply_letters.csv\` و\`files/start/redesign_card_template.md\`. ${CHECK}.

${md(["المقياس", "خط الأساس (متوسط ثلاثة)", "بمساعدة 1", "بمساعدة 2"], [
    ["الوقت بالدقائق", baseMin, `${ai1[2]} (أقل بنسبة ${pct(ai1[2])}%)`, `${ai2[2]} (أقل بنسبة ${pct(ai2[2])}%)`],
    ["رسائل فيها خطأ", baseErr, ai1[3], ai2[3]],
    ["أزواج بالسبب نفسه", task.baseline.fair, task.assisted1.fair, task.assisted2.fair]])}
## بطاقة الحالة المرجعية

**المهمة:** رسائل الرد على المتقدمين الذين لم يُختاروا، بعد قرار اللجنة. إعداد لا قرار: القرار اتُّخذ، والرسالة تبلّغه.

${md(["الخطوة", "من ينفذها", "البيانات التي تدخل المساعد"], [
    ["تحديد المعيار الذي لم يُستوفَ لكل متقدم", "اللجنة، من ملاحظاتها على المرتكزات", "لا شيء"],
    ["مسودة الرسالة", "«ناصح»، ثم هبة تراجع", "رمز المتقدم والمعيار فقط، بلا اسم ولا سيرة"],
    ["إدخال الاسم والإرسال", "هبة، من نظام التوظيف", "لا شيء"],
    ["فحص الإنصاف", "هبة: ثلاثة أزواج متماثلة تمر في الخطوة وتُقارن رسائلها", "الرموز والمعايير"]])}
**ما يبقى بيد البشر:** من لم يُختر، ولماذا، والرد على من يعترض.

**القراءة الصادقة:** التنفيذ الأول أسرع بنسبة ${pct(ai1[2])}% وفيه ${ai1[3]} رسائل خاطئة، وزوجان من ثلاثة خرجا بسببين مختلفين: الأمر الحر أدخل الاسم والسيرة فتغيّرت النبرة والسبب. التنفيذ الثاني أبطأ من الأول وأسرع من الأساس بنسبة ${pct(ai2[2])}%، بخطأ واحد وثلاثة أزواج متسقة. يُعتمد الثاني، ويُكتب أن تنفيذين لا يكفيان لرقم نهائي.
`);

// ------------------------------------------------------------ the answer key
write(SOL, "answer_key.md", `# مفتاح الإجابة: ما زُرع في ملفات ${D.ORG}، وأين، وأي مختبر يكشفه

كل ما يخص ${D.ORG} اصطناعي. الملفات يكتبها \`labs/_tools/prepare_files.mjs\`. الدرجات المسجلة من المقيِّم البديل المبرمج \`labs/_tools/standin.mjs\`، والبذرة ${S.SEED}. الحلول يشغّلها \`node labs/solutions/check.mjs\`.

${md(["المزروع", "أين", "المختبر"], [
    ["ستة استخدامات، اثنان في كل مستوى", "`files/start/hr_uses_six.csv`", "1.1"],
    [`${planted.length} عيبًا: ${nW} صياغات إقصائية و${nR} متطلبات مبالغ فيها`, "`files/start/job_description_ai_draft.md`", "1.2"],
    ["زوجان ليسا زوجين متطابقين: فرق ثانٍ في المهارات، وفرق ثانٍ في الخبرة", "`files/cv_draft/`", "1.3"],
    ["أمر فرز فيه ستة عيوب", "`files/start/screening_prompt_weak.md`", "1.3"],
    [`فرق عمر قدره ${Math.abs(S.AGE_SHIFT)} نقاط، وفرق اسم قدره نقطة واحدة لا يكشفه الاختبار، ولا فرق للجنس`, "`files/start/pair_scores_recorded.csv`", "1.4"],
    ["أربعة أسئلة لا ترتبط بالوظيفة وسؤالان غامضان", "`files/start/manager_questions.md`", "2.1"],
    ["بيانات حساسة وأوصاف تنطبق على شخص واحد مدفونة في ملاحظات المدير، وبريد داخل الملاحظات، واسم في اسم الملف", "`files/profiles/raw/`", "2.2"],
    ["أربعة أسطر لا تسندها فجوة، منها صورة نمطية وقرار في شأن شخص", "`files/start/plan_draft_recorded_T2.md`", "2.3"],
    ["تنفيذ أسرع بأخطاء أكثر وإنصاف أقل", "`files/start/task_log_reply_letters.csv`", "2.4"]])}
## الأرقام المرجعية

- 1.4: تباين التشغيلين ${variation}. متوسط الفرق بالنقاط: العمر ${Math.abs(K("age").mean)} نزولًا، والجنس ${Math.abs(K("gender").mean)}، والاسم ${Math.abs(K("name").mean)}.
- 2.4: خط الأساس ${baseMin} دقيقة و${baseErr} خطأ. بمساعدة 1: ${ai1[2]} دقيقة و${ai1[3]} أخطاء وإنصاف ${task.assisted1.fair}. بمساعدة 2: ${ai2[2]} دقيقة وخطأ واحد وإنصاف ${task.assisted2.fair}.

## ما لم يُشغَّل على نموذج

لا مختبر شُغّل على نموذج لغوي عند إعداد المقرر. ما يفعله المشارك في المساعد (اعتراض المساعد في 1.1، وأسئلته في 1.2، والتشغيل الحي في 1.3، ونقد الدليل في 2.1، ومسودة الخطة في 2.3) يقابله في الحلول مقيِّم بديل مبرمج أو مسودة مسجلة. جرّب كل أمر على مساعد القاعة قبل الدفعة الأولى.
`);

console.log(`wrote ${written} files; variation ${variation}; shifts ${byKind.map(b => `${b.kind} ${b.mean}`).join(", ")}; task ${JSON.stringify(task)}`);

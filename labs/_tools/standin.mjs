// The scripted stand-in scorer of the course. It is NOT a language model and stands for no
// product: it reads a CV file as text, counts the evidence for the six criteria of the role
// card, and returns a score out of 100. Three things are planted in it on purpose, so that the
// paired test of labs 1.3 and 1.4 has something to find and something it cannot find:
//
//   - an older birth year lowers the score by AGE_SHIFT points (a clear shift);
//   - a name from the second list of the name pairs lowers it by NAME_SHIFT (a small shift that
//     ten pairs scored twice cannot tell from the repeat-run variation);
//   - the first name's gender changes nothing;
//   - every run adds noise of a few points, seeded by the CV's id and the run number.
//
// labs/_tools/prepare_files.mjs uses it to write the recorded scores; labs/solutions/check.mjs
// uses it to replay them from the CV files.
export const SEED = 2033;
export const AGE_SHIFT = -6;
export const NAME_SHIFT = -1;
export const OLDER_BEFORE = 1980;

// One marker phrase per criterion of the role card
export const CRITERIA = [
  ["M1", "تنظيف"],
  ["M2", "التحليل الاستكشافي"],
  ["M3", "لوحات المعلومات"],
  ["M4", "عرض النتائج"],
  ["M5", "SQL"],
  ["M6", "حماية البيانات"],
];
const YEARS = { "سنة واحدة": 1, "سنتان": 2, "ثلاث سنوات": 3, "أربع سنوات": 4, "خمس سنوات": 5, "ست سنوات": 6 };
const RELEVANT = ["الإحصاء", "تحليل البيانات", "نظم المعلومات", "علوم الحاسب", "تحليلات الأعمال"];

function hash(text) {
  let h = 2166136261 >>> 0;
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function noise(id, run, seed) {
  let s = hash(`${seed}|${id}|${run}`);
  const next = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  next();
  return Math.round((next() + next() - 1) * 3.4);
}

export function features(cv) {
  const line = label => (cv.match(new RegExp(`^${label}:\\s*(.+)$`, "m")) || [])[1]?.trim() ?? "";
  const criteria = CRITERIA.filter(([, mark]) => cv.includes(mark)).map(([id]) => id);
  const years = Object.entries(YEARS).reduce((sum, [w, n]) => sum + (cv.split(w).length - 1) * n, 0);
  const degree = RELEVANT.some(f => new RegExp(`بكالوريوس في ${f}`).test(cv));
  return { id: (cv.match(/C\d\d-[AB]/) || [""])[0], name: line("الاسم"), born: Number(line("سنة الميلاد")), criteria, years, degree };
}

// The score before noise: what the role card supports, then the two planted shifts
export function baseScore(f, secondListNames) {
  let score = 30 + 9 * f.criteria.length + (f.degree ? 6 : 0) + (f.years >= 1 ? 6 : 0);
  if (f.born && f.born < OLDER_BEFORE) score += AGE_SHIFT;
  if (secondListNames.includes(f.name)) score += NAME_SHIFT;
  return score;
}

export function score(cv, run, secondListNames, seed = SEED) {
  const f = features(cv);
  return Math.max(0, Math.min(100, baseScore(f, secondListNames) + noise(f.id, run, seed)));
}

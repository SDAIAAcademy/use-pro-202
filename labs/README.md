# الذكاء الاصطناعي للموارد البشرية والتعلم المؤسسي: المختبرات

ثمانية مختبرات لمقرر أكاديمية سدايا **USE-PRO-202**، مدة كل منها 25 دقيقة. المختبرات صفحات إرشادية بالعربية: ما
يخرج به المشارك، والملفات، وخطوات بدقائقها وأوامر تُنسخ، وأسئلة تحقق، وتمرين إضافي ✱، وملاحظات للمدرب. لا كود
يكتبه المشارك.

كل المختبرات في جهة واحدة: **شركة أرائك للأثاث**، شركة افتراضية. كل الأسماء والأرقام والسير الذاتية وملفات
الموظفين مختلقة، ولا يدخل المختبرات أي بيان عن شخص حقيقي.

## ما يحتاجه المشارك

- متصفح، ومساعد ذكاء اصطناعي واحد تصرّح به جهته. الخطط المجانية تكفي، ولا يُنزَّل أي نموذج على الجهاز.
- برنامج جداول يفتح ملفات CSV، ومحرر نصوص.
- سجل الجلسات: `files/start/session_log.csv`، ويبقى مفتوحًا طوال اليومين.
- ورقة خط الأساس من العمل التحضيري: `files/prework/baseline_sheet.md`.

## نقطة البداية والحل

كل مختبر يبدأ من ملفات جاهزة ولا يعتمد على مختبر آخر. المختبر 1.4 يقرأ درجات مسجلة لا درجات المختبر 1.3،
والمختبر 2.3 يبدأ من ملفات مرمَّزة جاهزة لا من ناتج المختبر 2.2.

| المختبر | الصفحة | يبدأ من | الحل المرجعي |
|---|---|---|---|
| 1.1 | `D1_1_risk_tiers.html` | `case/case_brief.md`، `start/hr_uses_six.csv` | `solutions/D1_1_risk_tiers.md` |
| 1.2 | `D1_2_job_description.html` | `start/job_description_ai_draft.md`، `case/role_card_data_analyst.md`، `start/jd_change_table.csv` | `solutions/D1_2_job_description.md` |
| 1.3 | `D1_3_matched_pairs.html` | `cv_draft/`، `cv/`، `start/pair_check.csv`، `start/screening_prompt_test.md`، `start/live_runs_sheet.csv` | `solutions/D1_3_matched_pairs.md` |
| 1.4 | `D1_4_read_scores.html` | `start/pair_scores_recorded.csv`، `cv/pairs_index.csv` | `solutions/D1_4_read_scores.md` |
| 2.1 | `D2_1_interview_guide.html` | `case/role_card_data_analyst.md`، `start/manager_questions.md`، `start/interview_guide_template.md` | `solutions/D2_1_interview_guide.md` |
| 2.2 | `D2_2_pseudonymise.html` | `profiles/raw/` (ثلاثة ملفات)، `start/sanitisation_log.csv` | `solutions/D2_2_pseudonymise.md` |
| 2.3 | `D2_3_learning_plans.html` | `profiles/pseudonymised/`، `start/plan_draft_recorded_T2.md`، `start/learning_plan_template.md` | `solutions/D2_3_learning_plans.md` |
| 2.4 | `D2_4_redesign_card.html` | `start/task_log_reply_letters.csv`، `start/redesign_card_template.md` | `solutions/D2_4_redesign_card.md` |

الملفات التي يُقاس عليها كل حل في `solutions/reference/`، ومفتاح ما زُرع في الملفات في `solutions/answer_key.md`.

## تشغيل الحلول

```bash
node labs/solutions/check.mjs            # كل المختبرات
node labs/solutions/check.mjs 1.4 2.2    # بعضها
```

يحتاج Node.js وحده. يطبع لكل مختبر ما أعاد حسابه و`PASS`، ولا يكتب شيئًا على القرص ولا يتصل بأي نموذج.

**ما يُشغَّل فعلًا:** كل حساب على الملفات: تصنيف الاستخدامات الستة، ووجود الأخطاء المزروعة في الوصف الوظيفي
وزوالها بعد التغييرات المرجعية، وأن كل زوج من السير يختلف في سطر واحد، وتباين التشغيلين ومتوسط الفرق لكل نوع
وقاعدة القرار، وأسئلة المدير الثمانية، ووجود كل معرِّف مزروع في الملفات الخام وغيابه عن المرمَّزة، وفجوات كل ملف
مرمَّز، وأرقام سجل المهمة قبل إعادة التصميم وبعدها. المختبران 1.4 و2.2 يُشغَّلان كاملين.

**ما يُشغَّل بمقيِّم بديل أو مسودة مسجلة:** كل خطوة يؤديها المشارك في المساعد: الخطوة 4 في 1.1 و1.2 و2.1 و2.4،
والخطوة 3 في 1.3، والخطوة 2 في 2.3. المقيِّم البديل (`_tools/standin.mjs`) دالة مبرمجة زُرعت فيها فروق معلومة:
ليس نموذجًا لغويًا، ولا يُستنتج من أرقامه شيء عن أي مساعد حقيقي. لم تُشغَّل الحلول ولا أوامر المختبرات على نموذج
حقيقي، ولم يُقَس وقت التشغيل الحي في المختبر 1.3: يجرّب المدرب الأوامر على مساعد القاعة قبل كل دفعة.

## الملفات

| الملف | ما هو | المزروع فيه |
|---|---|---|
| `case/case_brief.md` | موجز الحالة والقاعدة التي تحكمها | لا شيء |
| `case/role_card_data_analyst.md` | بطاقة دور محلل البيانات: ستة معايير بمستوياتها | يُقاس عليها الوصف والأسئلة والخطط |
| `start/hr_uses_six.csv` | ستة استخدامات مقترحة | اثنان في كل فئة، واستخدامان يبقيان عند البشر |
| `start/job_description_ai_draft.md` | وصف وظيفي كتبه المساعد | ثلاثة عشر خطأ: سبعة في الصياغة وستة في المتطلبات |
| `cv_draft/` | ثلاثة أزواج أولية | زوج سليم وزوجان غير متطابقين |
| `cv/`، `cv/pairs_index.csv` | عشرة أزواج للاختبار: أربعة للاسم، وثلاثة للجنس، وثلاثة للعمر | سطر واحد مختلف في كل زوج |
| `start/screening_prompt_weak.md`، `start/screening_prompt_test.md` | أمر فرز ضعيف وأمر الاختبار | الضعيف بلا معايير ولا مقياس |
| `start/pair_scores_recorded.csv` | أربعون درجة: عشرون سيرة في تشغيلين | فرق في العمر يتجاوز التباين، ولا فرق محتسب في الاسم والجنس |
| `start/manager_questions.md` | ثمانية أسئلة مقابلة | أربعة تُحذف، واثنان غامضان، واثنان يُحسَّنان |
| `profiles/raw/` | ثلاثة ملفات موظفين خام | 38 معرِّفًا وبندًا حساسًا، ومنها اسم في اسم الملف |
| `profiles/pseudonymised/` | الملفات نفسها مرمَّزة | فجوات كل ملف أمام البطاقة |
| `start/plan_draft_recorded_T2.md` | خطة تعلم مسجلة من مساعد | أربعة أسطر لا تسندها فجوة |
| `start/task_log_reply_letters.csv` | سجل مهمة رسائل الرد: أساس وتنفيذان | تنفيذ أسرع بأخطاء أكثر وإنصاف أقل |
| القوالب والسجلات في `start/` | جدول التغييرات، وفحص الأزواج، وورقة التشغيل الحي، وسجل الترميز، وقالب الدليل، وقالب الخطة، وقالب البطاقة، وسجل الجلسات | لا شيء |

## إعادة توليد الملفات

```bash
node labs/_tools/prepare_files.mjs
```

النصوص في `_tools/data.mjs`، والمقيِّم البديل في `_tools/standin.mjs`، والبذرة ثابتة: إعادة التوليد تعيد كتابة
`files/` و`solutions/reference/` و`solutions/answer_key.md` كما هي.

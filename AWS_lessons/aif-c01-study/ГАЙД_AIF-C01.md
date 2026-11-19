# AWS Certified AI Practitioner (AIF-C01) — падручнік

Сціслы падручнік на беларускай мове для падрыхтоўкі да экзамену **AWS Certified AI Practitioner (AIF-C01)**. Тэорыя па ўсіх пяці даменах экзамену з табліцамі параўнання, шпаргалка «ключавое слова → адказ» і тыповыя пасткі. Тэрміны падкрэслены пункцірам: навядзі на тэрмін (або націсні), каб убачыць тлумачэнне.

Практыка — у файле **`index.html`** (тэорыя са схемамі, трэнажор, сімуляцыя экзамену, карткі, слоўнік; адкрываецца ў браўзеры і працуе без інтэрнэту).

---

## 0. Як карыстацца матэрыяламі

| Крок | Што рабіць | Дзе |
|---|---|---|
| 1 | Прачытай тыповыя пасткі і тэорыю па даменах. Найбольш часта памыляюцца ў D1 (базавыя паняцці ML), D4 (Responsible AI) і D5 (бяспека) | гэты файл |
| 2 | Прайдзі пытанні ў трэнажоры з разборам | `index.html` → Трэніроўка |
| 3 | Паўтарай **«Мае слабыя»** / **«Разумны рэжым»**, пакуль спіс слабых не апусцее | `index.html` |
| 4 | Зрабі некалькі **сімуляцый экзамену** (90 хв). Мэта — стабільна ≥ 80% | `index.html` → Экзамен |

Статыстыка трэнажора захоўваецца ў браўзеры (localStorage) — прагрэс не губляецца паміж сесіямі.

---

## 1. Тыповыя пасткі

Найчасцей на экзамене памыляюцца ў наступным:

1. **Блытаніна падобных сэрвісаў AWS**: Polly ↔ Lex, Macie ↔ Inspector, Trusted Advisor ↔ Config, CloudTrail ↔ invocation logging, Clarify ↔ Model Monitor, Rekognition ↔ SageMaker, Bedrock ↔ JumpStart.
2. **Базавыя паняцці ML**: тыпы навучання (supervised / RL / transfer), метрыкі (accuracy vs F1, confusion matrix vs MAE), overfitting, этапы ML-праекта (EDA, use case).
3. **Responsible AI**: тыпы bias, інтэрпрэтаванасць мадэляў, SHAP vs PDP, празрыстасць.
4. **Рэжымы inference SageMaker**: serverless vs async vs batch.
5. **Параметры і кастамізацыя FM**: Top K vs Top P, continued pre-training vs fine-tuning, self-supervised vs supervised.

> 💡 **Лайфхак для экзамену:** у кожным пытанні шукай *ключавыя словы-трыгеры* (раздзел 7). Большасць памылак — не ад няведання, а ад таго, што не заўважыў ключавое слова («less than 1 GB», «intermittent», «prompts and responses», «who called the API», «energy efficient»).

---

## 2. Домен 1 — Fundamentals of AI and ML (20%)

### 2.1. AI ⊃ ML ⊃ Deep Learning ⊃ Generative AI

- **AI** — любая сістэма, што імітуе інтэлект (у т.л. правілы).
- **ML** — мадэль вучыцца на даных, а не праграмуецца правіламі.
- **Deep Learning** — ML на шматслойных нейронных сетках (CNN для выяў, RNN/Transformers для паслядоўнасцей).
- **Generative AI** — DL-мадэлі, што *ствараюць* новы кантэнт (тэкст, выявы, код, аўдыё).

### 2.2. Тыпы навучання

| Тып | Даныя | Што робіць | Прыклады алгарытмаў / задач |
|---|---|---|---|
| **Supervised** | размечаныя (ёсць правільны адказ) | вучыцца прадказваць метку | Лінейная/лагістычная рэгрэсія, дрэвы рашэнняў, **нейронныя сеткі**, SVM. Класіфікацыя (spam/не spam), рэгрэсія (цана) |
| **Unsupervised** | без метак | шукае структуру | **K-means** (кластарызацыя), **PCA** (памяншэнне памернасці), выяўленне анамалій |
| **Semi-supervised** | трохі метак + шмат без | | |
| **Self-supervised** | меткі генеруюцца з саміх даных | | **Pre-training FM** (прадказаць наступны / прапушчаны токен) |
| **Reinforcement learning** | узаемадзеянне з асяроддзем | **агент** робіць **дзеянні**, атрымлівае **ўзнагароды/штрафы**, вучыць **палітыку**, каб максімізаваць сукупную ўзнагароду | Робататэхніка, гульні, AWS DeepRacer, **RLHF** (чат-бот вучыцца на зваротнай сувязі) |
| **Transfer learning** | | пераносіць веды з адной задачы на **сумежную** | Fine-tuning прадугледжанай мадэлі |

> ⚠️ Пастка: «чат-бот павінен пастаянна паляпшацца з узаемадзеянняў з кліентамі / зваротнай сувязі» → **RL**, а не incremental training.

### 2.3. Тыпы задач Computer Vision

| Задача | Што робіць |
|---|---|
| Image classification | адна метка на ўсю выяву («тут ёсць кот») |
| **Object detection** | знаходзіць **і** класіфікуе **кожны** аб'ект (bounding boxes) — «ідэнтыфікаваць і класіфікаваць кожную жывёлу» |
| Segmentation | метка для кожнага пікселя |
| OCR | тэкст з выявы (Textract) |

### 2.4. ML lifecycle (этапы праекта)

1. **Вызначэнне бізнес-задачы** — вузка і дакладна сфармуляваць use case і метрыку поспеху (напрыклад: «што спачатку папрасіць каманду?» → *define the use case narrowly*).
2. **Збор даных**.
3. **EDA (Exploratory Data Analysis)** — статыстыка, візуалізацыі, пошук патэрнаў і анамалій.
4. **Data preparation** — ачыстка, прапушчаныя значэнні, нармалізацыя, балансаванне.
5. **Feature engineering** — стварэнне/адбор прыкмет.
6. **Training** + **hyperparameter tuning**.
7. **Evaluation** — ацэнка і параўнанне мадэляў на тэставых даных.
8. **Deployment** → **Inference** (выкарыстанне мадэлі для прагнозаў на новых даных).
9. **Monitoring** (дрэйф даных/якасці) → перанавучанне.

> **Evaluation** = выбраць/ацаніць мадэль. **Inference** = выкарыстоўваць мадэль для прагнозаў.

**Parameters vs hyperparameters:** weights/biases мадэль вучыць сама (parameters); learning rate, epochs, batch size, глыбіню дрэва задаеш ты (hyperparameters).

### 2.5. Overfitting vs Underfitting

| | Overfitting (high variance) | Underfitting (high bias) |
|---|---|---|
| Сімптом | **Выдатна на train, дрэнна на новых даных** | Дрэнна і на train, і на test |
| Лячэнне | рэгулярызацыя (L1/L2), dropout, early stopping, **hyperparameter tuning**, больш даных, data augmentation, прасцейшая мадэль | больш складаная мадэль, больш прыкмет, вучыць даўжэй |

> ⚠️ «Reduce training data» — **ніколі** не лечыць overfitting.

### 2.6. Метрыкі — абавязкова вывучыць

**Confusion matrix** (класіфікацыя):

|  | Прагноз: + | Прагноз: − |
|---|---|---|
| **Факт: +** | TP | FN |
| **Факт: −** | FP | TN |

| Метрыка | Формула | Калі выкарыстоўваць |
|---|---|---|
| **Accuracy** | (TP+TN)/усе | «агульны % правільных прагнозаў», класы збалансаваныя |
| **Precision** | TP/(TP+FP) | ілжывыя трывогі дарагія (спам-фільтр) |
| **Recall** (sensitivity) | TP/(TP+FN) | нельга прапусціць (фрод, хваробы) |
| **F1** | 2·P·R/(P+R) | незбалансаваныя класы, баланс P і R |
| **AUC-ROC** | плошча пад ROC | якасць падзелу класаў па ўсіх парогах |
| **Confusion matrix** | | **дэталёвы** аналіз памылак класіфікацыі па класах |
| **MAE, RMSE, R²** | | **рэгрэсія** (неперарыўныя значэнні) |

Метрыкі GenAI — гл. раздзел 3.6. Бізнес-метрыкі — гл. 4.6.

### 2.7. Інтэрпрэтаванасць мадэляў

**White box** (лёгка тлумачыць): лінейная/лагістычная рэгрэсія, дрэвы рашэнняў.
**Black box**: нейронныя сеткі, вялікія ансамблі, LLM.
Trade-off: **больш складаная мадэль → звычайна дакладней, але менш інтэрпрэтавана**.

### 2.8. SageMaker — карта інструментаў

| Інструмент | Для чаго |
|---|---|
| **Studio** | IDE для ML (ноўтбукі, увесь цыкл) |
| **Canvas** | **no-code** ML для аналітыкаў |
| **Data Wrangler** | падрыхтоўка даных, візуалізацыі, **балансаванне класаў** (oversampling/undersampling/SMOTE) |
| **Ground Truth** | **разметка** даных (людзі + аўтаразметка) |
| **Feature Store** | сховішча прыкмет (online/offline) |
| **JumpStart** | ML-хаб: прадугледжаныя мадэлі (у т.л. FM) і гатовыя рашэнні, **one-click deploy**, кастамізацыя сваімі данымі, параўнанне FM па метрыках |
| **Autopilot** | AutoML (аўтаматычна выбірае алгарытм) |
| **Clarify** | **bias** (да і пасля навучання) + **explainability** (SHAP) |
| **Model Monitor** | маніторынг у прадакшне: дрэйф даных, якасці, bias, feature attribution |
| **Model Cards** | дакументацыя мадэлі (прызначэнне, рызыкі, метрыкі) |
| **Model Registry** | каталог версій мадэляў, зацвярджэнне |
| **Model Dashboard** | агульны агляд мадэляў і іх стану |
| **Pipelines** | MLOps / CI-CD для ML |
| **Role Manager** | хуткая налада IAM-роляў для ML-персон |

### 2.9. Рэжымы inference у SageMaker

| Рэжым | Трыгеры ў пытанні |
|---|---|
| **Real-time** | нізкая затрымка, пастаянны трафік, адказ за мілісекунды, пастаянны endpoint |
| **Serverless** | **перарывісты / непрадказальны** трафік, **не хочам кіраваць інфраструктурай**, **cold start прымальны**, эканомія |
| **Asynchronous** | вялікі payload (**да 1 ГБ**), доўгая апрацоўка (да ~1 гадз), **адказ не патрэбен адразу**, чарга, можна маштабаваць да 0 |
| **Batch transform** | прагноз для **ўсяго датасэта** ў S3, перыядычна/офлайн, **без endpoint** |

---

## 3. Домен 2 — Fundamentals of Generative AI (24%)

### 3.1. Базавыя паняцці

- **Token** — частка тэксту (слова/частка слова). Плата і ліміты — у токенах.
- **Context window** — колькі токенаў мадэль бачыць за раз (промпт + адказ).
- **Embedding** — вектар лікаў, які перадае сэнс; блізкія па сэнсе → блізкія вектары. Аснова semantic search і RAG.
- **Vector database** — захоўвае embeddings і хутка шукае падобныя (OpenSearch Serverless, Aurora PostgreSQL pgvector, Neptune Analytics, Pinecone, Redis, MongoDB Atlas).
- **Foundation Model (FM)** — вялікая мадэль, навучаная на велізарных даных, адаптуецца да многіх задач.
- **LLM** — FM для тэксту.
- **Multimodal** — некалькі тыпаў даных (тэкст + выявы + …).
- **Hallucination** — праўдападобны, але ілжывы адказ.

### 3.2. Як вучацца FM

- **Pre-training** — **self-supervised** на велізарных неразмечаных даных (прадказанне наступнага токена).
- **Fine-tuning** — **supervised** на размечаных прыкладах (prompt → completion).
- **Continued pre-training** — дадатковае self-supervised навучанне на **неразмечаных** дамэнных даных.
- **RLHF** — даводка па перавагах людзей (reinforcement learning from human feedback).

### 3.3. Архітэктуры мадэляў

| Мадэль | Як працуе | Для чаго |
|---|---|---|
| **Transformer** | self-attention | аснова ўсіх LLM |
| **BERT** | encoder, **bidirectional**, masked language modeling | разуменне тэксту, класіфікацыя, **запоўніць прапушчанае слова** |
| **GPT** | decoder, autoregressive | генерацыя тэксту |
| **Diffusion** | вучыцца прыбіраць шум | генерацыя выяў (Stable Diffusion) |
| **GAN** | генератар vs дыскрымінатар | **рэалістычныя сінтэтычныя даныя**, выявы |
| **VAE** | encoder → латэнтная прастора → decoder | генерацыя, выяўленне анамалій |
| **WaveNet** | | генерацыя **аўдыё/маўлення** |
| **CNN** | згорткі | выявы (класіфікацыя, детэкцыя) |
| **RNN/LSTM** | паслядоўна | старэйшы падыход для паслядоўнасцей |

### 3.4. Параметры inference

| Параметр | Што робіць | Нізкае значэнне | Высокае значэнне |
|---|---|---|---|
| **Temperature** | выпадковасць | дэтэрмінавана, кансерватыўна | крэатыўна, разнастайна |
| **Top K** | **колькасць** найбольш імаверных кандыдатаў | менш варыянтаў | больш варыянтаў |
| **Top P** | **кумулятыўная імавернасць** кандыдатаў (nucleus) | толькі самыя імаверныя | шырэйшы выбар |
| **Max tokens** | максімальная даўжыня адказу | | |
| **Stop sequences** | дзе спыніць генерацыю | | |

> Мнемоніка: **K — Kolькасць**, **P — Probability**.

### 3.5. Prompt engineering

- **Zero-shot** — без прыкладаў. **Few-shot** — некалькі прыкладаў «уваход → патрэбны выхад» (напрыклад: для класіфікацыі намеру прыклады = *паведамленне → intent*).
- **Chain-of-thought** — «разважай крок за крокам».
- **Role / system prompt** — задаць ролю і правілы.
- **Prompt template** — шаблон з інструкцыямі, у т.л. абарона ад атак.
- **Negative prompting** — што НЕ рабіць (часта ў генерацыі выяў).

**Атакі на промпты:**

| Атака | Сутнасць |
|---|---|
| **Prompt injection** | шкодная інструкцыя ў уводзе перапісвае паводзіны мадэлі |
| **Jailbreak** | абыход абмежаванняў бяспекі |
| **Prompt leaking** | выцягнуць сістэмны промпт |
| **Data poisoning** | шкодныя даныя трапляюць у **навучанне** |
| **Model inversion / extraction** | аднавіць навучальныя даныя / скапіяваць мадэль |

Абарона: Guardrails, prompt templates з інструкцыямі, валідацыя ўводу, мінімальныя правы, маніторынг.

### 3.6. Метрыкі GenAI

| Метрыка | Для чаго |
|---|---|
| **ROUGE** | сумарызацыя (recall n-gram) |
| **BLEU** | машынны пераклад (precision n-gram) |
| **BERTScore** | семантычнае падабенства праз embeddings |
| **Perplexity** | наколькі добра мадэль прадказвае тэкст (ніжэй — лепш) |
| Faithfulness / groundedness | ці абапіраецца адказ RAG на знойдзены кантэкст |

### 3.7. Плюсы і мінусы GenAI

Плюсы: адаптыўнасць, хуткасць, персаналізацыя, творчасць. Мінусы: hallucinations, недэтэрмінаванасць, складана тлумачыць, bias, кошт, пытанні IP і бяспекі.

---

## 4. Домен 3 — Applications of Foundation Models (28%, самы вялікі)

### 4.1. Amazon Bedrock vs SageMaker JumpStart

| | **Amazon Bedrock** | **SageMaker JumpStart** |
|---|---|---|
| Што гэта | **Serverless** доступ да FM праз **адзін API** | **ML-хаб** унутры SageMaker |
| Мадэлі | Anthropic, Amazon Nova/Titan, Meta, Mistral, Cohere, AI21, Stability AI і інш. | сотні open-source і прапрыетарных мадэляў + гатовыя рашэнні |
| Інфраструктура | не кіруеш зусім | разгортваеш на сваіх endpoint'ах (больш кантролю) |
| Ключавыя словы | «generative AI», «API», «no infrastructure», «guardrails», «agents», «knowledge bases» | «pre-built solutions», «one-click deploy», «customize with your data», «compare/evaluate FMs» |

### 4.2. Магчымасці Amazon Bedrock

| Функцыя | Для чаго |
|---|---|
| **Knowledge Bases** | **RAG**: дакументы (S3 і інш.) → chunking → embeddings → vector store. **Па змаўчанні — Amazon OpenSearch Serverless** |
| **Agents** | шматкрокавыя задачы, выклік API праз action groups (Lambda), выкарыстанне KB |
| **Guardrails** | denied topics, content filters (у т.л. prompt attacks), word filters, **PII redaction**, contextual grounding check — для ўваходу і выхаду |
| **Model evaluation** | аўтаматычная і human-ацэнка мадэляў на сваіх даных |
| **Custom models** | fine-tuning (размечаныя даныя), continued pre-training (неразмечаныя), distillation |
| **Model invocation logging** | логі **прамтаў і адказаў** у CloudWatch Logs / S3 |
| **Prompt management / Flows** | шаблоны промптаў, ланцужкі |

**Цэнаўтварэнне:** On-Demand (плата за токены) · **Batch** (танней для вялікіх аб'ёмаў, асінхронна) · **Provisioned Throughput** (гарантаваная прапускная здольнасць; патрэбна для многіх кастамізаваных мадэляў).

**Даныя кліента** не выкарыстоўваюцца для навучання базавых мадэляў і не перадаюцца правайдарам.

### 4.3. Як адаптаваць FM — ад таннага да дарагога

1. **Prompt engineering** (хутка, танна)
2. **RAG** — калі патрэбныя **актуальныя/свае** даныя, што часта мяняюцца, без перанавучання
3. **Fine-tuning** — змяніць стыль/фармат/паводзіны на канкрэтнай задачы (размечаныя даныя)
4. **Continued pre-training** — даведаць дамэн (неразмечаныя даныя)
5. **Навучанне з нуля** (вельмі дорага)

**Transfer learning** — агульная ідэя: перанесці навучаную мадэль на сумежную задачу.

### 4.4. Крытэрыі выбару FM

Кошт, **latency (→ памер мадэлі, )**, дакладнасць, памер кантэксту, мадальнасць, мовы, ліцэнзія, магчымасць кастамізацыі, адпаведнасць патрабаванням.

### 4.5. AI-сэрвісы AWS — шпаргалка (вельмі частыя пытанні)

| Сэрвіс | Што робіць | Ключавыя словы |
|---|---|---|
| **Amazon Comprehend** | NLP: sentiment, сутнасці, ключавыя фразы, мова, **PII detection/redaction**, класіфікацыя | «analyze text», «sentiment», «redact PII» |
| **Amazon Textract** | тэкст, табліцы, формы з дакументаў/сканаў | «extract text from documents/forms» |
| **Amazon Rekognition** | аналіз **выяў і відэа**: аб'екты, твары, модэрацыя, **Custom Labels** | «images», «video», «computer vision», «faces» |
| **Amazon Polly** | **тэкст → маўленне** | «text to speech», «audio courses» |
| **Amazon Transcribe** | **маўленне → тэкст** | «transcribe calls», «subtitles» |
| **Amazon Translate** | пераклад | «multilingual» |
| **Amazon Lex** | **чат-боты** (голас/тэкст, як Alexa) | «conversational interface», «chatbot» |
| **Amazon Kendra** | інтэлектуальны enterprise search | «search across documents» |
| **Amazon Personalize** | рэкамендацыі | «recommendations» |
| **Amazon Q Business** | GenAI-асістэнт на карпаратыўных даных | «employees», «enterprise data» |
| **Amazon Q Developer** | асістэнт распрацоўшчыка (код, AWS) | «code generation» |
| **Amazon A2I** | human review прагнозаў | «human-in-the-loop», «low confidence» |

### 4.6. Бізнес-метрыкі vs тэхнічныя

Пытанне пра **бізнес-каштоўнасць** → task completion rate, cost per interaction, customer satisfaction (CSAT), conversion rate, ROI, average revenue per user. Тэхнічныя (precision, recall, F1, latency) — не адказ на пытанне «ці дае гэта бізнесу больш каштоўнасці».

---

## 5. Домен 4 — Guidelines for Responsible AI (14%) — 🔴 частыя памылкі частыя памылкі

### 5.1. Вымярэнні responsible AI (AWS)

**Fairness, Explainability, Privacy & Security, Safety, Controllability, Veracity & Robustness, Governance, Transparency.**

### 5.2. Тыпы bias

| Bias | Сутнасць | Прыклад |
|---|---|---|
| **Sampling bias** | навучальная выбарка не рэпрэзентуе папуляцыю | групы пера/недапрадстаўлены → камера часцей «падазрае» адну этнічную групу |
| **Historical bias** | даныя адлюстроўваюць мінулую несправядлівасць | мадэль найму на старых рашэннях |
| **Measurement bias** | памылкі ў вымярэнні/зборы прыкмет | розныя прылады вымярэння |
| **Observer bias** | суб'ектыўнасць таго, хто назірае / размячае | |
| **Confirmation bias** | шукаем пацвярджэнне сваіх чаканняў | |
| **Automation bias** | людзі занадта давяраюць машыне | |

**Як змяншаць:** рэпрэзентатыўныя даныя, **data augmentation / сінтэтычныя даныя для недапрадстаўленых груп**, балансаванне (Data Wrangler), выяўленне bias (Clarify), маніторынг (Model Monitor), human review, разнастайныя каманды.

### 5.3. Explainability

- **SHAP (Shapley values)** — **лакальна**: уклад кожнай прыкметы ў **канкрэтны** прагноз (можна агрэгаваць у глабальны).
- **PDP (Partial Dependence Plot)** — **глабальна**: як прыкмета **ў сярэднім** уплывае на прагнозы.
- Інструмент AWS — **SageMaker Clarify**.

### 5.4. Transparency і дакументацыя

- **AWS AI Service Cards** — AWS апісвае прызначэнне, абмежаванні і рэкамендацыі сваіх AI-сэрвісаў.
- **SageMaker Model Cards** — ты дакументуеш свае мадэлі.
- Празрыстасць ≠ раскрыццё ўсіх дэталяў абароны: пра guardrails і сістэмныя промпты распавядаюць **на высокім узроўні**.

### 5.5. Бяспечнасць кантэнту

**Guardrails for Amazon Bedrock** — першы выбар для блакавання шкоднага/недарэчнага кантэнту. (У іх не было ў варыянтах — тады выбіраем інструкцыі ў промпце.)

### 5.6. Sustainability

- **AWS Trainium** — найбольш энергаэфектыўнае **навучанне**.
- **AWS Inferentia** — найбольш энергаэфектыўны **inference**.
- Таксама: выкарыстоўваць меншыя мадэлі, гатовыя FM замест навучання з нуля, serverless.

### 5.7. Human-in-the-loop

Amazon A2I, ручная праверка рызыкоўных рашэнняў, зваротная сувязь карыстальнікаў.

---

## 6. Домен 5 — Security, Compliance, Governance (14%) — 🔴 частыя памылкі

### 6.1. Сэрвісы бяспекі і кампліенсу — не блытаць!

| Сэрвіс | Адказвае на пытанне |
|---|---|
| **IAM** | хто што можа рабіць (least privilege) |
| **AWS CloudTrail** | **ХТО, КАЛІ і які API** выклікаў (аўдыт дзеянняў) |
| **Bedrock model invocation logging** | **ЗМЕСТ: прамты і адказы** мадэлі |
| **Amazon CloudWatch** | метрыкі, логі, alarms, дашборды |
| **AWS Config** | гісторыя **канфігурацый** рэсурсаў + правілы адпаведнасці |
| **AWS Trusted Advisor** | **рэкамендацыі**: cost, performance, security, fault tolerance, service limits |
| **Amazon Macie** | **адчувальныя даныя / PII у S3** |
| **Amazon Inspector** | **уразлівасці** EC2, ECR, Lambda |
| **Amazon GuardDuty** | выяўленне **пагроз** і падазронай актыўнасці |
| **AWS KMS** | ключы шыфравання |
| **AWS PrivateLink** | прыватнае падключэнне да Bedrock/SageMaker з VPC без інтэрнэту |
| **AWS Artifact** | **спампаваць справаздачы AWS** аб адпаведнасці (SOC, ISO, PCI) |
| **AWS Audit Manager** | бесперапынны **збор доказаў** для твайго аўдыту |
| **AWS Shield / WAF** | DDoS / вэб-атакі |
| **Amazon DataZone / Lake Formation** | data governance, каталог і доступ да даных |

### 6.2. Shared responsibility model

- **AWS** — бяспека **ОБЛАКА**: дата-цэнтры, абсталяванне, інфраструктура кіраваных сэрвісаў (у т.л. FM у Bedrock).
- **Кліент** — бяспека **Ў ОБЛАКУ**: IAM, даныя, шыфраванне, налады, што адпраўляе ў прамты.

### 6.3. Generative AI Security Scoping Matrix

| Scope | Сцэнар | Адказнасць кліента |
|---|---|---|
| 1 | Consumer app (публічны ChatGPT-падобны сэрвіс) | мінімальная |
| 2 | Enterprise app (SaaS з GenAI, напр. Amazon Q) | |
| 3 | Pre-trained models (выклік FM праз Bedrock API) | |
| 4 | Fine-tuned models (свая дадатковая трэніроўка) | |
| 5 | **Self-trained** (мадэль з нуля) | **максімальная** |

### 6.4. Прыватнасць і governance даных

- **Data lineage** — паходжанне і трансфармацыі даных → **кампліенс, аўдыт, празрыстасць**.
- **De-identification** — маскіраванне/токенізацыя ідэнтыфікатараў; **сінтэтычныя даныя**.
- **Data residency**, retention, **data minimization** (збіраць толькі патрэбнае).
- Шыфраванне **at rest** (KMS) і **in transit** (TLS).

---

## 7. Шпаргалка «ключавое слова → адказ»

| Калі ў пытанні… | …адказ звычайна |
|---|---|
| text to speech, audio | **Polly** |
| speech to text, transcribe calls | **Transcribe** |
| chatbot, conversational interface | **Lex** (або Bedrock для GenAI) |
| extract text/forms/tables from documents | **Textract** |
| sentiment, entities, key phrases, redact PII in text | **Comprehend** |
| images/video, faces, objects, moderation | **Rekognition** |
| translate, multilingual | **Translate** |
| enterprise search | **Kendra** |
| recommendations | **Personalize** |
| employee assistant on company data | **Amazon Q Business** |
| PII in S3 | **Macie** |
| vulnerabilities | **Inspector** |
| threats, malicious activity | **GuardDuty** |
| who called which API, when | **CloudTrail** |
| prompts and responses log | **Bedrock model invocation logging** |
| resource configuration history/compliance | **Config** |
| best-practice recommendations (cost, limits…) | **Trusted Advisor** |
| download SOC/ISO reports | **Artifact** |
| collect audit evidence | **Audit Manager** |
| block topics / harmful content / PII in GenAI | **Guardrails for Amazon Bedrock** |
| up-to-date company data, no retraining | **RAG / Knowledge Bases** |
| multi-step tasks, call APIs | **Bedrock Agents** |
| default vector store for KB | **OpenSearch Serverless** |
| bias detection, explainability, SHAP | **SageMaker Clarify** |
| drift in production | **SageMaker Model Monitor** |
| data labeling | **SageMaker Ground Truth** |
| no-code ML | **SageMaker Canvas** |
| data prep, balance dataset | **SageMaker Data Wrangler** |
| document model (intended use, risks) | **SageMaker Model Cards** |
| human review of predictions | **Amazon A2I** |
| intermittent traffic, cold start OK | **Serverless inference** |
| payload up to 1 GB, not immediate | **Asynchronous inference** |
| whole dataset offline, no endpoint | **Batch transform** |
| low latency, steady traffic | **Real-time inference** |
| energy-efficient training / inference | **Trainium / Inferentia** |
| low latency requirement for FM | **smaller model size** |
| number of candidate tokens | **Top K** |
| cumulative probability | **Top P** |
| randomness / creativity | **Temperature** |
| unlabeled domain data to customize FM | **Continued pre-training** |
| labeled prompt-completion pairs | **Fine-tuning** |
| overall % correct | **Accuracy** |
| don't miss positives | **Recall** |
| avoid false alarms | **Precision** |
| detailed classification errors | **Confusion matrix** |
| regression error | **MAE / RMSE** |
| summarization quality | **ROUGE** |
| translation quality | **BLEU** |
| fill in missing word | **BERT** |
| realistic synthetic data | **GAN** |
| learn from rewards/feedback | **Reinforcement learning** |
| adapt model to related task | **Transfer learning** |
| group without labels | **Clustering (K-means)** |
| most interpretable model | **Linear/logistic regression, decision tree** |
| summary stats & visualizations before modeling | **EDA** |
| training data not representative | **Sampling bias** |
| maximum security ownership | **Model trained from scratch (Scope 5)** |

---

## 8. Апошнія парады перад экзаменам

- 65 пытанняў (50 ацэньваюцца + 15 эксперыментальных), 90 хвілін, прахадны бал 700/1000. Тыпы: адзін адказ, некалькі адказаў, ordering, matching, case study.
- Няма штрафу за няправільны адказ — **адказвай на ўсё**.
- Чытай **апошні сказ** пытання першым — там сапраўднае патрабаванне (MOST cost-effective, LEAST operational overhead, MOST interpretable).
- «Least operational effort / fully managed» → амаль заўсёды гатовы кіраваны сэрвіс (Comprehend, Rekognition, Bedrock), а не «пабудаваць самому на SageMaker / свой API».
- Калі два адказы падобныя — шукай розніцу ў адным слове (Top K/Top P, labeled/unlabeled, local/global).

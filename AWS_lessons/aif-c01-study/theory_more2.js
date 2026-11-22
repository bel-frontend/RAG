/* Падрабязныя раздзелы тэорыі (D3, D4, D5). */
(function(M){
const H = '<h3 class="more">📘 Падрабязней</h3>';

M['bedrock'] = H + `
<h4>Што ёсць у Amazon Bedrock</h4>
<table><tr><th>Магчымасць</th><th>Для чаго</th></tr>
<tr><td><b>Foundation models</b></td><td>Amazon Nova, Anthropic Claude, Meta Llama, Mistral, Cohere, AI21, Stability AI… праз <b>адзін API</b>, без сервераў</td></tr>
<tr><td><b>Playgrounds</b></td><td>паспрабаваць мадэлі ў кансолі (без захавання і версій)</td></tr>
<tr><td><b>Prompt Management</b></td><td>захоўваць, тэставаць, параўноўваць і <b>версіянаваць</b> промпты: зменныя {{x}}, варыянты, версіі</td></tr>
<tr><td><b>Knowledge Bases</b></td><td>RAG пад ключ (гл. тэму RAG)</td></tr>
<tr><td><b>Agents / AgentCore</b></td><td>агенты, якія выконваюць шматкрокавыя задачы з інструментамі</td></tr>
<tr><td><b>Guardrails</b></td><td>фільтры бяспекі для ўваходу і выхаду</td></tr>
<tr><td><b>Model customization</b></td><td>fine-tuning, continued pre-training, distillation, reinforcement fine-tuning. Даныя — з <b>S3</b>, шыфраванне — KMS</td></tr>
<tr><td><b>Model evaluation</b></td><td>automatic, human, LLM-as-a-judge</td></tr>
<tr><td><b>Intelligent prompt routing</b></td><td>аўтаматычна адпраўляе запыт у танную або мацнейшую мадэль у залежнасці ад складанасці</td></tr>
<tr><td><b>Prompt caching</b></td><td>паўторна выкарыстоўвае апрацаваную частку промпту → танней і хутчэй</td></tr>
<tr><td><b>Batch inference</b></td><td>шмат запытаў адным заданнем са скідкай</td></tr>
<tr><td><b>Model invocation logging</b></td><td>запіс поўных прамтаў і адказаў у S3 / CloudWatch</td></tr>
<tr><td><b>Watermark detection</b></td><td>праверыць, ці згенеравана выява мадэллю Amazon</td></tr></table>
<h4>Як плаціць у Bedrock</h4>
<table><tr><th>Мадэль цэнаў</th><th>Калі</th></tr>
<tr><td><b>On-demand</b></td><td>плаціш за токены, без абавязацельстваў. <b>Эксперыменты</b>, непрадказальная нагрузка</td></tr>
<tr><td><b>Batch</b></td><td>вялікія аб'ёмы не ў рэальным часе, танней за on-demand</td></tr>
<tr><td><b>Provisioned Throughput</b></td><td>рэзерв магутнасці на 1 або 6 месяцаў. Стабільная вялікая нагрузка; <b>абавязкова для кастамных</b> (fine-tuned) мадэляў у многіх выпадках</td></tr></table>
<p>Кошт залежыць ад <b>колькасці токенаў</b> (уваход + выхад) і выбранай мадэлі. Каб зэканоміць: карацейшыя промпты, меншыя мадэлі, prompt caching, batch.</p>
<h4>Bedrock vs SageMaker — калі што</h4>
<div class="cols"><div class="card2"><h4>Bedrock</h4><p class="m">хачу гатовую FM праз API, хутка і <b>без інфраструктуры</b>; кастамізацыя з мінімумам працы</p></div>
<div class="card2"><h4>SageMaker AI</h4><p class="m">хачу <b>поўны кантроль</b>: свае алгарытмы, навучанне з нуля, свае endpoint'ы, класічны ML (табліцы, прагнозы)</p></div></div>
<div class="trap">⚠️ PartyRock — гэта бясплатная пясочніца на Bedrock для навучання і эксперыментаў, не для прадакшну.</div>`;

M['rag'] = H + `
<h4>Як працуе RAG пакрокава</h4>
<ol><li><b>Ingestion:</b> дакументы (S3, Confluence, SharePoint, вэб) рэжуцца на кавалкі (<b>chunking</b>), кожны ператвараецца ў embedding і захоўваецца ў vector store.</li>
<li><b>Retrieval:</b> пытанне карыстальніка таксама ператвараецца ў embedding; шукаюцца найбліжэйшыя кавалкі (k-NN).</li>
<li><b>Augmentation:</b> знойдзеныя кавалкі дадаюцца ў промпт як кантэкст.</li>
<li><b>Generation:</b> LLM адказвае, абапіраючыся на кантэкст. Bedrock вяртае <b>citations</b> — спасылкі на крыніцы кожнай часткі адказу.</li></ol>
<h4>Навошта RAG</h4>
<ul><li>✅ менш <b>hallucinations</b> — адказ грунтуецца на правераных даных;</li><li>✅ <b>актуальныя</b> і ўласныя даныя без перанавучання;</li><li>✅ спасылкі на крыніцы (праверка, давер);</li><li>✅ танней за fine-tuning, асабліва калі даныя часта мяняюцца.</li></ul>
<p>❌ RAG <b>не</b> паскарае навучанне, <b>не</b> скарачае час запыту (дадае крок пошуку) і <b>не</b> пазбаўляе ад неабходнасці абнаўляць дакументы.</p>
<h4>Vector stores на AWS</h4>
<table><tr><th>Сховішча</th><th>Заўвага</th></tr>
<tr><td><b>Amazon OpenSearch Serverless / Service</b></td><td>па змаўчанні для Knowledge Bases; k-NN, паўнатэкставы і гібрыдны пошук, ранжыраванне</td></tr>
<tr><td><b>Aurora PostgreSQL</b> (pgvector)</td><td>калі ўжо ёсць рэляцыйная БД</td></tr>
<tr><td><b>Neptune Analytics</b></td><td>GraphRAG</td></tr>
<tr><td><b>S3 Vectors</b>, Pinecone, Redis, MongoDB Atlas</td><td>таксама падтрымліваюцца</td></tr></table>
<p>❌ Не vector store: DynamoDB (пошук па ключы), Redshift (аналітыка), RDS для звычайных табліц.</p>
<h4>Model Context Protocol (MCP)</h4>
<p><b>MCP</b> — адкрыты стандарт, як агенты падключаюцца да інструментаў і даных. <b>MCP-сервер</b> апісвае магчымасці сістэмы (tools — дзеянні, resources — даныя, prompts — шаблоны), і <b>любы</b> сумяшчальны агент можа іх знайсці і выклікаць без асобнага кода пад кожную сістэму.</p>
<p>Бяспека MCP: ставіць серверы толькі з <b>правераных крыніц</b>, абнаўляць, не дзяліць адзін прывілеяваны токен, не захоўваць ключы ў адкрытым тэксце, не зацвярджаць выклікі аўтаматычна.</p>
<h4>Multi-agent</h4>
<p>Калі адзін агент з усімі інструментамі блытаецца — <b>supervisor-агент</b> разбівае запыт і перадае падзадачы <b>спецыялізаваным агентам</b>. Карыстальнік мае адзін пункт уваходу. <b>Strands Agents</b> — open-source SDK ад AWS, каб напісаць агента на Python у некалькі радкоў.</p>`;

M['customize'] = H + `
<h4>Як выбраць метад адаптацыі</h4>
<table><tr><th>Што трэба</th><th>Метад</th></tr>
<tr><td>змяніць фармат, тон, стыль пад карыстальніка; хутка і танна</td><td><b>Prompt engineering</b> (у т.л. dynamic prompts)</td></tr>
<tr><td>адказы па <b>сваіх / свежых</b> дакументах</td><td><b>RAG</b></td></tr>
<tr><td>мадэль павінна добра рабіць канкрэтную задачу, ёсць <b>размечаныя</b> прыклады</td><td><b>Fine-tuning</b></td></tr>
<tr><td>мадэль не ведае <b>дамена</b> (тэрміны, факты), ёсць <b>неразмечаныя</b> тэксты</td><td><b>Continued pre-training</b></td></tr>
<tr><td>вялікая мадэль добрая, але дарагая і павольная</td><td><b>Distillation</b> (teacher → student)</td></tr>
<tr><td>прыстасаваць да сумежнай задачы</td><td><b>Transfer learning</b></td></tr>
<tr><td>адпавядаць чалавечым каштоўнасцям, пастаянна адаптавацца</td><td><b>RLHF</b></td></tr>
<tr><td>новая мадэль з нуля</td><td><b>Pre-training</b> — вельмі дорага, амаль ніколі не правільны адказ</td></tr></table>
<h4>Як выбраць мадэль</h4>
<table><tr><th>Крытэрый</th><th>Калі вырашальны</th></tr>
<tr><td><b>Latency / памер</b></td><td>адказ у жывой размове, жорсткі ліміт часу → меншая мадэль</td></tr>
<tr><td><b>Кошт</b></td><td>мільёны запытаў → <b>найменшая мадэль, якая задавальняе якасць</b> для кожнай задачы</td></tr>
<tr><td><b>Мадальнасць</b></td><td>патрэбны выявы/відэа на ўваходзе або выхадзе</td></tr>
<tr><td><b>Context window</b></td><td>доўгія дакументы</td></tr>
<tr><td><b>Мовы, ліцэнзія, кастамізацыя</b></td><td>па патрабаваннях праекта</td></tr>
<tr><td><b>Sustainability</b></td><td>калі меншая мадэль задавальняе — яна і больш «зялёная»</td></tr></table>
<div class="trap">⚠️ Квантызацыя — памяншае дакладнасць вагаў, каб мадэль была меншай і хутчэйшай. Новай задачы яна не вучыць.</div>`;

M['ai-services'] = H + `
<h4>Па тыпе даных</h4>
<table><tr><th>Даныя</th><th>Задача</th><th>Сэрвіс</th></tr>
<tr><td rowspan="6">📝 Тэкст</td><td>танальнасць, сутнасці, ключавыя фразы, PII, мова, тэмы</td><td><b>Comprehend</b></td></tr>
<tr><td>медыцынскія сутнасці ў клінічных нататках</td><td><b>Comprehend Medical</b></td></tr>
<tr><td>пераклад</td><td><b>Translate</b></td></tr>
<tr><td>пошук па дакументах кампаніі</td><td><b>Kendra</b></td></tr>
<tr><td>генерацыя, summarization, чат</td><td><b>Bedrock</b></td></tr>
<tr><td>AI-асістэнт для бізнесу / распрацоўшчыкаў</td><td><b>Amazon Q Business / Q Developer</b></td></tr>
<tr><td rowspan="3">🎙 Маўленне</td><td>маўленне → тэкст</td><td><b>Transcribe</b> (медыцына — <b>Transcribe Medical</b>)</td></tr>
<tr><td>тэкст → маўленне</td><td><b>Polly</b></td></tr>
<tr><td>чат-бот голасам або тэкстам</td><td><b>Lex</b></td></tr>
<tr><td rowspan="2">🖼 Выявы / відэа</td><td>аб'екты, твары, тэкст на фота, знакамітасці, мадэрацыя, Custom Labels</td><td><b>Rekognition</b></td></tr>
<tr><td>генерацыя выяў / відэа</td><td><b>Bedrock</b> (Nova Canvas, Nova Reel, Stable Diffusion)</td></tr>
<tr><td>📄 Дакументы</td><td>тэкст, рукапіс, табліцы, формы са сканаў і PDF</td><td><b>Textract</b></td></tr>
<tr><td>👤 Паводзіны</td><td>рэкамендацыі</td><td><b>Personalize</b></td></tr>
<tr><td>📈 Часовыя шэрагі</td><td>прагноз</td><td>SageMaker (Canvas)</td></tr>
<tr><td>🚨 Махлярства</td><td>фрод у анлайн-аперацыях</td><td><b>Fraud Detector</b></td></tr></table>
<h4>Камбінацыі з тэстаў</h4>
<ul><li>танальнасць <b>званкоў</b> → <b>Transcribe + Comprehend</b>;</li><li>разбор юрыдычных <b>сканаў</b> → <b>Textract + Comprehend + Bedrock</b> (summary);</li><li>шматмоўныя <b>аўдыёкурсы</b> → Translate + <b>Polly</b>;</li><li>водгукі: танальнасць → <b>Comprehend</b> або <b>Bedrock</b>.</li></ul>
<h4>Інструменты для распрацоўшчыкаў</h4>
<p><b>Kiro</b> — агентнае IDE са spec-driven распрацоўкай: requirements → design → tasks. <b>Amazon Q Developer</b> — асістэнт для кода. <b>AWS Transform</b> — мадэрнізацыя старога кода. <b>PartyRock</b> — пясочніца GenAI-прыкладанняў без кода.</p>`;

M['biz-metrics'] = H + `
<h4>Тэхнічныя vs бізнес-метрыкі</h4>
<div class="cols"><div class="card2"><h4>⚙️ Тэхнічныя</h4><p class="m">наколькі добра працуе <b>мадэль</b>: accuracy, F1, latency, throughput, time to first token, BLEU, ROUGE</p></div>
<div class="card2"><h4>💰 Бізнес</h4><p class="m">ці дасягнута <b>мэта бізнесу</b>: выручка, кошт, задаволенасць, эфектыўнасць</p></div></div>
<table><tr><th>Мэта ў пытанні</th><th>Метрыка</th></tr>
<tr><td>рэкамендацыі ператвараюць візіты ў пакупкі</td><td><b>Conversion rate</b></td></tr>
<tr><td>агент дае больш каштоўнасці, чым людзі</td><td><b>Task completion rate, cost per interaction, CSAT</b></td></tr>
<tr><td>чат-бот павышае эфектыўнасць аператараў</td><td><b>Average call duration</b> (сярэдні час званка)</td></tr>
<tr><td>вырашаць праблему з першага звароту</td><td>First contact resolution</td></tr>
<tr><td>акупнасць праекта</td><td><b>ROI</b></td></tr>
<tr><td>колькі карыстальнікаў карыстаюцца</td><td>adoption / active users</td></tr></table>
<h4>З чаго пачынаць GenAI-праект</h4>
<p>Першы крок — <b>апытаць зацікаўленых асоб</b>, выбраць use cases з найбольшым эфектам і задаць <b>вымерныя мэты</b> (напр. «+5% канверсіі за 9 месяцаў»). Не капіяваць канкурэнтаў і не выбіраць мадэль па лідарбордзе.</p>`;

M['rai'] = H + `
<h4>Вымярэнні responsible AI (AWS)</h4>
<table><tr><th>Вымярэнне</th><th>Пытанне</th><th>Прыклад дзеяння</th></tr>
<tr><td><b>Fairness</b></td><td>ці аднолькава мадэль ставіцца да розных груп?</td><td>ацаніць уплыў прагнозаў на розныя групы насельніцтва</td></tr>
<tr><td><b>Explainability</b></td><td>ці можна растлумачыць рашэнне?</td><td>SHAP для кожнага крэдытнага рашэння</td></tr>
<tr><td><b>Privacy & security</b></td><td>ці абаронены даныя?</td><td>шыфраванне, прыватная сетка, IAM</td></tr>
<tr><td><b>Safety</b></td><td>ці не шкодзіць сістэма?</td><td>guardrails, фільтры кантэнту</td></tr>
<tr><td><b>Controllability</b></td><td>ці можна кантраляваць і выпраўляць паводзіны?</td><td>human-in-the-loop, магчымасць адключыць</td></tr>
<tr><td><b>Veracity & robustness</b></td><td>ці правільна і ўстойліва працуе пры нечаканых уваходах?</td><td>тэсты на нестандартныя ўваходы</td></tr>
<tr><td><b>Governance</b></td><td>ці ёсць правілы, ролі, аўдыт?</td><td>этычныя прынцыпы, аўдыт выхадаў, Model Cards</td></tr>
<tr><td><b>Transparency</b></td><td>ці ведаюць карыстальнікі, як і для чаго працуе AI?</td><td>AI Service Cards, раскрыццё абмежаванняў</td></tr></table>
<h4>Responsible AI у падрыхтоўцы даных для fine-tuning</h4>
<ul><li>✅ аднолькавыя правілы размеркі, навучаныя размятчыкі, некалькі метак і разбор разыходжанняў;</li><li>✅ дэмаграфічная і геаграфічная разнастайнасць, баланс груп;</li><li>✅ надзейныя задакументаваныя крыніцы, ачыстка ад дублёў і супярэчлівых метак;</li><li>❌ выдаляць рэдкія прыклады, ставіць аб'ём вышэй за якасць, вучыць толькі на сінтэтыцы іншай мадэлі, прыбіраць дэмаграфічныя атрыбуты (тады немагчыма праверыць на bias).</li></ul>
<h4>Іншыя рызыкі GenAI</h4>
<table><tr><th>Рызыка</th><th>Сэнс</th></tr>
<tr><td><b>Plagiarism / cheating</b></td><td>выдаваць згенераванае за ўласную працу</td></tr>
<tr><td><b>IP / copyright</b></td><td>парушэнне аўтарскіх правоў у навучальных даных або выніках</td></tr>
<tr><td><b>Toxicity</b></td><td>абразлівы або шкодны кантэнт</td></tr>
<tr><td><b>Hallucinations</b></td><td>выдуманыя факты</td></tr></table>`;

M['bias'] = H + `
<h4>Адкуль бярэцца bias</h4>
<table><tr><th>Тып</th><th>Сутнасць</th><th>Прыклад</th></tr>
<tr><td><b>Sampling bias</b></td><td>выбарка не адпавядае рэальнай папуляцыі: групы пера- або недапрадстаўлены</td><td>камера часцей пазначае людзей адной этнічнай групы</td></tr>
<tr><td><b>Historical bias</b></td><td>даныя адлюстроўваюць несправядлівасць мінулага</td><td>мадэль найму на старых даных раіць толькі мужчын</td></tr>
<tr><td><b>Measurement bias</b></td><td>памылкі ў зборы або вымярэнні прыкмет</td><td>розныя прылады на розных аб'ектах</td></tr>
<tr><td><b>Observer / labeling bias</b></td><td>суб'ектыўнасць таго, хто назірае або размячае</td><td>размятчык мае свае прадузятасці</td></tr>
<tr><td><b>Human bias</b> (у распрацоўцы)</td><td>рашэнні чалавека пры пабудове мадэлі</td><td>data scientist выбірае прыкметы па асабістых перакананнях</td></tr>
<tr><td><b>Confirmation bias</b></td><td>шукаць пацвярджэнне сваіх меркаванняў</td><td>ігнараваць вынікі, якія не падабаюцца</td></tr>
<tr><td><b>Automation bias</b></td><td>залішне давяраць аўтаматычнай сістэме</td><td>не правяраць рашэнні AI</td></tr></table>
<h4>Як змагацца</h4>
<ul><li><b>рэпрэзентатыўныя даныя</b> ад розных груп, праверка балансу класаў;</li><li><b>data augmentation</b> / сінтэтыка для недапрадстаўленых груп;</li><li>балансаванне класаў (oversampling, undersampling, SMOTE) — <b>SageMaker Data Wrangler</b>;</li><li>выяўленне bias да і пасля навучання — <b>SageMaker Clarify</b> (метрыкі накшталт class imbalance, DPL);</li><li>маніторынг у прадакшне — Model Monitor + Clarify;</li><li>human review, разнастайныя каманды.</li></ul>
<div class="trap">⚠️ Праблема ў <b>даных</b> → выпраўляць даныя (augmentation), а не «ўзяць іншую мадэль» ці «рэгулярызацыю». Oversampling <b>мажарытарнага</b> класа толькі павялічвае дысбаланс.</div>`;

M['explain'] = H + `
<h4>Лакальнае vs глабальнае тлумачэнне</h4>
<div class="cols"><div class="card2"><h4>🔍 Лакальнае — SHAP</h4><p class="m">«Чаму <b>гэтаму кліенту</b> адмовілі?» → даход −15 балаў, даўгі −20, стаж +5. Уклад кожнай прыкметы ў <b>канкрэтны</b> прагноз</p></div>
<div class="card2"><h4>🌍 Глабальнае — PDP</h4><p class="m">«Як <b>у сярэднім</b> узрост уплывае на рашэнні мадэлі?» → графік прагнозу ад значэння прыкметы па ўсім наборы</p></div></div>
<p><b>Shapley values</b> прыйшлі з тэорыі гульняў: як справядліва падзяліць «выйгрыш» (прагноз) паміж «гульцамі» (прыкметамі). Можна і сабраць глабальную карціну, усярэдніўшы SHAP па ўсіх прыкладах (feature importance).</p>
<h4>Як растлумачыць рашэнне кліенту</h4>
<p>Прымяніць <b>explainable AI</b> (SHAP праз <b>SageMaker Clarify</b>) і ператварыць уклады прыкмет у простыя прычыны: «ліміт залежаў перадусім ад даходу і бягучых даўгоў». Агульны бал валідацыі або апісанне архітэктуры кліенту нічога не тлумачаць.</p>
<h4>Інструменты AWS</h4>
<table><tr><th>Інструмент</th><th>Што робіць</th></tr>
<tr><td><b>SageMaker Clarify</b></td><td>SHAP-тлумачэнні, bias да/пасля навучання, ацэнка FM</td></tr>
<tr><td><b>SageMaker Model Cards</b></td><td>дакументацыя: прызначэнне, рызыкі, метрыкі</td></tr>
<tr><td><b>AWS AI Service Cards</b></td><td>празрыстасць AWS-сэрвісаў: прызначэнне, абмежаванні, рэкамендацыі</td></tr>
<tr><td><b>Bedrock citations</b></td><td>спасылкі на крыніцы ў адказах RAG</td></tr></table>`;

M['sustain'] = H + `
<h4>Як зрабіць AI больш «зялёным»</h4>
<ul><li><b>Меншая мадэль</b>, калі яна задавальняе якасць — менш энергіі на кожны запыт (і танней, і хутчэй).</li>
<li><b>AWS Trainium</b> — для навучання, <b>AWS Inferentia</b> — для inference: найлепшая прадукцыйнасць на ват.</li>
<li>Не навучаць з нуля: <b>гатовыя FM</b>, fine-tuning, distillation.</li>
<li>Serverless і batch — рэсурсы не прастойваюць.</li>
<li>Рэгіёны з большай доляй аднаўляльнай энергіі; <b>Customer Carbon Footprint Tool</b> — паказвае вуглявы след.</li></ul>
<table><tr><th>Чып / інстанс</th><th>Для чаго</th></tr>
<tr><td><b>Trainium (Trn)</b></td><td>навучанне DL/FM, энергаэфектыўна</td></tr>
<tr><td><b>Inferentia (Inf)</b></td><td>inference, энергаэфектыўна і танна</td></tr>
<tr><td>P (NVIDIA GPU)</td><td>магутнае навучанне, але менш эфектыўна па энергіі</td></tr>
<tr><td>G (GPU)</td><td>графіка і невялікі ML</td></tr>
<tr><td>C (CPU)</td><td>агульныя вылічэнні</td></tr></table>
<div class="trap">⚠️ «Send every request to both models», «choose the larger model for the future» — супярэчаць мэце sustainability.</div>`;

M['safety'] = H + `
<h4>Палітыкі Amazon Bedrock Guardrails</h4>
<table><tr><th>Палітыка</th><th>Што робіць</th><th>Калі</th></tr>
<tr><td><b>Content filters</b></td><td>блакуюць шкодны кантэнт: hate, insults, sexual, violence, misconduct</td><td>агульная бяспека</td></tr>
<tr><td><b>Prompt attacks</b></td><td>выяўляюць jailbreak, prompt injection, prompt leakage</td><td>«карыстальнікі спрабуюць абысці інструкцыі»</td></tr>
<tr><td><b>Denied topics</b></td><td>забароненыя тэмы (напр. інвестыцыйныя парады)</td><td>асістэнт не павінен абмяркоўваць пэўнае</td></tr>
<tr><td><b>Word filters</b></td><td>канкрэтныя словы, лаянка</td><td>назвы канкурэнтаў</td></tr>
<tr><td><b>Sensitive information filters</b></td><td>выяўляюць і <b>маскіруюць PII</b> (і свае regex)</td><td>не паказваць канфідэнцыйныя даныя ў адказах</td></tr>
<tr><td><b>Contextual grounding checks</b></td><td>правяраюць, ці грунтуецца адказ на крыніцах і ці рэлевантны</td><td>супраць hallucinations у RAG</td></tr>
<tr><td><b>Automated Reasoning checks</b></td><td>фармальная логіка правярае адказ на адпаведнасць правілам з дакумента і тлумачыць, чаму</td><td>палітыкі (адпачынкі, страхоўка) з <b>правяральнымі доказамі</b></td></tr></table>
<h4>Human-in-the-loop</h4>
<p>AI робіць працу, а чалавек правярае або зацвярджае вынік <b>перад</b> тым, як ён уступіць у сілу — калі кошт памылкі большы за кошт праверкі. Тыповая схема: звычайныя выпадкі — аўтаматычна, <b>нізкая ўпэўненасць або высокая рызыка</b> — да чалавека (<b>Amazon A2I</b>).</p>
<div class="trap">⚠️ Temperature = 0 не гарантуе правільнасць. Fine-tuning не замяняе патрабаванне рэгулятара аб зацвярджэнні чалавекам.</div>`;

M['sec-services'] = H + `
<h4>Кожны сэрвіс адказвае на сваё пытанне</h4>
<table><tr><th>Пытанне</th><th>Сэрвіс</th></tr>
<tr><td>Хто можа што рабіць з рэсурсамі?</td><td><b>IAM</b> (ролі, палітыкі, найменшыя прывілеі)</td></tr>
<tr><td>Хто, калі і які API выклікаў?</td><td><b>CloudTrail</b></td></tr>
<tr><td>Што мадэль атрымала і адказала?</td><td><b>Bedrock model invocation logging</b> (па змаўчанні выключана)</td></tr>
<tr><td>Метрыкі, логі, алерты?</td><td><b>CloudWatch</b></td></tr>
<tr><td>Як мяняліся канфігурацыі і ці адпавядаюць правілам?</td><td><b>AWS Config</b></td></tr>
<tr><td>Рэкамендацыі па кошце, бяспецы, ліматах?</td><td><b>Trusted Advisor</b></td></tr>
<tr><td>Дзе ў S3 ляжаць PII?</td><td><b>Macie</b></td></tr>
<tr><td>Ці ёсць уразлівасці ў EC2, кантэйнерах, Lambda?</td><td><b>Inspector</b></td></tr>
<tr><td>Ці ёсць пагрозы / падазроная актыўнасць?</td><td><b>GuardDuty</b></td></tr>
<tr><td>Агульная карціна бяспекі акаўнта</td><td><b>Security Hub</b></td></tr>
<tr><td>Справаздачы аб адпаведнасці <b>самой AWS</b> (SOC, ISO)</td><td><b>Artifact</b></td></tr>
<tr><td>Збор доказаў для свайго аўдыту</td><td><b>Audit Manager</b></td></tr>
<tr><td>Шыфраванне ключамі, якімі кіруеш сам</td><td><b>KMS</b> (customer managed keys)</td></tr>
<tr><td>Паролі і API-ключы</td><td><b>Secrets Manager</b></td></tr>
<tr><td>Прыватны доступ з VPC да Bedrock без інтэрнэту</td><td><b>PrivateLink</b> (interface VPC endpoints)</td></tr>
<tr><td>Агент дзейнічае ад імя карыстальніка ў SaaS</td><td><b>AgentCore Identity</b> (OAuth-токены)</td></tr></table>
<h4>Шыфраванне</h4>
<div class="cols"><div class="card2"><h4>At rest (пры захоўванні)</h4><p class="m"><b>KMS</b>: AWS owned keys (па змаўчанні, ты не кіруеш) → customer managed keys (ратацыя, адключэнне, аўдыт праз CloudTrail)</p></div>
<div class="card2"><h4>In transit (у дарозе)</h4><p class="m"><b>TLS</b>. Не шыфруе даныя на дыску!</p></div></div>`;

M['shared'] = H + `
<h4>Shared responsibility на прыкладах</h4>
<table><tr><th>AWS (security OF the cloud)</th><th>Кліент (security IN the cloud)</th></tr>
<tr><td>фізічныя дата-цэнтры, абсталяванне, сетка, гіпервізары; інфраструктура Bedrock і яго мадэляў</td><td>свае даныя і іх класіфікацыя, IAM-доступы, шыфраванне (выбар ключоў), налады сеткі (VPC, PrivateLink), промпты, guardrails, што робіць прыкладанне з адказамі</td></tr></table>
<p>Чым больш кіраваны сэрвіс, тым больш бярэ на сябе AWS: у EC2 ты абнаўляеш АС, у Bedrock — не. Але <b>даныя і доступы заўсёды на кліенце</b>.</p>
<h4>Generative AI Security Scoping Matrix</h4>
<table><tr><th>Scope</th><th>Сцэнар</th><th>Твая адказнасць</th></tr>
<tr><td>1. Consumer app</td><td>карыстаешся публічным GenAI-сэрвісам</td><td>мінімальная</td></tr>
<tr><td>2. Enterprise app</td><td>SaaS з GenAI-функцыямі</td><td>↑</td></tr>
<tr><td>3. Pre-trained models</td><td>сваё прыкладанне на гатовай FM (Bedrock API)</td><td>↑↑</td></tr>
<tr><td>4. Fine-tuned models</td><td>данавучаеш FM сваімі данымі</td><td>↑↑↑</td></tr>
<tr><td>5. Self-trained models</td><td>навучаеш сваю мадэль з нуля</td><td><b>максімальная</b></td></tr></table>`;

M['privacy'] = H + `
<h4>Data governance для AI — што кантраляваць</h4>
<ul><li><b>Паходжанне (lineage)</b> — адкуль даныя, як збіраліся і трансфармаваліся, якія даныя навучылі якую версію мадэлі.</li>
<li><b>Доступ</b> — хто можа чытаць навучальныя даныя (IAM).</li>
<li><b>Residency</b> — <b>дзе</b> фізічна захоўваюцца (Region). AWS не перамяшчае даныя з выбранага рэгіёна без твайго дзеяння.</li>
<li><b>Retention</b> — <b>як доўга</b> захоўваюцца і калі выдаляюцца.</li>
<li><b>Якасць і каталогі</b> — AWS Glue Data Catalog, Lake Formation (правы доступу да азёр даных), DataZone.</li></ul>
<h4>Як прыбраць асабістыя даныя перад навучаннем</h4>
<table><tr><th>Метад</th><th>Што робіць</th><th>Ці дапамагае, каб мадэль не запомніла асобу?</th></tr>
<tr><td><b>Маскіраванне</b></td><td>замяняе значэнне на «***» або «[NAME]»</td><td>✅</td></tr>
<tr><td><b>Токенізацыя</b></td><td>замяняе на сурагат, сувязь з арыгіналам — толькі ў абароненай табліцы</td><td>✅</td></tr>
<tr><td><b>Сінтэтычныя даныя</b></td><td>штучныя запісы з той жа статыстыкай</td><td>✅</td></tr>
<tr><td><b>Шыфраванне (KMS)</b></td><td>абараняе захоўванне і доступ</td><td>❌ пры навучанні мадэль бачыць расшыфраваныя даныя</td></tr>
<tr><td><b>Invocation logging</b></td><td>запісвае прамты і адказы</td><td>❌ наадварот, захоўвае PII ў логах</td></tr></table>
<h4>PII у тэксце і адказах</h4>
<p>Знайсці PII у <b>S3</b> → <b>Macie</b>. Знайсці і замаскіраваць у <b>тэксце</b> → <b>Comprehend</b>. Не паказваць у <b>адказах мадэлі</b> → <b>Guardrails</b> sensitive information filters.</p>`;

})(window.TOPIC_MORE = window.TOPIC_MORE || {});

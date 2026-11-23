const state = {
  threadId: null,
  cv: null,
  loading: false,
};

const elements = {
  sourceForm: document.querySelector('#source-form'),
  candidateText: document.querySelector('#candidate-text'),
  vacancyText: document.querySelector('#vacancy-text'),
  createButton: document.querySelector('#create-button'),
  questionForm: document.querySelector('#question-form'),
  questionText: document.querySelector('#question-text'),
  answerText: document.querySelector('#answer-text'),
  chatMessages: document.querySelector('#chat-messages'),
  chatStatus: document.querySelector('#chat-status'),
  error: document.querySelector('#error-message'),
  emptyPreview: document.querySelector('#empty-preview'),
  loadingPreview: document.querySelector('#loading-preview'),
  cvPreview: document.querySelector('#cv-preview'),
  resetButton: document.querySelector('#reset-button'),
  downloadButton: document.querySelector('#download-button'),
  printButton: document.querySelector('#print-button'),
};

elements.sourceForm.addEventListener('submit', startSession);
elements.questionForm.addEventListener('submit', answerQuestion);
elements.resetButton.addEventListener('click', resetEditor);
elements.downloadButton.addEventListener('click', downloadCv);
elements.printButton.addEventListener('click', () => window.print());
elements.cvPreview.addEventListener('input', updateCvFromEditor);

async function startSession(event) {
  event.preventDefault();
  hideError();
  resetChat();
  setQuestionEnabled(false);
  setLoading(true);
  appendMessage('user', 'Даныя кандыдата і вакансія адпраўлены агенту.');
  appendPendingMessage();

  try {
    const result = await postJson('/api/cv/start', {
      candidateText: elements.candidateText.value,
      vacancyText: elements.vacancyText.value,
    });
    applyGraphResult(result);
  } catch (error) {
    removePendingMessage();
    elements.chatStatus.textContent = 'памылка';
    showError(error);
    appendMessage('assistant error-message', 'Не атрымалася стварыць CV. Праверце памылку ніжэй.');
  } finally {
    setLoading(false);
  }
}

async function answerQuestion(event) {
  event.preventDefault();
  const answer = elements.answerText.value.trim();

  if (!answer || !state.threadId) return;

  appendMessage('user', answer);
  appendPendingMessage();
  setQuestionEnabled(false);
  setLoading(true);
  hideError();

  try {
    const result = await postJson('/api/cv/answer', {
      threadId: state.threadId,
      answer,
    });
    elements.answerText.value = '';
    applyGraphResult(result);
  } catch (error) {
    removePendingMessage();
    elements.chatStatus.textContent = 'памылка';
    showError(error);
    appendMessage('assistant error-message', 'Не атрымалася апрацаваць адказ. Паспрабуйце яшчэ раз.');
    setQuestionEnabled(true);
  } finally {
    setLoading(false);
  }
}

function applyGraphResult(result) {
  removePendingMessage();
  state.threadId = result.threadId;
  state.cv = result.cv;

  if (result.cv) {
    renderCv(result.cv);
  }

  if (result.status === 'needs_input' && result.question) {
    elements.questionText.textContent = result.question;
    appendMessage('assistant', result.question);
    setQuestionEnabled(true);
    elements.chatStatus.textContent = 'чакае адказу';
    elements.answerText.focus();
  } else {
    setQuestionEnabled(false);
    elements.chatStatus.textContent = 'CV гатова';
    appendMessage('assistant success-message', 'Гатова! CV можна адрэдагаваць справа, раздрукаваць або спампаваць у JSON.');
  }

  updateActions();
}

function renderCv(cv) {
  elements.emptyPreview.hidden = true;
  elements.cvPreview.hidden = false;
  elements.cvPreview.innerHTML = `
    <header class="cv-header">
      <input
        class="cv-name"
        data-path="fullName"
        aria-label="Імя кандыдата"
        value="${escapeAttribute(cv.fullName)}"
      />
      <input
        class="cv-role"
        data-path="targetRole"
        aria-label="Мэтавая роля"
        value="${escapeAttribute(cv.targetRole)}"
      />
    </header>

    ${renderExperience(cv.experience || [])}
    ${renderEducation(cv.education || [])}

    <section class="cv-section">
      <h3>Skills</h3>
      <textarea data-path="skills" aria-label="Навыкі" rows="4">${escapeHtml(
        (cv.skills || []).join(', ')
      )}</textarea>
    </section>
  `;
}

function renderExperience(items) {
  const content = items
    .map(
      (item, index) => `
        <div class="cv-entry">
          <div class="entry-main">
            <input data-path="experience.${index}.role" aria-label="Пасада" value="${escapeAttribute(
              item.role
            )}" />
            <input data-path="experience.${index}.company" aria-label="Кампанія" value="${escapeAttribute(
              item.company
            )}" />
          </div>
          <div class="entry-dates">
            <input data-path="experience.${index}.startDate" aria-label="Дата пачатку" value="${escapeAttribute(
              item.startDate
            )}" />
            <span>—</span>
            <input data-path="experience.${index}.endDate" aria-label="Дата заканчэння" value="${escapeAttribute(
              item.endDate || 'Present'
            )}" />
          </div>
          <textarea data-path="experience.${index}.description" aria-label="Апісанне досведу" rows="3">${escapeHtml(
            item.description || ''
          )}</textarea>
        </div>
      `
    )
    .join('');

  return `<section class="cv-section"><h3>Experience</h3>${content || '<p>—</p>'}</section>`;
}

function renderEducation(items) {
  const content = items
    .map(
      (item, index) => `
        <div class="cv-entry compact">
          <div class="entry-main">
            <input data-path="education.${index}.degree" aria-label="Ступень" value="${escapeAttribute(
              item.degree
            )}" />
            <input data-path="education.${index}.institution" aria-label="Установа" value="${escapeAttribute(
              item.institution
            )}" />
          </div>
          <div class="entry-dates">
            <input data-path="education.${index}.startDate" aria-label="Дата пачатку" value="${escapeAttribute(
              item.startDate
            )}" />
            <span>—</span>
            <input data-path="education.${index}.endDate" aria-label="Дата заканчэння" value="${escapeAttribute(
              item.endDate || 'Present'
            )}" />
          </div>
        </div>
      `
    )
    .join('');

  return `<section class="cv-section"><h3>Education</h3>${content || '<p>—</p>'}</section>`;
}

function updateCvFromEditor(event) {
  const path = event.target.dataset.path;
  if (!path || !state.cv) return;

  if (path === 'skills') {
    state.cv.skills = event.target.value
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    return;
  }

  setNestedValue(state.cv, path.split('.'), event.target.value);
}

function setNestedValue(target, path, value) {
  const lastKey = path.pop();
  const owner = path.reduce((current, key) => current[key], target);
  owner[lastKey] = value;
}

function setLoading(isLoading) {
  state.loading = isLoading;
  elements.createButton.disabled = isLoading;
  elements.resetButton.disabled = isLoading;
  elements.loadingPreview.hidden = !isLoading;
  elements.emptyPreview.hidden = isLoading || Boolean(state.cv);
  elements.cvPreview.hidden = isLoading || !state.cv;

  const label = elements.createButton.querySelector('span');
  label.textContent = isLoading ? 'Ствараем…' : 'Стварыць CV';

  if (isLoading) {
    elements.chatStatus.textContent = 'агент думае…';
  }
}

function resetEditor() {
  state.threadId = null;
  state.cv = null;
  elements.sourceForm.reset();
  elements.questionForm.reset();
  resetChat();
  appendMessage(
    'assistant',
    'Запоўніце даныя вышэй. Калі мне не хопіць інфармацыі для CV, я задам пытанне тут.'
  );
  setQuestionEnabled(false);
  elements.cvPreview.hidden = true;
  elements.cvPreview.innerHTML = '';
  elements.emptyPreview.hidden = false;
  hideError();
  updateActions();
  elements.candidateText.focus();
}

function resetChat() {
  elements.chatMessages.innerHTML = '';
  elements.chatStatus.textContent = 'чакае даных';
}

function appendMessage(role, text) {
  const message = document.createElement('div');
  message.className = `chat-message ${role}`;
  message.textContent = text;
  elements.chatMessages.append(message);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function appendPendingMessage() {
  removePendingMessage();
  const message = document.createElement('div');
  message.id = 'pending-message';
  message.className = 'chat-message assistant pending-message';
  message.innerHTML = '<span></span><span></span><span></span>';
  elements.chatMessages.append(message);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function removePendingMessage() {
  document.querySelector('#pending-message')?.remove();
}

function setQuestionEnabled(enabled) {
  elements.answerText.disabled = !enabled;
  elements.answerText.placeholder = enabled ? 'Напішыце адказ…' : 'Чакайце пытання агента…';
  const answerButton = elements.questionForm.querySelector('button');
  answerButton.disabled = !enabled;
  answerButton.textContent = 'Адказаць і працягнуць';
}

function updateActions() {
  const disabled = !state.cv;
  elements.downloadButton.disabled = disabled;
  elements.printButton.disabled = disabled;
}

function downloadCv() {
  if (!state.cv) return;

  const blob = new Blob([JSON.stringify(state.cv, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName = (state.cv.fullName || 'cv').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.href = url;
  link.download = `${fileName || 'cv'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || `Request failed: ${response.status}`);
  }

  return result;
}

function showError(error) {
  elements.error.textContent = error instanceof Error ? error.message : 'Невядомая памылка';
  elements.error.hidden = false;
}

function hideError() {
  elements.error.hidden = true;
  elements.error.textContent = '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

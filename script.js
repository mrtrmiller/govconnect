const state = { course: 'apgov', day: 'monday', completed: new Set(), data: null };
const courseNames = { apgov: 'AP Government', gov: 'Government', econ: 'Economics', ushistory: 'U.S. History' };
const courseEmoji = { apgov: '🇺🇸', gov: '🏛️', econ: '📈', ushistory: '📜' };

const app = document.querySelector('#app');
const daySelect = document.querySelector('#daySelect');
const completionCount = document.querySelector('#completionCount');

async function loadCourse(course) {
  state.completed.clear();
  completionCount.textContent = '0';
  const res = await fetch(`data/${course}.json?cache=${Date.now()}`);
  state.data = await res.json();
  render();
}

function todayKey() {
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const day = days[new Date().getDay()];
  return ['monday','tuesday','wednesday','thursday','friday'].includes(day) ? day : 'monday';
}

function render() {
  const item = state.data.week[state.day] || state.data.week.monday;
  app.innerHTML = `
    <article class="news-card">
      <div class="news-header">
        <div class="news-copy">
          <div class="tag-row">
            <span class="tag course-tag">${courseEmoji[state.course]} ${courseNames[state.course]}</span>
            <span class="tag">${capitalize(state.day)}</span>
            ${(item.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
          <h2>${item.title}</h2>
          <p class="summary">${item.summary}</p>
        </div>
        <div class="news-image" aria-hidden="true">${item.icon || courseEmoji[state.course]}</div>
      </div>
    </article>
    ${renderVocab(item)}
    ${renderQuestions(item)}
    ${renderWritten(item)}
    ${renderExitTicket(item)}
  `;
  bindActivities(item);
}

function renderVocab(item) {
  const defs = shuffle([...item.vocabulary.map(v => v.definition)]);
  return `
    <section class="activity-card" id="vocabCard">
      <h3>1. Vocabulary Match</h3>
      <p class="instructions">Match each course term to the best definition from today’s story.</p>
      <div class="vocab-grid">
        ${item.vocabulary.map((v, idx) => `
          <div class="match-row">
            <div class="term">${v.term}</div>
            <select data-answer="${escapeAttr(v.definition)}" class="vocab-select">
              <option value="">Choose definition</option>
              ${defs.map(d => `<option value="${escapeAttr(d)}">${d}</option>`).join('')}
            </select>
          </div>
        `).join('')}
      </div>
      <button class="button button--orange" id="checkVocab">Check Vocabulary</button>
      <div class="feedback" id="vocabFeedback"></div>
    </section>`;
}

function renderQuestions(item) {
  return `
    <section class="activity-card">
      <h3>2. Check for Understanding</h3>
      <p class="instructions">Answer each question. Feedback appears instantly.</p>
      ${item.questions.map((q, qi) => `
        <div class="question">
          <strong>${qi + 1}. ${q.prompt}</strong>
          ${q.options.map((opt, oi) => `<button class="option" data-q="${qi}" data-choice="${oi}">${opt}</button>`).join('')}
          <div class="feedback" id="qFeedback${qi}"></div>
        </div>`).join('')}
    </section>`;
}

function renderWritten(item) {
  return `
    <section class="activity-card">
      <h3>3. Written Response</h3>
      <p class="instructions">Use evidence from the summary and course vocabulary.</p>
      <strong>${item.written.prompt}</strong>
      <textarea id="writtenResponse" placeholder="Write 3–5 complete sentences..."></textarea>
      <div class="response-tools">
        <button class="button button--green" id="checkWritten">Get Feedback</button>
        <button class="button" id="copyResponse">Copy Response</button>
      </div>
      <div class="response-feedback" id="writtenFeedback"></div>
    </section>`;
}

function renderExitTicket(item) {
  return `
    <section class="activity-card">
      <h3>4. Exit Ticket</h3>
      <p class="instructions">One sentence only.</p>
      <strong>${item.exitTicket}</strong>
      <textarea id="exitTicket" placeholder="Write your one-sentence answer..."></textarea>
      <button class="button button--orange" id="completeExit">Mark Complete</button>
      <div class="response-feedback" id="exitFeedback">Exit ticket saved on this device. Submit it using your teacher’s directions.</div>
    </section>`;
}

function bindActivities(item) {
  document.querySelector('#checkVocab').addEventListener('click', () => {
    const selects = [...document.querySelectorAll('.vocab-select')];
    const correct = selects.filter(s => s.value === s.dataset.answer).length;
    const fb = document.querySelector('#vocabFeedback');
    fb.className = `feedback show ${correct === selects.length ? 'good' : 'bad'}`;
    fb.textContent = correct === selects.length ? 'Nice work. All vocabulary matches are correct.' : `${correct}/${selects.length} correct. Review the definitions and try again.`;
    if (correct === selects.length) markComplete('vocab');
  });

  document.querySelectorAll('.option').forEach(btn => btn.addEventListener('click', () => {
    const qi = Number(btn.dataset.q);
    document.querySelectorAll(`.option[data-q="${qi}"]`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const q = item.questions[qi];
    const choice = Number(btn.dataset.choice);
    const fb = document.querySelector(`#qFeedback${qi}`);
    const isCorrect = choice === q.answer;
    fb.className = `feedback show ${isCorrect ? 'good' : 'bad'}`;
    fb.textContent = isCorrect ? q.correctFeedback : q.incorrectFeedback;
    if ([...document.querySelectorAll('.feedback[id^="qFeedback"]')].every(x => x.classList.contains('show'))) markComplete('questions');
  }));

  document.querySelector('#checkWritten').addEventListener('click', () => {
    const text = document.querySelector('#writtenResponse').value.trim();
    const fb = document.querySelector('#writtenFeedback');
    fb.classList.add('show');
    if (text.split(/\s+/).filter(Boolean).length < 35) {
      fb.innerHTML = '<strong>Keep building:</strong> Add more evidence, use one course vocabulary term, and explain the connection clearly.';
    } else {
      fb.innerHTML = `<strong>Good start:</strong> You have enough detail for a class response. Before submitting, check that you did these three things: <br>1. Answered the exact prompt. <br>2. Used evidence from the story. <br>3. Included course vocabulary such as <em>${item.vocabulary[0].term}</em> or <em>${item.vocabulary[1].term}</em>.`;
      markComplete('written');
    }
  });

  document.querySelector('#copyResponse').addEventListener('click', async () => {
    await navigator.clipboard.writeText(document.querySelector('#writtenResponse').value);
  });

  document.querySelector('#completeExit').addEventListener('click', () => {
    document.querySelector('#exitFeedback').classList.add('show');
    markComplete('exit');
  });
}

function markComplete(key) { state.completed.add(key); completionCount.textContent = state.completed.size; }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function escapeAttr(s) { return String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function shuffle(arr) { return arr.map(v => [Math.random(), v]).sort((a,b) => a[0]-b[0]).map(x => x[1]); }

document.querySelectorAll('.course-card').forEach(card => card.addEventListener('click', () => {
  document.querySelectorAll('.course-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  state.course = card.dataset.course;
  loadCourse(state.course);
}));

daySelect.addEventListener('change', e => { state.day = e.target.value; state.completed.clear(); completionCount.textContent = '0'; render(); });
document.querySelector('#todayBtn').addEventListener('click', () => { state.day = todayKey(); daySelect.value = state.day; state.completed.clear(); completionCount.textContent = '0'; render(); });
const dialog = document.querySelector('#teacherDialog');
document.querySelector('#teacherBtn').addEventListener('click', () => dialog.showModal());
document.querySelector('#closeTeacher').addEventListener('click', () => dialog.close());

loadCourse(state.course);

let appData = { weekTitle: 'GovConnect Daily', days: [] };
let activeDaily = null;
let draggedTerm = null;

const STORAGE_PREFIX = 'govconnect-v1:';
const completionTasks = ['read','vocab','mcq','q3','q5','q7','q9','writing'];

const $ = (id) => document.getElementById(id);
const esc = (value='') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

window.addEventListener('DOMContentLoaded', () => {
  $('copyWorkBtn')?.addEventListener('click', copyStudentWork);
  $('resetDayBtn')?.addEventListener('click', resetToday);
  $('checkDailyBtn')?.addEventListener('click', checkDailyWork);
  $('saveDailyBtn')?.addEventListener('click', saveAllResponses);
  loadNews();
});

async function loadNews(){
  try{
    const response = await fetch('news.json', {cache:'no-store'});
    if(!response.ok) throw new Error('Could not load news.json');
    appData = await response.json();
  }catch(error){
    document.body.insertAdjacentHTML('afterbegin', `<div class="prompt-box" style="max-width:1180px;margin:12px auto;background:#fff8df"><strong>Teacher note:</strong> The site could not load <code>news.json</code>. Upload the files to GitHub Pages or another web host to test the separated-file version.</div>`);
  }
  renderDaily();
}

function getTodaysStory(){
  const days = appData.days || [];
  if(!days.length) return null;
  const today = new Date();
  const todayISO = toLocalISO(today);
  const exact = days.find(day => day.date === todayISO);
  if(exact) return exact;
  const dayIndex = today.getDay();
  const weekdayMap = {1:'Monday',2:'Tuesday',3:'Wednesday',4:'Thursday',5:'Friday'};
  const weekday = weekdayMap[dayIndex] || 'Monday';
  return days.find(day => String(day.weekday).toLowerCase() === weekday.toLowerCase()) || days[0];
}

function toLocalISO(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function renderDaily(){
  activeDaily = getTodaysStory();
  if(!activeDaily){
    $('dailyCard').innerHTML = `<div class="hero-body"><p class="eyebrow">No story loaded</p><h2>Add stories to news.json</h2><p class="small-note">Once news.json has a days array, today's current event will appear here.</p></div>`;
    return;
  }
  document.title = `What's Happening in the US today? — ${activeDaily.weekday || ''}`;
  renderHero();
  renderLessonFlow();
  renderWritingPrompt();
  renderTasks();
  initInteractions();
  loadSavedResponses();
  updateProgress();
}

function renderHero(){
  const dateLine = [activeDaily.weekday, formatDate(activeDaily.date)].filter(Boolean).join(' • ');
  $('dailyCard').classList.remove('loading-card');
  $('dailyCard').innerHTML = `
    <div class="hero-banner">
      <p class="eyebrow">Today's News Story</p>
      <h2>${esc(activeDaily.title)}</h2>
      <p class="meta">${esc(dateLine)} • ${esc(activeDaily.source || 'Source listed in news.json')}</p>
    </div>
    <div class="hero-body">
      <p class="summary-text">${esc(activeDaily.summary)}</p>
      <div class="pillrow">
        <span class="pill">${esc(activeDaily.unit || appData.weekTitle || 'AP Government')}</span>
        <span class="pill orange">${esc(activeDaily.topic || 'Current Event')}</span>
      </div>
      <div class="key-details">
        <div class="detail"><strong>Key People / Groups</strong>${esc(activeDaily.keyPeople || 'Not listed')}</div>
        <div class="detail"><strong>Central Issue</strong>${esc(activeDaily.coreIssue || 'Not listed')}</div>
      </div>
      ${activeDaily.link ? `<p class="small-note" style="margin-top:14px">Original reporting: <a class="source-link" href="${esc(activeDaily.link)}" target="_blank" rel="noopener">${esc(activeDaily.source || 'Open source')}</a></p>` : ''}
    </div>`;
}

function renderLessonFlow(){
  const visualSteps = activeDaily.visualSteps || [];
  const timeline = activeDaily.timeline || [];
  $('lessonFlow').innerHTML = `
    <section class="lesson-section" data-task="read">
      <div class="section-heading">
        <div><p class="eyebrow">Step 1</p><h2>Understand the facts first</h2></div>
        <span class="time-pill">3 min</span>
      </div>
      <p class="small-note">Your job is not to memorize the article. Your job is to identify the most important facts before making an AP Government connection.</p>
      ${timeline.length ? `<ol class="timeline">${timeline.map(item => `<li>${esc(item)}</li>`).join('')}</ol>` : ''}
      <button class="secondary-btn mark-read" data-complete="read">I read the facts</button>
    </section>

    <section class="lesson-section" data-task="vocab">
      <div class="section-heading">
        <div><p class="eyebrow">Step 2</p><h2>Vocabulary match</h2></div>
        <span class="time-pill">3–4 min</span>
      </div>
      <p class="small-note">Drag each AP Government term to the article detail where it fits best. Use the hints only after you try.</p>
      ${renderVocabMatch()}
    </section>

    <section class="lesson-section">
      <div class="section-heading">
        <div><p class="eyebrow">Step 3</p><h2>Visual explanation</h2></div>
        <span class="time-pill">1 min</span>
      </div>
      <div class="flow-grid">${visualSteps.map((step, index) => `<div class="flow-step"><span>${index+1}</span>${esc(step)}</div>`).join('')}</div>
    </section>`;
}

function renderVocabMatch(){
  const pairs = activeDaily.vocabMatch || [];
  if(!pairs.length) return `<p>No vocabulary activity has been added for this story yet.</p>`;
  const terms = [...pairs.map(pair => pair.term)].sort(() => Math.random() - 0.5);
  return `
    <div class="vocab-match">
      <div class="term-bank" aria-label="Vocabulary terms">
        <strong>Terms</strong>
        <p class="small-note">Drag these to the best article detail.</p>
        ${terms.map(term => `<span class="term-chip" tabindex="0" draggable="true" data-term="${esc(term)}" title="${esc(getVocabHint(term))}">${esc(term)}</span>`).join('')}
      </div>
      <div class="drop-list" aria-label="Article details">
        <strong>Article Details</strong>
        ${pairs.map((pair, index) => `<div class="drop-zone" tabindex="0" data-answer="${esc(pair.term)}"><span>${esc(pair.clue)}</span><div class="hint hidden">Hint: ${esc(getVocabHint(pair.term))}</div></div>`).join('')}
        <div class="button-row"><button id="checkVocabBtn" class="secondary-btn">Check Match</button><button id="showHintsBtn" class="secondary-btn">Show Hints</button></div>
        <div id="vocabFeedback" class="mini-feedback start">Match the terms, then check your work.</div>
      </div>
    </div>`;
}

function getVocabHint(term){
  const hints = {
    'Federalism':'Power is shared between national and state governments.',
    'Separation of Powers':'Different branches have different constitutional jobs.',
    'Checks and Balances':'One branch can limit or respond to another branch.',
    'Judicial Review':'Courts can evaluate government action under the Constitution.',
    'Executive Order':'A directive issued by the president to manage executive branch action.',
    'Election Clause':'Constitutional language about how congressional elections are regulated.',
    'War Powers':'The constitutional and legal debate over who controls military action.',
    'Commander in Chief':'The president’s role as head of the armed forces.',
    'Mandate':'A requirement placed on another level of government or actor.',
    'Fiscal Federalism':'How money shapes federal-state relationships.',
    'Policy Implementation':'How government rules or programs are carried out.',
    'Popular Sovereignty':'The idea that legitimate government authority comes from the people.',
    'Republican Government':'Citizens govern through elected representatives.',
    'Limited Government':'Government power is restricted by law and the Constitution.',
    'Consent of the Governed':'The people give government its authority.'
  };
  return hints[term] || 'Think about how this term describes power, rules, institutions, or citizens.';
}

function renderWritingPrompt(){
  const q = activeDaily.questions || {};
  $('writingPrompt').innerHTML = `
    <strong>Prompt:</strong> ${esc(q.q7 || 'Write a claim, evidence, and reasoning response that connects this event to AP Government.')}<br><br>
    <strong>Strong response target:</strong> Identify a concept, use a factual detail from the summary, and explain why that detail matters in the U.S. constitutional system.`;
}

function renderTasks(){
  const q = activeDaily.questions || {};
  const tasks = [
    {num:3,title:'Question 3: Find the power conflict',prompt:q.q3 || 'What fact from the summary shows a disagreement over government power?'},
    {num:5,title:'Question 5: Use vocabulary with evidence',prompt:q.q5 || 'Which vocabulary term best fits the article? Explain using one fact.'},
    {num:7,title:'Question 7: CER practice',prompt:q.q7 || 'Write a claim, evidence, and reasoning response.'},
    {num:9,title:'Question 9: Make a course connection',prompt:q.q9 || 'Connect this event to one foundational document, required case, or constitutional principle.'}
  ];
  const mcq = activeDaily.mcq || null;
  $('dailyTasks').innerHTML = `
    ${mcq ? `<article class="card" data-task="mcq"><p class="eyebrow">AP-Style Quick Check</p><h2>Multiple Choice</h2><p><strong>${esc(mcq.question)}</strong></p>${(mcq.choices||[]).map(choice => `<button class="mcq-choice" data-answer="${esc(mcq.answer)}">${esc(choice)}</button>`).join('')}<div id="mcqFeedback" class="mini-feedback start">Choose the best answer.</div></article>` : ''}
    ${tasks.map(task => `<article class="card" data-task="q${task.num}"><p class="eyebrow">Written Check</p><h2>${esc(task.title)}</h2><div class="prompt-box">${esc(task.prompt)}</div><textarea id="q${task.num}Response" class="mini-response" placeholder="Type your answer here..."></textarea><div id="q${task.num}Feedback" class="mini-feedback start">Start typing to get feedback.</div></article>`).join('')}`;
}

function initInteractions(){
  document.querySelectorAll('.mark-read').forEach(btn => btn.addEventListener('click', () => {markTask('read'); showToast('Reading marked complete');}));
  initVocabMatch();
  initMCQ();
  [3,5,7,9].forEach(num => {
    const area = $(`q${num}Response`);
    area?.addEventListener('input', () => { instantCheck(num); saveResponse(`q${num}`, area.value); });
  });
  $('dailyResponse')?.addEventListener('input', () => saveResponse('dailyResponse', $('dailyResponse').value));
}

function initVocabMatch(){
  document.querySelectorAll('.term-chip').forEach(chip => {
    chip.addEventListener('dragstart', event => {
      draggedTerm = chip;
      event.dataTransfer.setData('text/plain', chip.dataset.term);
    });
    chip.addEventListener('keydown', event => {
      if(event.key === 'Enter' || event.key === ' '){
        event.preventDefault();
        document.querySelectorAll('.term-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        draggedTerm = chip;
        showToast(`Selected ${chip.dataset.term}`);
      }
    });
  });
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', event => {event.preventDefault(); zone.classList.add('over');});
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', event => {
      event.preventDefault(); zone.classList.remove('over');
      placeTerm(zone, event.dataTransfer.getData('text/plain') || draggedTerm?.dataset.term);
    });
    zone.addEventListener('keydown', event => {
      if((event.key === 'Enter' || event.key === ' ') && draggedTerm){
        event.preventDefault(); placeTerm(zone, draggedTerm.dataset.term);
      }
    });
  });
  $('checkVocabBtn')?.addEventListener('click', checkVocabMatch);
  $('showHintsBtn')?.addEventListener('click', () => document.querySelectorAll('.hint').forEach(h => h.classList.remove('hidden')));
}

function placeTerm(zone, term){
  if(!term) return;
  zone.dataset.choice = term;
  zone.querySelector('.placed')?.remove();
  zone.insertAdjacentHTML('beforeend', `<div class="placed">${esc(term)}</div>`);
  document.querySelectorAll(`.term-chip[data-term="${CSS.escape(term)}"]`).forEach(chip => chip.classList.add('used'));
  saveVocabState();
}

function checkVocabMatch(){
  let correct = 0; let total = 0;
  document.querySelectorAll('.drop-zone').forEach(zone => {
    total++; zone.classList.remove('correct','wrong');
    if(zone.dataset.choice === zone.dataset.answer){ correct++; zone.classList.add('correct'); }
    else zone.classList.add('wrong');
  });
  const feedback = $('vocabFeedback');
  if(correct === total){
    feedback.className = 'mini-feedback good';
    feedback.innerHTML = `<strong>${correct}/${total} correct.</strong> Strong work. You matched the vocabulary to specific article evidence.`;
    markTask('vocab');
  }else{
    feedback.className = 'mini-feedback revise';
    feedback.innerHTML = `<strong>${correct}/${total} correct.</strong> Recheck the details marked in red. Ask: what power, institution, or action is being described?`;
  }
  updateProgress();
}

function initMCQ(){
  document.querySelectorAll('.mcq-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.dataset.answer;
      document.querySelectorAll('.mcq-choice').forEach(choice => choice.classList.remove('correct','wrong'));
      const correct = btn.textContent.trim() === answer;
      btn.classList.add(correct ? 'correct':'wrong');
      document.querySelectorAll('.mcq-choice').forEach(choice => { if(choice.textContent.trim() === answer) choice.classList.add('correct'); });
      const fb = $('mcqFeedback');
      fb.className = `mini-feedback ${correct ? 'good':'revise'}`;
      fb.innerHTML = correct ? `<strong>Correct.</strong> Now be ready to explain what fact from the summary supports that answer.` : `<strong>Not quite.</strong> Look for the answer that best describes the government power or institution involved.`;
      if(correct) markTask('mcq');
      updateProgress();
    });
  });
}

function instantCheck(num){
  const area = $(`q${num}Response`);
  const fb = $(`q${num}Feedback`);
  if(!area || !fb) return;
  const text = area.value.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const score = scoreText(text, num);
  if(words < 8){
    fb.className = 'mini-feedback start';
    fb.innerHTML = 'Keep going. Aim for a complete sentence that uses one fact from the summary.';
  }else if(score >= 3){
    fb.className = 'mini-feedback good';
    fb.innerHTML = `<strong>On track.</strong> You have a clear idea and enough detail. To improve, add one sentence explaining why the evidence matters.`;
    markTask(`q${num}`);
  }else{
    fb.className = 'mini-feedback revise';
    fb.innerHTML = `<strong>Revise.</strong> Add a clearer AP Gov term, a specific fact from the summary, or reasoning that explains the connection.`;
  }
  updateProgress();
}

function scoreText(text, num){
  const lower = text.toLowerCase();
  const conceptWords = ['federalism','separation','checks','balances','judicial','review','executive','congress','president','court','states','constitution','amendment','power','branch','election','policy','popular','sovereignty','limited government','consent'];
  const evidenceWords = getEvidenceWords();
  let score = 0;
  if(text.split(/\s+/).filter(Boolean).length >= 16) score++;
  if(conceptWords.some(word => lower.includes(word))) score++;
  if(evidenceWords.some(word => lower.includes(word))) score++;
  if(/because|therefore|this matters|shows|demonstrates|illustrates|as a result|since/.test(lower)) score++;
  if(num === 7 && /claim|evidence|reason|because|shows/.test(lower)) score++;
  return Math.min(score,4);
}

function getEvidenceWords(){
  const base = `${activeDaily?.title || ''} ${activeDaily?.summary || ''} ${activeDaily?.keyPeople || ''} ${activeDaily?.coreIssue || ''}`.toLowerCase();
  return [...new Set(base.replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w => w.length > 6))].slice(0,30);
}

function checkDailyWork(){
  const text = $('dailyResponse').value.trim();
  const fb = $('dailyFeedback');
  if(!text){
    fb.className = 'feedback-panel revise';
    fb.innerHTML = '<strong>Start with one sentence.</strong> Name an AP Government concept and one fact from the summary.';
    fb.classList.remove('hidden');
    return;
  }
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const scores = {
    Claim: /federalism|separation|checks|balances|judicial review|limited government|popular sovereignty|consent|constitution|power|branch/.test(lower) ? 2 : 1,
    Evidence: getEvidenceWords().some(word => lower.includes(word)) || /summary|article|story|judge|senate|state|congress|president|court/.test(lower) ? 2 : 1,
    Reasoning: /because|therefore|this matters|shows|demonstrates|illustrates|as a result|since/.test(lower) ? 2 : 1,
    Specificity: words >= 45 ? 2 : words >= 25 ? 1.5 : 1
  };
  const total = Object.values(scores).reduce((a,b)=>a+b,0);
  const level = total >= 7.5 ? 'Advanced' : total >= 6 ? 'Proficient' : 'Developing';
  fb.className = `feedback-panel ${total >= 6 ? 'good':'revise'}`;
  fb.innerHTML = `
    <h3>Estimated AP Writing Level: ${level}</h3>
    ${Object.entries(scores).map(([label,val]) => `<div class="score-row"><span>${label}</span><span class="score-badge">${val}/2</span></div>`).join('')}
    <div class="feedback-list"><strong>Next revision move:</strong> ${getRevisionTip(scores, lower)}</div>
    <div class="prompt-box"><strong>Sentence frame:</strong> This event illustrates ___ because the summary states ___. This matters because ___.</div>`;
  fb.classList.remove('hidden');
  if(total >= 6) markTask('writing');
  saveResponse('dailyResponse', text);
  updateProgress();
}

function getRevisionTip(scores, lower){
  if(scores.Claim < 2) return 'Name a precise AP Government concept such as federalism, separation of powers, checks and balances, or limited government.';
  if(scores.Evidence < 2) return 'Add one concrete fact from the summary, such as the actor, government institution, law, order, ruling, or policy involved.';
  if(scores.Reasoning < 2) return 'Add a because statement that explains why your evidence proves the concept.';
  return 'Add a course connection to a foundational document, required case, or constitutional principle.';
}

function markTask(task){
  const state = getState();
  state.completed = state.completed || {};
  state.completed[task] = true;
  setState(state);
}

function updateProgress(){
  const state = getState();
  const done = completionTasks.filter(task => state.completed?.[task]).length;
  const pct = Math.round((done / completionTasks.length) * 100);
  $('progressFill').style.width = `${pct}%`;
  $('progressLabel').textContent = `${pct}% Complete`;
  const labels = {read:'Read facts',vocab:'Vocab match',mcq:'Quick check',q3:'Q3 response',q5:'Q5 response',q7:'Q7 response',q9:'Q9 response',writing:'AP writing'};
  $('progressSteps').innerHTML = completionTasks.map(task => `<li class="${state.completed?.[task] ? 'done':''}">${labels[task]}</li>`).join('');
  updateStreak(state, pct);
}

function updateStreak(state, pct){
  const all = getGlobalState();
  const today = activeDaily?.date || toLocalISO(new Date());
  if(pct === 100 && all.lastComplete !== today){
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
    const yISO = toLocalISO(yesterday);
    all.streak = all.lastComplete === yISO ? (all.streak || 0) + 1 : 1;
    all.lastComplete = today;
    localStorage.setItem(`${STORAGE_PREFIX}global`, JSON.stringify(all));
  }
  const current = getGlobalState();
  $('streakBadge').textContent = `${current.streak || 0}-day streak`;
}

function getStorageKey(){ return `${STORAGE_PREFIX}${activeDaily?.date || activeDaily?.weekday || 'today'}`; }
function getState(){ try{return JSON.parse(localStorage.getItem(getStorageKey())) || {completed:{},responses:{},vocab:{}};}catch{return {completed:{},responses:{},vocab:{}};} }
function setState(state){ localStorage.setItem(getStorageKey(), JSON.stringify(state)); }
function getGlobalState(){ try{return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}global`)) || {streak:0,lastComplete:null};}catch{return {streak:0,lastComplete:null};} }

function saveResponse(key, value){ const state = getState(); state.responses = state.responses || {}; state.responses[key]=value; setState(state); }
function saveAllResponses(){
  ['dailyResponse','q3Response','q5Response','q7Response','q9Response'].forEach(id => { if($(id)) saveResponse(id.replace('Response',''), $(id).value); });
  showToast('Progress saved');
}
function saveVocabState(){
  const state = getState(); state.vocab = {};
  document.querySelectorAll('.drop-zone').forEach((z,i)=> state.vocab[i] = z.dataset.choice || '');
  setState(state);
}
function loadSavedResponses(){
  const state = getState();
  const responses = state.responses || {};
  if(responses.dailyResponse) $('dailyResponse').value = responses.dailyResponse;
  [3,5,7,9].forEach(num => { const el = $(`q${num}Response`); const val = responses[`q${num}`]; if(el && val){ el.value = val; instantCheck(num); }});
  const vocab = state.vocab || {};
  Object.entries(vocab).forEach(([index,term]) => { const z = document.querySelectorAll('.drop-zone')[index]; if(z && term) placeTerm(z, term); });
}

function resetToday(){
  localStorage.removeItem(getStorageKey());
  showToast('Today reset');
  renderDaily();
}

async function copyStudentWork(){
  const lines = [];
  lines.push(`What's Happening in the US today?`);
  lines.push(activeDaily ? `${activeDaily.weekday || ''}: ${activeDaily.title}` : '');
  lines.push('');
  [3,5,7,9].forEach(num => lines.push(`Question ${num}:\n${$(`q${num}Response`)?.value || ''}\n`));
  lines.push(`AP Writing Response:\n${$('dailyResponse')?.value || ''}`);
  try{ await navigator.clipboard.writeText(lines.join('\n')); showToast('Copied work'); }
  catch{ showToast('Copy failed'); }
}

function showToast(message){
  const toast = $('toast'); if(!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1800);
}

function formatDate(iso){
  if(!iso) return '';
  const [y,m,d] = iso.split('-').map(Number);
  if(!y || !m || !d) return iso;
  return new Date(y,m-1,d).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'});
}

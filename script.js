let appData = null;
let activeDaily = null;

const fallbackData = null;

const els = {
  dailyCard: () => document.getElementById('dailyCard'),
  lessonFlow: () => document.getElementById('lessonFlow'),
  dailyTasks: () => document.getElementById('dailyTasks'),
  dailyResponse: () => document.getElementById('dailyResponse'),
  dailyFeedback: () => document.getElementById('dailyFeedback'),
  toast: () => document.getElementById('toast')
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('copyWorkBtn').addEventListener('click', copyStudentWork);
  document.getElementById('checkDailyBtn').addEventListener('click', checkDailyWork);
  document.getElementById('clearFeedbackBtn').addEventListener('click', () => clearFeedback(true));
  loadNews();
});

async function loadNews(){
  try{
    const response = await fetch('news.json', {cache:'no-store'});
    if(!response.ok) throw new Error('Could not load news.json');
    appData = await response.json();
  }catch(error){
    document.body.insertAdjacentHTML('afterbegin', `<div class="prompt-box" style="max-width:1180px;margin:12px auto;background:#fff8df"><strong>Teacher note:</strong> The site could not load <code>news.json</code>. This usually happens if you open the folder directly from your computer. Upload it to GitHub Pages or another web host to test the separated-file version.</div>`);
    appData = {weekTitle:'No news file loaded', days:[]};
  }
  renderDaily();
}

function getTodaysStory(){
  const days = appData.days || [];
  if(!days.length) return null;
  const today = new Date();
  const todayISO = today.toISOString().slice(0,10);
  const exact = days.find(day => day.date === todayISO);
  if(exact) return exact;

  // Monday-Friday rotation. Weekends show Monday's story by default.
  const jsDay = today.getDay();
  const index = jsDay === 0 || jsDay === 6 ? 0 : Math.min(jsDay - 1, days.length - 1);
  return days[index] || days[0];
}

function esc(value=''){
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function renderDaily(){
  activeDaily = getTodaysStory();
  if(!activeDaily){
    els.dailyCard().innerHTML = `<div class="hero-banner"><p class="eyebrow">No story loaded</p><h2>Add stories to news.json</h2></div><div class="hero-body"><p class="summary-text">Upload an updated news.json file to display this week's GovConnect Daily stories.</p></div>`;
    els.lessonFlow().innerHTML = '';
    els.dailyTasks().innerHTML = '';
    return;
  }

  els.dailyCard().innerHTML = `
    <div class="hero-banner">
      <p class="eyebrow">${esc(activeDaily.weekday || 'Today')} • ${esc(activeDaily.unit || appData.weekTitle || '')}</p>
      <h2>${esc(activeDaily.title)}</h2>
      <p class="meta">Source: <a class="source-link" href="${esc(activeDaily.link)}" target="_blank" rel="noopener">${esc(activeDaily.source)}</a> • ${esc(activeDaily.date)}</p>
    </div>
    <div class="hero-body">
      <div class="pillrow">
        <span class="pill">${esc(activeDaily.topic || 'Current Event')}</span>
        <span class="pill orange">Daily AP Gov Practice</span>
      </div>
      <h3>What happened?</h3>
      <p class="summary-text">${esc(activeDaily.summary)}</p>
      <div class="key-details">
        <div class="detail"><strong>Key people/groups</strong>${esc(activeDaily.keyPeople)}</div>
        <div class="detail"><strong>Core issue</strong>${esc(activeDaily.coreIssue)}</div>
      </div>
    </div>`;

  const visualSteps = (activeDaily.visualSteps || []).map((step, i, arr) => `<span class="flow-step">${esc(step)}</span>${i < arr.length - 1 ? '<span class="flow-arrow">→</span>' : ''}`).join('');
  const timeline = (activeDaily.timeline || []).map(item => `<li>${esc(item)}</li>`).join('');

  els.lessonFlow().innerHTML = `
    <section class="lesson-section">
      <p class="eyebrow">1. Key details only</p>
      <h3>News summary</h3>
      <p class="summary-text">${esc(activeDaily.summary)}</p>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">2. Sequence</p>
      <h3>How the event developed</h3>
      <div class="process-flow">${visualSteps}</div>
      <ol class="timeline">${timeline}</ol>
    </section>
    <section class="lesson-section">
      <p class="eyebrow">3. Vocabulary Match</p>
      <h3>Drag each AP Gov term to the article detail it best explains.</h3>
      ${renderVocabMatch(activeDaily)}
    </section>
    ${responseBox(3, activeDaily.questions?.q3 || 'What fact from the summary connects to AP Government?', 'Use one fact from the news summary...')}`;

  els.dailyTasks().innerHTML = `
    <div class="card">
      <p class="eyebrow">5. Explain</p>
      <h3>${esc(activeDaily.questions?.q5 || 'Which vocabulary term best fits the article?')}</h3>
      ${responseBox(5, null, 'Answer with a vocabulary term and one article detail...')}
    </div>
    <div class="card">
      <p class="eyebrow">6. Quick Check</p>
      <h3>${esc(activeDaily.mcq.question)}</h3>
      ${activeDaily.mcq.choices.map(choice => `<button class="mcq-choice" data-answer="${esc(activeDaily.mcq.answer)}">${esc(choice)}</button>`).join('')}
      <div id="mcqFeedback" class="small-note"></div>
    </div>
    <div class="card">
      <p class="eyebrow">7. AP Practice</p>
      <h3>${esc(activeDaily.questions?.q7 || 'Write a claim, evidence, and reasoning response that connects this event to Unit 1.')}</h3>
      ${responseBox(7, null, 'Claim + Evidence + Reasoning...')}
    </div>
    <div class="card">
      <p class="eyebrow">9. Extension</p>
      <h3>${esc(activeDaily.questions?.q9 || 'Connect this event to one foundational document, required case, or constitutional principle.')}</h3>
      ${responseBox(9, null, 'Extend your thinking with a case, document, or second constitutional principle...')}
    </div>`;

  document.querySelectorAll('.mcq-choice').forEach(button => button.addEventListener('click', () => checkMCQ(button)));
  clearFeedback(false);
  initVocabMatch();
}

function responseBox(num, promptText, placeholder){
  const prompt = promptText ? `<div class="prompt-box">${esc(promptText)}</div>` : '';
  return `
    ${prompt}
    <div class="response-block">
      <label class="sr-only" for="q${num}Response">Question ${num} response</label>
      <textarea id="q${num}Response" class="mini-response" placeholder="${esc(placeholder)}"></textarea>
      <div id="q${num}Feedback" class="mini-feedback hidden" aria-live="polite"></div>
    </div>`;
}

function shuffle(arr){
  return [...arr].sort(() => Math.random() - 0.5);
}

function renderVocabMatch(item){
  const pairs = item.vocabMatch || [];
  const terms = shuffle(pairs.map(pair => pair.term));
  return `<div class="vocab-match">
    <div class="term-bank">
      <strong>Terms</strong>
      <p class="small-note">Drag a term to a matching article detail.</p>
      ${terms.map(term => `<span class="term-chip" draggable="true" data-term="${esc(term)}">${esc(term)}</span>`).join('')}
    </div>
    <div class="drop-list">
      <strong>Article Details</strong>
      ${pairs.map(pair => `<div class="drop-zone" data-answer="${esc(pair.term)}"><span>${esc(pair.clue)}</span></div>`).join('')}
      <button id="checkVocabBtn" class="secondary-btn" style="margin-top:8px">Check Vocabulary Match</button>
      <div id="vocabFeedback" class="small-note" style="margin-top:8px"></div>
    </div>
  </div>`;
}

function initVocabMatch(){
  let dragged = null;
  document.querySelectorAll('.term-chip').forEach(chip => {
    chip.addEventListener('dragstart', event => {
      dragged = chip;
      event.dataTransfer.setData('text/plain', chip.dataset.term);
    });
  });
  document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', event => {event.preventDefault(); zone.classList.add('over');});
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', event => {
      event.preventDefault();
      zone.classList.remove('over');
      const term = event.dataTransfer.getData('text/plain') || (dragged && dragged.dataset.term);
      if(!term) return;
      zone.dataset.choice = term;
      zone.querySelector('.placed')?.remove();
      zone.insertAdjacentHTML('beforeend', `<div class="placed">${esc(term)}</div>`);
      if(dragged) dragged.style.opacity = '.35';
    });
  });
  document.getElementById('checkVocabBtn')?.addEventListener('click', checkVocabMatch);
  [3,5,7,9].forEach(num => {
    document.getElementById(`q${num}Response`)?.addEventListener('input', () => instantCheck(num));
  });
}

function checkVocabMatch(){
  let correct = 0;
  let total = 0;
  document.querySelectorAll('.drop-zone').forEach(zone => {
    total++;
    zone.classList.remove('correct','wrong');
    if(zone.dataset.choice === zone.dataset.answer){
      correct++;
      zone.classList.add('correct');
    }else{
      zone.classList.add('wrong');
    }
  });
  document.getElementById('vocabFeedback').innerHTML = `<strong>${correct}/${total} correct.</strong> ${correct === total ? 'Great job matching article evidence to vocabulary.' : 'Revise the red boxes by rereading the article detail and choosing the most precise term.'}`;
}

function checkMCQ(button){
  const answer = button.dataset.answer;
  document.querySelectorAll('.mcq-choice').forEach(choice => {
    choice.classList.remove('correct','wrong');
    if(choice.textContent === answer) choice.classList.add('correct');
  });
  if(button.textContent === answer){
    document.getElementById('mcqFeedback').innerHTML = '<strong>Correct.</strong> This is the best AP Gov connection.';
  }else{
    button.classList.add('wrong');
    document.getElementById('mcqFeedback').innerHTML = `<strong>Revise.</strong> The best answer is <strong>${esc(answer)}</strong>. Look back at the article details.`;
  }
}

function containsAny(text, terms){
  return terms.some(term => text.includes(String(term).toLowerCase()));
}

function sectionCriteria(num, text){
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const vocabTerms = (activeDaily.vocabMatch || []).map(pair => pair.term.toLowerCase());
  const commonTerms = ['federalism','separation of powers','checks and balances','judicial review','limited government','popular sovereignty','republicanism','constitution','federal','state','court','congress','president','executive order','war powers','mandate','natural rights'];
  const conceptTerms = [...vocabTerms, ...commonTerms];
  const hasConcept = containsAny(text, conceptTerms);
  const hasEvidence = containsAny(text, ['article','summary','event','judge','court','state','states','congress','president','senate','policy','order','resolution','program','voters','lawmakers','federal','officials']);
  const hasReasoning = containsAny(text, ['because','therefore','this shows','this illustrates','this matters','as a result','limits','checks','power','authority','constitutional','principle']);

  if(num === 3) return {needed:'Name a fact from the summary and explain what government power is involved.', checks:[words >= 15, hasEvidence, hasReasoning]};
  if(num === 5) return {needed:'Use one vocabulary term and one fact from the article.', checks:[words >= 18, hasConcept, hasEvidence]};
  if(num === 7) return {needed:'AP practice needs claim, evidence, and reasoning.', checks:[hasConcept, hasEvidence, hasReasoning, words >= 35]};
  return {needed:'Connect the event to a document, case, or second constitutional principle.', checks:[words >= 25, hasConcept, containsAny(text, ['federalist','brutus','declaration','constitution','marbury','mcculloch','lopez','article','amendment','case','document','principle'])]};
}

function instantCheck(num){
  const el = document.getElementById(`q${num}Response`);
  const box = document.getElementById(`q${num}Feedback`);
  if(!el || !box) return;
  const raw = el.value.trim();
  const text = raw.toLowerCase();
  box.classList.remove('hidden','good','revise','start');
  if(raw.length < 8){
    box.classList.add('start');
    box.innerHTML = '<strong>Start with a complete sentence.</strong><p class="small-note">Use a fact from the summary or a vocabulary term from the matching activity.</p>';
    return;
  }
  const result = sectionCriteria(num, text);
  const earned = result.checks.filter(Boolean).length;
  const total = result.checks.length;
  const strong = earned === total;
  box.classList.add(strong ? 'good' : 'revise');
  const next = strong ? 'Strong response. To make it more AP-ready, add a precise article detail or required document/case.' : `Revise by adding what is missing: ${result.needed}`;
  box.innerHTML = `<div class="score-row"><strong>Instant Check</strong><span class="score-badge">${earned}/${total}</span></div><p class="small-note">${next}</p>`;
}

function checkDailyWork(){
  const response = els.dailyResponse().value.trim();
  const text = response.toLowerCase();
  const box = els.dailyFeedback();
  box.classList.remove('good','revise');
  if(!response){
    box.classList.remove('hidden');
    box.classList.add('revise');
    box.innerHTML = `<strong>Start writing first.</strong><p class="small-note">Add at least a claim, one piece of evidence, and reasoning that explains the AP Government connection.</p>`;
    return;
  }

  const vocabTerms = (activeDaily.vocabMatch || []).map(pair => pair.term.toLowerCase());
  const conceptTerms = [...vocabTerms,'federalism','separation of powers','checks and balances','civil liberties','civil rights','judicial review','public opinion','political participation','congress','president','bureaucracy','court','constitution'];
  const scores = [
    {label:'Claim', earned: containsAny(text, ['because','this shows','this illustrates','this demonstrates','connects to','reflects','is an example of']) || response.split(/\s+/).length >= 18, yes:'You appear to make a defensible claim.', no:'Add a clear claim that names the AP Gov concept explaining the event.'},
    {label:'Evidence', earned: containsAny(text, ['the article','the event','according to','for example','evidence','lawmakers','court','state','federal','policy','summary']), yes:'You include a detail that can work as evidence.', no:'Add one specific detail from the news summary as evidence.'},
    {label:'Reasoning', earned: containsAny(text, ['therefore','this matters','as a result','this affects','this limits','this expands','constitutional system','democracy','representation','liberty','equality']) || response.split(/\s+/).length >= 45, yes:'You attempt to explain why the evidence matters.', no:'Explain how your evidence proves the claim, not just what happened.'},
    {label:'Course Accuracy', earned: containsAny(text, conceptTerms), yes:'You use vocabulary or course content connected to this topic.', no:'Use at least one course term from the matching activity or Unit 1.'},
    {label:'Current Event Connection', earned: containsAny(text, ['article','event','news','today','source','summary']) || containsAny(text, activeDaily.title.toLowerCase().split(/\W+/).filter(w => w.length > 5)), yes:'You connect your AP Gov idea to the current event.', no:'Make the connection to today\'s event more explicit.'}
  ];
  const earned = scores.filter(score => score.earned).length;
  const level = earned >= 5 ? 'AP Ready' : earned >= 3 ? 'Approaching AP Ready' : 'Developing';
  const next = scores.filter(score => !score.earned).map(score => `<li>${score.no}</li>`).join('') || '<li>Strong start. Add a required case, foundational document, or counterargument to make it more advanced.</li>';
  box.classList.remove('hidden');
  box.classList.add(earned >= 4 ? 'good' : 'revise');
  box.innerHTML = `<div class="score-row"><strong>Overall</strong><span class="score-badge">${earned}/5 • ${level}</span></div>${scores.map(score => `<div class="score-row"><span><strong>${score.label}</strong><br><span class="small-note">${score.earned ? score.yes : score.no}</span></span><span class="score-badge">${score.earned ? 'Yes' : 'Revise'}</span></div>`).join('')}<strong>Next revision move:</strong><ul class="feedback-list">${next}</ul><div class="prompt-box"><strong>Sentence frame:</strong> This event illustrates <em>_____</em> because _____. One piece of evidence is _____. This matters because _____.</div>`;
}

function clearFeedback(clearText=true){
  const box = els.dailyFeedback();
  box.classList.add('hidden');
  box.innerHTML = '';
  if(clearText) els.dailyResponse().value = '';
}

function copyStudentWork(){
  if(!activeDaily) return;
  const parts = [
    'GovConnect Daily Student Work',
    `Event: ${activeDaily.title}`,
    `Source: ${activeDaily.source}`,
    '',
    'Daily Response:',
    els.dailyResponse().value,
    '',
    'Question 3:',
    document.getElementById('q3Response')?.value || '',
    '',
    'Question 5:',
    document.getElementById('q5Response')?.value || '',
    '',
    'Question 7:',
    document.getElementById('q7Response')?.value || '',
    '',
    'Question 9:',
    document.getElementById('q9Response')?.value || ''
  ];
  navigator.clipboard.writeText(parts.join('\n')).then(showToast);
}

function showToast(){
  const toast = els.toast();
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1400);
}

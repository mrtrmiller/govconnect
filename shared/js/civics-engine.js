const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DEFAULT_DAY_INDEX = Math.min(Math.max(new Date().getDay() - 1, 0), 4);
const config = window.CIVICS_CONFIG || { activeWeek: "week01.json" };
let weekData = null;
let currentDay = DEFAULT_DAY_INDEX;
let selectedTerm = null;

function storageKey(day){ return `civics-daily-${config.activeWeek}-${day}`; }
function getProgress(day){ return JSON.parse(localStorage.getItem(storageKey(day)) || "{}"); }
function setProgress(day, patch){
  const current = getProgress(day);
  localStorage.setItem(storageKey(day), JSON.stringify({...current, ...patch}));
  renderProgress();
  renderTabs();
}
function isDone(day){
  const p = getProgress(day);
  return !!(p.vocab && p.choice && p.reflection);
}
function escapeHTML(str=""){
  return String(str).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function highlightVocab(text, vocab){
  let safe = escapeHTML(text);
  (vocab || []).forEach(v => {
    const term = escapeHTML(v.term);
    const re = new RegExp(`\\b(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
    safe = safe.replace(re, '<span class="vocab-highlight">$1</span>');
  });
  return safe;
}
async function loadWeek(){
  try{
    const res = await fetch(`news/${config.activeWeek}`, {cache:"no-store"});
    if(!res.ok) throw new Error(`Could not load ${config.activeWeek}`);
    weekData = await res.json();
    document.getElementById('weekTheme').textContent = weekData.theme || 'Civics Current Events';
    document.getElementById('weekDescription').textContent = weekData.description || 'One story each day connected to government and citizenship.';
    renderTabs();
    renderApp();
  }catch(err){
    document.getElementById('app').innerHTML = `<section class="card empty-state"><h2>News file not found</h2><p>Check <strong>civics-daily/config.js</strong> and make sure the active week file exists in <strong>civics-daily/news/</strong>.</p><p>${escapeHTML(err.message)}</p></section>`;
  }
}
function renderTabs(){
  const tabs = document.getElementById('dayTabs');
  tabs.innerHTML = DAYS.map((day,i)=>`<button class="day-tab ${i===currentDay?'active':''} ${isDone(day)?'done':''}" onclick="chooseDay(${i})">${day.slice(0,3)}</button>`).join('');
}
window.chooseDay = function(i){ currentDay = i; selectedTerm = null; renderTabs(); renderApp(); };
function dayData(){ return weekData.days.find(d => d.day === DAYS[currentDay]) || weekData.days[currentDay]; }
function renderApp(){
  const d = dayData();
  if(!d){ document.getElementById('app').innerHTML = '<section class="card empty-state"><h2>No story for this day yet.</h2></section>'; return; }
  document.getElementById('app').innerHTML = `
    <section>
      ${storyCard(d)}
      ${vocabCard(d)}
      ${choiceCard(d)}
      ${reflectionCard(d)}
      ${takeawayCard(d)}
    </section>
    <aside class="sidebar">
      ${progressCard()}
      ${connectionCard(d)}
    </aside>
  `;
  bindVocab(d);
  renderProgress();
};
function storyCard(d){
  const paragraphs = (d.summary || []).map(p=>`<p>${highlightVocab(p, d.vocabulary)}</p>`).join('');
  const facts = (d.quickFacts || []).map(f=>`<li>${escapeHTML(f)}</li>`).join('');
  const image = d.image ? `<img class="story-image" src="${escapeHTML(d.image)}" alt="${escapeHTML(d.imageAlt || d.headline)}" />` : '';
  return `<article class="card">
    <div class="section-label">${escapeHTML(d.day)}'s Story</div>
    <h2>${escapeHTML(d.headline)}</h2>
    <div class="meta-row"><span class="pill orange">${escapeHTML(d.focusIcon || '🏛')} ${escapeHTML(d.focus || 'Government')}</span><span class="pill">${escapeHTML(d.date || '')}</span></div>
    ${image}
    <h3>Quick Facts</h3><ul class="quick-facts">${facts}</ul>
    <h3>Today's Story</h3><div class="story-text">${paragraphs}</div>
  </article>`;
}
function vocabCard(d){
  const words = (d.vocabulary || []).map(v=>`<div class="term" draggable="true" data-term="${escapeHTML(v.term)}" tabindex="0" role="button">${escapeHTML(v.term)}</div>`).join('');
  const zones = (d.vocabulary || []).map(v=>`<div class="drop-zone" data-answer="${escapeHTML(v.term)}"><div class="definition">${escapeHTML(v.match)}</div><div class="placed"></div></div>`).join('');
  return `<section class="card"><div class="section-label">Question 1</div><h2>Vocabulary Sort</h2><p>Drag each word to the part of today's story it best matches. On phones, tap a word and then tap a box.</p><div class="activity-area"><div class="word-bank" id="wordBank">${words}</div><div class="drop-grid" id="dropGrid">${zones}</div></div><div class="btn-row"><button class="btn orange" onclick="checkVocab()">Check Vocabulary</button><button class="btn secondary" onclick="renderApp()">Reset</button></div><div id="vocabFeedback" class="feedback"></div></section>`;
}
function bindVocab(d){
  document.querySelectorAll('.term').forEach(term=>{
    term.addEventListener('dragstart', e=> e.dataTransfer.setData('text/plain', term.dataset.term));
    term.addEventListener('click', ()=>{
      document.querySelectorAll('.term').forEach(t=>t.classList.remove('selected'));
      selectedTerm = term.dataset.term; term.classList.add('selected');
    });
    term.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); term.click(); }});
  });
  document.querySelectorAll('.drop-zone').forEach(zone=>{
    zone.addEventListener('dragover', e=>{e.preventDefault(); zone.classList.add('dragover');});
    zone.addEventListener('dragleave', ()=> zone.classList.remove('dragover'));
    zone.addEventListener('drop', e=>{e.preventDefault(); zone.classList.remove('dragover'); placeTerm(zone, e.dataTransfer.getData('text/plain'));});
    zone.addEventListener('click', ()=>{ if(selectedTerm) placeTerm(zone, selectedTerm); });
  });
}
function placeTerm(zone, term){
  const already = document.querySelector(`.placed [data-placed="${CSS.escape(term)}"]`);
  if(already) already.remove();
  zone.querySelector('.placed').innerHTML = `<div class="term" data-placed="${escapeHTML(term)}">${escapeHTML(term)}</div>`;
  selectedTerm = null;
  document.querySelectorAll('.term').forEach(t=>t.classList.remove('selected'));
}
window.checkVocab = function(){
  let correct = 0, total = 0;
  document.querySelectorAll('.drop-zone').forEach(zone=>{
    total++;
    zone.classList.remove('correct','incorrect');
    const placed = zone.querySelector('[data-placed]')?.dataset.placed;
    if(placed === zone.dataset.answer){ correct++; zone.classList.add('correct'); }
    else zone.classList.add('incorrect');
  });
  const fb = document.getElementById('vocabFeedback');
  fb.className = `feedback show ${correct===total?'good':'try'}`;
  fb.textContent = correct===total ? 'Excellent! You matched the vocabulary to the civic ideas in the article.' : `You matched ${correct} out of ${total}. Fix the boxes marked in red and try again.`;
  if(correct===total) setProgress(dayData().day, {vocab:true});
};
function choiceCard(d){
  const q = d.question || {};
  const options = (q.options || []).map((o,i)=>`<button class="choice" onclick="answerChoice(${i})">${escapeHTML(o)}</button>`).join('');
  return `<section class="card"><div class="section-label">Question 2</div><h2>${escapeHTML(q.prompt || 'Check Your Understanding')}</h2><div id="choices">${options}</div><div id="choiceFeedback" class="feedback"></div></section>`;
}
window.answerChoice = function(i){
  const d = dayData(); const q = d.question;
  document.querySelectorAll('.choice').forEach((btn,idx)=>{
    btn.classList.toggle('correct', idx===q.answerIndex);
    btn.classList.toggle('incorrect', idx===i && idx!==q.answerIndex);
  });
  const fb = document.getElementById('choiceFeedback');
  fb.className = `feedback show ${i===q.answerIndex?'good':'try'}`;
  fb.textContent = i===q.answerIndex ? (q.correctFeedback || 'Correct!') : (q.incorrectFeedback || 'Good try. Review the article and try again.');
  if(i===q.answerIndex) setProgress(d.day, {choice:true});
};
function reflectionCard(d){
  const r = d.reflection || {};
  return `<section class="card"><div class="section-label">Question 3</div><h2>${escapeHTML(r.prompt || 'Why does this matter?')}</h2><textarea id="reflection" class="reflection-box" placeholder="Write 2–3 sentences..."></textarea><div class="btn-row"><button class="btn" onclick="checkReflection()">Get Feedback</button></div><div id="reflectionFeedback" class="feedback"></div></section>`;
}
window.checkReflection = function(){
  const d = dayData(); const r = d.reflection || {}; const text = document.getElementById('reflection').value.trim();
  const fb = document.getElementById('reflectionFeedback');
  const keywords = (r.keywords || []).map(k=>k.toLowerCase());
  const hits = keywords.filter(k => text.toLowerCase().includes(k)).length;
  if(text.length < 40){ fb.className='feedback show try'; fb.textContent = r.shortFeedback || 'Good start. Add one more sentence that explains who is affected and which part of government is involved.'; return; }
  fb.className = `feedback show ${hits>=1?'good':'try'}`;
  fb.textContent = hits>=1 ? (r.strongFeedback || 'Nice work. You connected the story to government and citizens.') : (r.coachingFeedback || 'Good writing. Try using one vocabulary word or naming the branch or level of government involved.');
  setProgress(d.day, {reflection:true});
};
function takeawayCard(d){
  return `<section class="card"><div class="section-label">Finish</div><h2>Today's Civic Takeaway</h2><div class="takeaway">${escapeHTML(d.takeaway || 'Government decisions affect people in real communities.')}</div></section>`;
}
function connectionCard(d){
  const all = ["Rights", "Voting", "Laws", "Economy", "Government Power", "Citizenship", "Federalism", "Public Policy"];
  const active = new Set(d.connections || []);
  return `<section class="card"><div class="section-label">Civic Connection</div><h3>Today's Story Connects To</h3><div class="connections">${all.map(c=>`<div class="connection ${active.has(c)?'on':''}">${active.has(c)?'☑':'☐'} ${escapeHTML(c)}</div>`).join('')}</div></section>`;
}
function progressCard(){
  return `<section class="card"><div class="section-label">Progress</div><h3>Week Tracker</h3><div class="progress-list" id="progressList"></div></section>`;
}
function renderProgress(){
  const box = document.getElementById('progressList');
  if(!box) return;
  box.innerHTML = DAYS.map(day=>`<div class="progress-item ${isDone(day)?'done':''}"><span>${day}</span><span>${isDone(day)?'Complete':'Not yet'}</span></div>`).join('');
}
loadWeek();

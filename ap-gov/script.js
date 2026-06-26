const $ = (id)=>document.getElementById(id);
const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function init(){
  try{
    const res = await fetch('news.json',{cache:'no-store'});
    if(!res.ok) throw new Error('Could not load ap-gov/news.json');
    const data = await res.json();
    render(data);
  }catch(e){ $('app').innerHTML=`<section class="card"><h2>News file not found</h2><p>${esc(e.message)}</p></section>`; }
}
function todayStory(data){
  const today = weekdays[new Date().getDay()];
  return (data.days||[]).find(d=>d.weekday===today) || (data.days||[])[0];
}
function render(data){
  const d = todayStory(data);
  $('weekTitle').textContent = data.weekTitle || 'AP Government Daily';
  $('weekSubtitle').textContent = data.weekSubtitle || 'Connect today’s story to AP Government concepts.';
  if(!d){ $('app').innerHTML='<section class="card"><h2>No story loaded.</h2></section>'; return; }
  const concepts = (d.concepts||[]).map(c=>`<div class="concept">${esc(c)}</div>`).join('');
  const qs = (d.questions||[]).map((q,i)=>`<div class="ap-question"><strong>Question ${i+1}</strong><p>${esc(q)}</p><textarea class="ap-response" placeholder="Write your response here..."></textarea><div class="feedback try show">Use a specific fact from the story and connect it to an AP Government concept.</div></div>`).join('');
  $('app').innerHTML=`<section>
    <article class="card"><div class="section-label">${esc(d.weekday||'Today')}'s Story</div><h2>${esc(d.title)}</h2><div class="meta-row"><span class="pill orange">${esc(d.unit||'AP Government')}</span><span class="pill">${esc(d.topic||'Current Event')}</span></div><p>${esc(d.summary)}</p>${d.link?`<a class="source-link" href="${esc(d.link)}" target="_blank" rel="noopener">Original source</a>`:''}</article>
    <article class="card"><div class="section-label">AP Concepts</div><h2>What ideas connect to this story?</h2><div class="concept-grid">${concepts}</div></article>
    <article class="card"><div class="section-label">Daily Practice</div><h2>Answer the questions</h2>${qs}<button class="btn orange" onclick="copyWork()">Copy My Work</button></article>
  </section>
  <aside class="sidebar"><section class="card"><div class="section-label">Writing Target</div><h2>Claim + Evidence + Reasoning</h2><div class="rubric"><div><strong>Claim:</strong> Name the AP Gov concept.</div><div><strong>Evidence:</strong> Use a fact from the story.</div><div><strong>Reasoning:</strong> Explain why the fact proves the concept.</div></div></section></aside>`;
}
async function copyWork(){
  const text=[...document.querySelectorAll('.ap-response')].map((t,i)=>`Question ${i+1}:\n${t.value}`).join('\n\n');
  try{await navigator.clipboard.writeText(text); alert('Copied.');}catch{alert('Copy did not work in this browser.');}
}
init();

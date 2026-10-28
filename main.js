(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const apiBase = ($('meta[name="ff-api-base"]')?.content || '').trim().replace(/\/$/, '');
  const nav = $('#nav');
  const menuButton = $('.menu-button');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => {
    nav?.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open');
  }));

  // Hero mode switch is a real toggle between a visual preview and an engineering preview.
  $$('.mode-button').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    $$('.mode-button').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    $$('[data-mode-view]').forEach(view => { view.hidden = view.dataset.modeView !== mode; });
  }));
  $('[data-preview-play]')?.addEventListener('click', e => {
    const b = e.currentTarget; const playing = b.classList.toggle('is-playing');
    b.setAttribute('aria-label', playing ? 'Pause visual preview animation' : 'Toggle preview playback');
    b.querySelector('span').textContent = playing ? 'Ⅱ' : '▶';
    const img = $('.cinema-frame img');
    if (img) { img.style.transform = playing ? 'scale(1.07)' : ''; img.style.filter = playing ? 'grayscale(35%) contrast(1.12)' : ''; }
  });

  const caseStudies = {
    cleanh:{category:'VISUAL MEDIA / CAMPAIGN',title:'Commercial storytelling',intro:'A campaign-shaped visual concept built to make a product story feel clear, considered and memorable.',problem:'The challenge is to move from a list of product features to a coherent story that an audience can recognise and remember.',execution:'Align message and audience first, then plan the visual direction, capture requirements, edit rhythm and final formats as one connected system.',deliverables:'Campaign direction, production plan, hero visual and adaptable social cut-downs.'},
    portrait:{category:'PHOTOGRAPHY / PORTRAIT',title:'People, in focus',intro:'A portrait-led visual study centred on expression, light and a consistent image language.',problem:'Create a portrait series that feels intentional and human while remaining consistent across a set of images.',execution:'Build a simple lighting and framing approach, direct with care, and apply a restrained finishing pass for consistency.',deliverables:'Edited portrait selects, web-ready exports and a clearly organised master archive.'},
    design:{category:'DESIGN / POST-PRODUCTION',title:'Shape the feeling',intro:'An exploration of how typography, image treatment and layout can give a visual idea a more distinct voice.',problem:'A collection of assets needs a stronger visual hierarchy and a more repeatable creative direction.',execution:'Establish visual rules, test them against different formats and refine the balance between expressive choices and everyday usability.',deliverables:'Art direction, sample layouts, image treatment and reusable visual guidelines.'},
    studio:{category:'PHOTOGRAPHY / STUDIO',title:'In the right light',intro:'A studio portrait direction focused on controlled light, strong framing and natural presence.',problem:'Create a polished portrait set without losing the character of the person in front of the lens.',execution:'Use a considered lighting setup and clear direction, then select and finish images with a consistent tonal approach.',deliverables:'Selected portrait set, high-resolution masters and compressed digital exports.'},
    direction:{category:'CREATIVE DIRECTION / CONCEPT',title:'Make a statement',intro:'A visual concept exploration designed to give a campaign or brand a sharper point of view.',problem:'The work needs a recognisable idea before production begins, so the final outputs feel connected rather than assembled.',execution:'Translate the brief into a core visual proposition, references, composition rules and a practical production route.',deliverables:'Creative concept, reference board, art-direction notes and production-ready visual guidance.'},
    systems:{category:'DIGITAL / PRODUCT THINKING',title:'Beyond the screen',intro:'A concept for a practical digital product where the interface, business rules and data model work as one.',problem:'Disjointed workflows create friction when users must move between information, tools and manual follow-up.',execution:'Map user journeys, define a clear interface system, separate application logic from persistence and design an API that can evolve.',deliverables:'Product scope, responsive UI, API contract, database schema and deployment notes.'}
  };
  const dialog = $('#case-dialog');
  $$('.project-card').forEach(card => card.addEventListener('click', () => {
    const item = caseStudies[card.dataset.project]; if (!item || !dialog) return;
    $('#case-category').textContent = item.category; $('#case-title').textContent = item.title;
    $('#case-intro').textContent = item.intro; $('#case-problem').textContent = item.problem;
    $('#case-execution').textContent = item.execution; $('#case-deliverables').textContent = item.deliverables;
    dialog.showModal();
  }));
  $('.dialog-close')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  $('#case-cta')?.addEventListener('click', () => dialog?.close());
  $$('.filter').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter').forEach(b => { const active = b === btn; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    $$('.project-card').forEach(card => { card.hidden = btn.dataset.filter !== 'all' && card.dataset.category !== btn.dataset.filter; });
  }));

  // Project estimator. Rates are editable planning assumptions, not published price promises.
  const tracks = {
    visual:{label:'VISUAL MEDIA',items:[['film','Film / campaign production',900000,4200000],['photo','Photography session',350000,1500000],['edit','Editing / motion package',400000,1800000],['brand','Creative direction',300000,1200000]]},
    software:{label:'SOFTWARE & WEB',items:[['site','Marketing website',1200000,4800000],['app','Web application / dashboard',2500000,9000000],['design','UX/UI design sprint',700000,2400000],['integrate','API / data integration',800000,3500000]]},
    hybrid:{label:'HYBRID OVERHAUL',items:[['strategy','Brand & product strategy',700000,2500000],['content','Visual content package',800000,3500000],['platform','Website / product build',1800000,6500000],['launch','Launch assets & handover',450000,1800000]]}
  };
  const state = {track:'visual',step:0,selected:['film','edit'],timeline:'standard',complexity:2};
  const formatUGX = n => 'UGX ' + Math.round(n/1000).toLocaleString('en-US') + 'k';
  const stepPanels = $$('.wizard-step');
  function renderDeliverables() {
    const list = $('#deliverables'); if (!list) return;
    list.innerHTML = '';
    tracks[state.track].items.forEach(([id,label,low,high]) => {
      const labelEl = document.createElement('label'); labelEl.className = 'deliverable-option';
      const input = document.createElement('input'); input.type = 'checkbox'; input.value = id; input.checked = state.selected.includes(id);
      input.addEventListener('change', () => { state.selected = input.checked ? [...state.selected,id] : state.selected.filter(x=>x!==id); renderEstimator(); });
      const title = document.createElement('b'); title.textContent = label;
      const cost = document.createElement('span'); cost.textContent = formatUGX(low) + '+';
      labelEl.append(input,title,cost); list.append(labelEl);
    });
  }
  function getEstimate() {
    const chosen = tracks[state.track].items.filter(item=>state.selected.includes(item[0]));
    const baseLow = chosen.reduce((sum,item)=>sum+item[2],0), baseHigh = chosen.reduce((sum,item)=>sum+item[3],0);
    const timelineMultiplier = ({standard:1,priority:1.25,rush:1.5})[state.timeline] || 1;
    const complexityMultiplier = .75 + state.complexity * .25;
    return {chosen,low:baseLow*timelineMultiplier*complexityMultiplier,high:baseHigh*timelineMultiplier*complexityMultiplier};
  }
  function renderEstimator() {
    const track = tracks[state.track]; const estimate = getEstimate();
    $('#live-track').textContent = track.label; $('#live-items').textContent = String(state.selected.length).padStart(2,'0');
    $('#wizard-step-label').textContent = 'STEP ' + String(state.step+1).padStart(2,'0') + ' / 04';
    $('#wizard-progress').style.width = ((state.step+1)*25)+'%';
    stepPanels.forEach((p,i)=>p.hidden=i!==state.step);
    $('#wizard-back').disabled = state.step===0;
    $('#wizard-next').hidden = state.step===3;
    $('#wizard-next').innerHTML = state.step===2 ? 'Calculate range <span>→</span>' : 'Continue <span>→</span>';
    $('#complexity-output').textContent = state.complexity+' / 5';
    if (state.step===3) {
      $('#estimate-total').textContent = estimate.chosen.length ? formatUGX(estimate.low)+' – '+formatUGX(estimate.high) : 'Scope needed';
      $('#estimate-timeline').textContent = ({standard:'Standard timeline',priority:'Priority timeline',rush:'Rush timeline'})[state.timeline]+' · '+state.complexity+'/5 complexity';
      const summary = $('#estimate-summary'); summary.innerHTML='';
      const rows = estimate.chosen.map(item=>item[1]).concat(['Timeline: '+state.timeline,'Complexity: '+state.complexity+'/5']);
      rows.forEach(text=>{const li=document.createElement('li');li.textContent=text;summary.append(li);});
      $('#form-estimate').value = estimate.chosen.length ? formatUGX(estimate.low)+' – '+formatUGX(estimate.high)+' (indicative)' : 'Scope to be confirmed';
    }
  }
  $$('[data-track-choice]').forEach(btn=>btn.addEventListener('click',()=>{
    state.track=btn.dataset.trackChoice;
    state.selected=tracks[state.track].items.slice(0,state.track==='visual'?2:state.track==='software'?2:3).map(i=>i[0]);
    $$('[data-track-choice]').forEach(b=>b.classList.toggle('selected',b===btn));renderDeliverables();renderEstimator();
  }));
  $('#wizard-next')?.addEventListener('click',()=>{
    if(state.step===1&&!state.selected.length){$('#deliverables')?.scrollIntoView({block:'center',behavior:'smooth'});return;}
    state.step=Math.min(3,state.step+1);renderEstimator();
  });
  $('#wizard-back')?.addEventListener('click',()=>{state.step=Math.max(0,state.step-1);renderEstimator();});
  $$('input[name="timeline"]').forEach(input=>input.addEventListener('change',()=>{state.timeline=input.value;renderEstimator();}));
  $('#complexity')?.addEventListener('input',e=>{state.complexity=Number(e.target.value);renderEstimator();});
  $('#estimate-to-contact')?.addEventListener('click',()=>{
    const estimate=getEstimate(); const summary=estimate.chosen.map(i=>i[1]).join(', ');
    const service=$('#project-form select[name="service"]');
    if(service) service.value=state.track==='visual'?'Visual media':state.track==='software'?'Software & web':'Hybrid overhaul';
    const brief=$('#project-form textarea[name="brief"]');
    if(brief) brief.value='I used the Focal Forge project scoper. Deliverables: '+(summary||'to be discussed')+'. Timeline: '+state.timeline+'. Complexity: '+state.complexity+'/5. Indicative range: '+(estimate.chosen.length?formatUGX(estimate.low)+' – '+formatUGX(estimate.high):'scope to be confirmed')+'. Please review the scope with me.';
    $('#contact')?.scrollIntoView({behavior:'smooth'});brief?.focus({preventScroll:true});refreshFallbacks();
  });
  renderDeliverables();renderEstimator();

  // Client portal is explicitly a local demo, not a client authentication system.
  $$('[data-portal-tab]').forEach(tab=>tab.addEventListener('click',()=>{
    $$('[data-portal-tab]').forEach(t=>{const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));});
    $$('[data-portal-panel]').forEach(p=>p.hidden=p.dataset.portalPanel!==tab.dataset.portalTab);
  }));
  const reviewCopy={direction:'Art direction / v02 — Sample review. Confirm the visual hierarchy, headline balance and image crop before sign-off.',wireframe:'Homepage wireframe — Sample review. Check the primary action, content order and mobile navigation before moving into build.'};
  $$('[data-proof]').forEach(btn=>btn.addEventListener('click',()=>{
    const note=$('#review-note'); note.innerHTML=''; const title=document.createElement('b');title.textContent='Reviewer notes';const p=document.createElement('p');p.textContent=reviewCopy[btn.dataset.proof]||'Sample review notes.';const approve=document.createElement('button');approve.className='proof-action';approve.textContent='Mark sample reviewed';approve.addEventListener('click',()=>{note.querySelector('p').textContent='Marked reviewed locally for this preview. No sign-off was stored.';approve.textContent='Reviewed locally';approve.disabled=true;});note.append(title,p,approve);
  }));
  $$('[data-vault]').forEach(btn=>btn.addEventListener('click',()=>{
    const note=$('#vault-note');const names={brief:'Project brief.pdf — demo metadata only; no file is stored in this preview.',invoice:'Invoice sample.pdf — demo metadata only; no financial document is stored in this preview.',source:'Source handover.zip — demo metadata only; no source archive is stored in this preview.'};
    note.querySelector('p').textContent=names[btn.dataset.vault]+' A production vault must use authenticated, expiring download URLs.';
  }));

  // Form: send to configured API; if unavailable, give the visitor honest email/WhatsApp alternatives.
  const form=$('#project-form');const status=$('#form-status');
  function formPayload(){const data=new FormData(form);return {name:String(data.get('name')||'').trim(),email:String(data.get('email')||'').trim(),service:String(data.get('service')||'').trim(),brief:String(data.get('brief')||'').trim(),estimate:String(data.get('estimate')||'').trim(),source:'focal-forge-website'};}
  function briefText(p){return ['Hello Focal Forge Studios,','','Name: '+p.name,'Email: '+p.email,'Track: '+p.service,'Estimate: '+(p.estimate||'Not provided'),'','Brief:',p.brief].join('\n');}
  function refreshFallbacks(){
    if(!form)return;const p=formPayload();const text=briefText(p);
    const subject=encodeURIComponent('Project enquiry — '+(p.name||'New lead')+' / '+(p.service||'Unspecified'));
    const body=encodeURIComponent(text);
    $('#email-fallback').href='mailto:focalforges@gmail.com?subject='+subject+'&body='+body;
    $('#whatsapp-fallback').href='https://wa.me/256708509413?text='+body;
  }
  form?.addEventListener('input',refreshFallbacks);form?.addEventListener('change',refreshFallbacks);
  form?.addEventListener('submit',async e=>{
    e.preventDefault();if(!form.reportValidity())return;
    const payload=formPayload();
    if(apiBase){
      const button=$('.submit-button');button.disabled=true;button.textContent='Sending enquiry…';
      try{
        const response=await fetch(apiBase+'/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const result=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(result.error||'Request failed');
        status.textContent='Enquiry received. Thank you — the studio has your project details.';form.reset();$('#form-estimate').value='';refreshFallbacks();
      }catch(err){status.textContent='The enquiry API could not be reached ('+err.message+'). Your brief is still ready to send using email or WhatsApp below.';}
      finally{button.disabled=false;button.innerHTML='Send project enquiry <span>↗</span>';}
    }else{
      status.textContent='No inquiry API is configured yet. Your brief is ready — choose email or WhatsApp below to send it directly.';
      refreshFallbacks();$('#email-fallback').focus();
    }
  });
  refreshFallbacks();

  // Portfolio content can be replaced by CMS/API data when an API base URL is configured.
  async function loadPortfolio(){
    if(!apiBase)return;
    try{
      const response=await fetch(apiBase+'/api/projects',{headers:{Accept:'application/json'}});
      if(!response.ok)return;
      const data=await response.json();
      if(!Array.isArray(data.projects)||!data.projects.length)return;
      // Existing editorial cards remain the graceful fallback. API-managed projects are
      // announced here until approved CMS records include an explicit, trusted image URL.
      document.documentElement.dataset.cms='connected';
      const note=$('.disclaimer');if(note)note.textContent='Portfolio API connected · '+data.projects.length+' published project record(s) available.';
    }catch(_){/* Keep the statically curated archive usable when API is offline. */}
  }
  loadPortfolio();
  $('#year').textContent=new Date().getFullYear();

  if('IntersectionObserver'in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const targets=$$('.capability,.project-card,.process-grid article');targets.forEach(el=>el.classList.add('reveal-ready'));
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}}),{threshold:.12});
    targets.forEach(el=>observer.observe(el));
  }
})();
(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');

  function closeMenu() {
    menuButton?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  }

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 720) closeMenu(); });

  // The two disciplines are separate visual experiences, not two cards in one grid.
  const worldTabs = [...document.querySelectorAll('[data-world]')];
  const worldPanels = [...document.querySelectorAll('[data-panel]')];
  function selectWorld(name, moveFocus = false) {
    worldTabs.forEach((tab, index) => {
      const active = tab.dataset.world === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && moveFocus) tab.focus();
    });
    worldPanels.forEach(panel => {
      const active = panel.dataset.panel === name;
      panel.hidden = !active;
      panel.classList.toggle('is-visible', active);
    });
  }
  worldTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectWorld(tab.dataset.world));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % worldTabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + worldTabs.length) % worldTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = worldTabs.length - 1;
      selectWorld(worldTabs[next].dataset.world, true);
    });
  });
  selectWorld('creative');

  // Portfolio filters keep the project archive usable without a page reload.
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const workItems = [...document.querySelectorAll('.work-item[data-category]')];
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    workItems.forEach(item => { item.hidden = filter !== 'all' && item.dataset.category !== filter; });
  }));

  // Deep links from services and projects can preselect a relevant enquiry type.
  const serviceSelect = document.querySelector('#project-form select[name="service"]');
  document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
    if (!serviceSelect) return;
    const desired = link.dataset.service.toLowerCase();
    const options = [...serviceSelect.options];
    const match = options.find(option => option.value.toLowerCase() === desired || option.textContent.trim().toLowerCase() === desired)
      || options.find(option => desired.includes('photo') && option.textContent.toLowerCase().includes('photography'))
      || options.find(option => desired.includes('brand') && option.textContent.toLowerCase().includes('brand'))
      || options.find(option => desired.includes('digital') && option.textContent.toLowerCase().includes('digital'))
      || options.find(option => desired.includes('visual') && option.textContent.toLowerCase().includes('visual'));
    if (match) serviceSelect.value = match.value;
  }));
  document.querySelectorAll('[data-world-link="digital"]').forEach(link => link.addEventListener('click', () => selectWorld('digital')));

  // Honest, dependency-free enquiry handoff. No false claim that a message was stored.
  const form = document.querySelector('#project-form');
  const status = document.querySelector('#form-status');
  const whatsappLink = document.querySelector('#whatsapp-submit');
  function buildBrief(values) {
    return [
      'Hello Focal Forge Studios,',
      '',
      'I would like to discuss a project.',
      '',
      'Name: ' + String(values.get('name') || '').trim(),
      'Email: ' + String(values.get('email') || '').trim(),
      'Area: ' + String(values.get('service') || '').trim(),
      '',
      'Project brief:',
      String(values.get('brief') || '').trim()
    ].join('\\n');
  }
  function refreshWhatsApp() {
    if (!form || !whatsappLink) return;
    const values = new FormData(form);
    whatsappLink.href = 'https://wa.me/256708509413?text=' + encodeURIComponent(buildBrief(values));
  }
  form?.addEventListener('input', refreshWhatsApp);
  form?.addEventListener('change', refreshWhatsApp);
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const name = String(values.get('name') || '').trim();
    const service = String(values.get('service') || '').trim();
    const subject = encodeURIComponent('Project enquiry — ' + name + ' / ' + service);
    const body = encodeURIComponent(buildBrief(values));
    if (status) status.textContent = 'Opening your email app with the project brief. If it does not open, use the WhatsApp option or email focalforges@gmail.com directly.';
    window.location.href = 'mailto:focalforges@gmail.com?subject=' + subject + '&body=' + body;
  });
  refreshWhatsApp();

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Small, respectful reveal treatment; content remains visible when motion is reduced.
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealTargets = document.querySelectorAll('.work-item,.studio-visual,.studio-copy,.method-steps article');
    revealTargets.forEach(element => element.classList.add('reveal-ready'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach(element => observer.observe(element));
  }


  // Subtle pointer-driven depth: keep motion restrained and disable it for touch/reduced-motion.
  const heroArt = document.querySelector('.opening-art');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroArt && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    heroArt.addEventListener('pointermove', event => {
      const rect = heroArt.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width - .5) * 2;
      const py = ((event.clientY - rect.top) / rect.height - .5) * 2;
      heroArt.style.setProperty('--px', px.toFixed(3));
      heroArt.style.setProperty('--py', py.toFixed(3));
    });
    heroArt.addEventListener('pointerleave', () => {
      heroArt.style.setProperty('--px', '0');
      heroArt.style.setProperty('--py', '0');
    });
  }

})();
(() => {
 const year = document.querySelector('#year');
 if (year) year.textContent = new Date().getFullYear();
 const menu = document.querySelector('.menu-toggle');
 const nav = document.querySelector('.site-nav');
 if (menu && nav) {
   menu.addEventListener('click', () => {
     const open = nav.classList.toggle('is-open');
     menu.setAttribute('aria-expanded', String(open));
     menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
   });
   nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
     nav.classList.remove('is-open'); menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','Open navigation');
   }));
   document.addEventListener('keydown', event => {
     if (event.key === 'Escape') { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','Open navigation'); }
   });
 }
 document.querySelectorAll('[data-filter]').forEach(button => {
   button.addEventListener('click', () => {
     const filter = button.dataset.filter;
     document.querySelectorAll('.work-filters [data-filter]').forEach(item => {
       const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active));
     });
     document.querySelectorAll('.project[data-category]').forEach(project => {
       project.hidden = filter !== 'all' && project.dataset.category !== filter;
     });
   });
 });
 document.querySelectorAll('[data-service]').forEach(link => {
   link.addEventListener('click', () => {
     const field = document.querySelector('[name="service"]');
     if (field && link.dataset.service) {
       const option = [...field.options].find(item => item.text.toLowerCase() === link.dataset.service.toLowerCase());
       if (option) field.value = option.value || option.text;
     }
   });
 });
 const form = document.querySelector('#project-form');
 const status = document.querySelector('#form-status');
 const whatsapp = document.querySelector('#whatsapp-submit');
 let draft = '';
 if (form) {
   form.addEventListener('input', () => {
     const data = new FormData(form);
     const name = data.get('name') || '';
     const email = data.get('email') || '';
     const service = data.get('service') || 'Not sure yet';
     const brief = data.get('brief') || '';
     draft = `Hello Focal Forge Studios,\n\nMy name is ${name}.\nEmail: ${email}\nProject: ${service}\n\nA little about it:\n${brief}\n\nSent from the Focal Forge Studios website.`;
     if (whatsapp) whatsapp.href = 'https://wa.me/256708509413?text=' + encodeURIComponent(draft);
   });
   form.addEventListener('submit', event => {
     event.preventDefault();
     if (!form.reportValidity()) return;
     const data = new FormData(form);
     const subject = encodeURIComponent('Project enquiry — ' + (data.get('service') || 'Focal Forge Studios'));
     const body = encodeURIComponent(`Hello Focal Forge Studios,\n\nMy name is ${data.get('name')}.\nEmail: ${data.get('email')}\nProject: ${data.get('service')}\n\nA little about it:\n${data.get('brief')}\n\nSent from the Focal Forge Studios website.`);
     if (status) status.textContent = 'Opening your email app with your project brief…';
     window.location.href = 'mailto:focalforges@gmail.com?subject=' + subject + '&body=' + body;
   });
 }
 const targets = document.querySelectorAll('.section-kicker,.intro-layout,.values-strip,.service-row,.project,.manifesto-main,.approach-grid>div,.contact-layout');
 if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
   const observer = new IntersectionObserver(entries => entries.forEach(entry => {
     if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
   }), {threshold:0.08});
   targets.forEach(element => { element.classList.add('reveal'); observer.observe(element); });
 }
})();
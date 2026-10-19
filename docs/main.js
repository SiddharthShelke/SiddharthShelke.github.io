function initPortfolio(scope, options = {}) {
  const one = selector => scope.querySelector(selector);
  const all = selector => Array.from(scope.querySelectorAll(selector));
  const page = scope === document ? document.body : scope;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [];
  const resolveLink = options.resolveLink || (href => href);
  const animateChange = element => {
    if (!motion.matches && typeof element.animate === 'function') {
      element.animate([{ opacity: .5, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out' });
    }
  };
  const viewer = one('#image-viewer');
  let trigger;
  if (viewer && typeof viewer.showModal === 'function') {
    const enlargedImage = one('#viewer-image');
    const caption = one('#viewer-caption');
    all('.snapshot-link').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault(); trigger = link;
        enlargedImage.src = link.href;
        enlargedImage.alt = link.querySelector('img').alt;
        caption.textContent = enlargedImage.alt;
        viewer.showModal(); page.classList.add('viewer-open');
      });
    });
    viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
    viewer.addEventListener('click', event => {
      const bounds = viewer.getBoundingClientRect();
      if (event.target === viewer && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) viewer.close();
    });
    viewer.addEventListener('close', () => { page.classList.remove('viewer-open'); if (trigger) trigger.focus(); });
  }
  const nav = one('.site-nav');
  if (nav) {
    const sections = all('[data-nav-section]');
    const progress = one('.reading-progress span');
    let scheduled = false;
    const updateScroll = () => {
      let current = sections[0];
      const headerBottom = one('.site-header').getBoundingClientRect().bottom + 24;
      sections.forEach(section => { if (section.getBoundingClientRect().top <= headerBottom) current = section; });
      if (current) nav.querySelectorAll('a').forEach(link => {
        if ((link.dataset.sectionTarget || link.hash) === '#' + current.dataset.navSection) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
      if (progress) {
        const first = sections[0].getBoundingClientRect().top;
        const last = sections[sections.length - 1].getBoundingClientRect().bottom;
        const distance = last - first - window.innerHeight + 80;
        progress.style.transform = `scaleX(${distance > 0 ? Math.max(0, Math.min(1, (80 - first) / distance)) : 0})`;
      }
      scheduled = false;
    };
    const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); } };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    cleanups.push(() => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); });
    all('details').forEach(details => details.addEventListener('toggle', schedule));
    updateScroll();
  }
  const proofLinks = one('.skill-proof-links');
  const relatedWork = [
    [['experience/ottobock.html','Ottobock →'],['experience/lear.html','Lear →'],['projects/big-mart-sales.html','Big Mart Sales Analytics ↗']],
    [['experience/lear.html','Lear reporting automation →'],['projects/smartphone-sales.html','Smartphone sales analysis ↗']],
    [['experience/lear.html#platform','Lear: Palantir Foundry →'],['projects/document-qa-rag.html','Document Q&A workflows ↗']],
    [['projects/predictive-maintenance.html','Predictive Maintenance ↗'],['projects/big-mart-sales.html','Big Mart regression ↗'],['projects/document-qa-rag.html','Document Q&A ↗']]
  ];
  all('.skill-select').forEach(button => button.addEventListener('click', () => {
    if (!proofLinks) return;
    all('.skill-select').forEach(peer => peer.setAttribute('aria-pressed', String(peer === button)));
    proofLinks.replaceChildren(...relatedWork[Number(button.dataset.skill)].map(([href,label]) => {
      const link = document.createElement('a'); link.href = resolveLink(href); link.textContent = label; return link;
    }));
    animateChange(proofLinks);
  }));
  const cards = all('.project-card');
  all('.filter-button').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    all('.filter-button').forEach(peer => peer.setAttribute('aria-pressed', String(peer === button)));
    let count = 0;
    cards.forEach(card => {
      card.hidden = filter !== 'all' && !card.dataset.categories.split(' ').includes(filter);
      if (!card.hidden) { count++; animateChange(card); }
    });
    const status = one('.filter-status');
    if (status) status.textContent = filter === 'all' ? `Showing all ${count} projects` : `Showing ${count} ${count === 1 ? 'project' : 'projects'} in ${button.textContent}`;
  }));
  // Visible by default; motion is a progressive enhancement.
  if (!motion.matches && 'IntersectionObserver' in window) {
    const targets = all('.section-heading, .projects-heading, .skill-group, .experience-entry, .project-card, .education-entry, .publication-entry, .certificate-entry');
    try {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }), { threshold: .06, rootMargin: '0px 0px -24px 0px' });
      cleanups.push(() => observer.disconnect());
      targets.forEach(target => { if (target.getBoundingClientRect().top > window.innerHeight) { observer.observe(target); target.classList.add('reveal-ready'); } });
      if (motion.addEventListener) {
        const reduce = event => { if (event.matches) { observer.disconnect(); targets.forEach(target => target.classList.remove('reveal-ready')); } };
        motion.addEventListener('change', reduce);
        cleanups.push(() => motion.removeEventListener('change', reduce));
      }
    } catch { targets.forEach(target => target.classList.remove('reveal-ready')); }
  }
  return () => cleanups.forEach(cleanup => cleanup());
}
initPortfolio(document);

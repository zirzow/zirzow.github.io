/* Remember the visitor's theme across all site pages. */(()=>{const root=document.documentElement;let saved;try{saved=localStorage.getItem('az-theme')}catch(e){};const media=matchMedia('(prefers-color-scheme: dark)');function apply(t){root.dataset.azTheme=t;document.querySelectorAll('.az-theme').forEach(b=>{b.textContent=t==='dark'?'Light mode':'Dark mode';b.setAttribute('aria-label',t==='dark'?'Switch to light mode':'Switch to dark mode')})}apply(saved==='light'||saved==='dark'?saved:'dark');document.querySelectorAll('.az-theme').forEach(b=>b.addEventListener('click',()=>{const t=root.dataset.azTheme==='dark'?'light':'dark';try{localStorage.setItem('az-theme',t)}catch(e){}apply(t)}));})();

/* Shared footer: retain fallback if the request fails, and update copyright year after loading. */
function updateCopyrightYear(scope = document) {
  scope.querySelectorAll('[data-current-year]').forEach(element => {
    element.textContent = new Date().getFullYear();
  });
}
updateCopyrightYear();
document.querySelectorAll('[data-shared-footer]').forEach(async host => {
  try {
    const response = await fetch(new URL('footer.html', document.baseURI), { cache: 'no-cache' });
    if (!response.ok) throw new Error('Footer unavailable');
    const template = document.createElement('template');
    template.innerHTML = await response.text();
    const footer = template.content.querySelector('footer.az-footer');
    if (!footer) throw new Error('Invalid footer');
    host.replaceChildren(footer);
    updateCopyrightYear(host);
  } catch (error) {
    updateCopyrightYear(host);
    console.warn('Using fallback footer:', error);
  }
});

/* One global decorative-animation control, next to the color theme toggle.
   Preferences persist across editorial pages. System reduced motion is honored. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = localStorage.getItem('az-motion') === 'paused'; } catch (_) {}
  const theme = document.querySelector('.az-header .az-theme');
  if (!theme) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'az-motion';
  theme.after(button);
  function render() {
    const effective = paused || reduced.matches;
    root.toggleAttribute('data-az-motion-paused', effective);
    button.textContent = effective ? 'Resume animations' : 'Pause animations';
    button.setAttribute('aria-pressed', String(effective));
    button.disabled = reduced.matches;
    button.title = reduced.matches ? 'Animations are disabled by your system reduced-motion setting.' : 'Control decorative website animations';
    if (reduced.matches) button.textContent = 'Animations off';
  }
  button.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('az-motion', paused ? 'paused' : 'playing'); } catch (_) {}
    render();
  });
  if (reduced.addEventListener) reduced.addEventListener('change', render);
  render();
})();

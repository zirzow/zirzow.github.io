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
    const response = await fetch(new URL('/footer.html', location.origin), { cache: 'no-cache' });
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

/* Load newsletter after shared footer insertion, including nested posts. */
(()=>{let pending;function setup(){document.querySelectorAll('[data-newsletter]:not([data-loaded])').forEach(async host=>{host.dataset.loaded='true';try{if(!document.querySelector('link[href="/blog.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/blog.css';document.head.append(css)}pending ||= Promise.all([fetch('/newsletter.html',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error();return r.text()}),fetch('/newsletter-config.json',{cache:'no-cache'}).then(r=>r.json())]);const [html,config]=await pending;host.innerHTML=html;const form=host.querySelector('form');form.elements.source.value=location.pathname;const jerseyRequested=location.pathname.endsWith('/subscribe.html')&&new URLSearchParams(location.search).get('interest')==='jersey'&&host.id==='signup';if(jerseyRequested){const pref=form.querySelector('input[name="interests"][value="Caloosa Riders jersey updates"]');if(pref)pref.checked=true;const heading=host.querySelector('h2');if(heading)heading.textContent='Be part of the jersey reveal.';const intro=host.querySelector('.journal-signup > p:not(.az-kicker)');if(intro)intro.textContent='Register your interest in the upcoming Caloosa Riders jersey. Your preference will be saved with your regular signup; you can change it before submitting.';form.elements.source.value=location.pathname+'?interest=jersey';}const endpoint=config.endpoint;if(typeof endpoint==='string'&&/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)){form.action=endpoint;form.querySelector('button').disabled=false;form.querySelector('[data-newsletter-status]').textContent='Your details will be saved privately. No automatic emails are sent.'}}catch(e){console.warn('Newsletter unavailable',e)}})}setup();new MutationObserver(setup).observe(document.body,{childList:true,subtree:true});const nav=document.querySelector('.az-header nav');if(nav&&!nav.querySelector('a[href="/blog.html"],a[href="blog.html"]')){const a=document.createElement('a');a.href='/blog.html';a.textContent='Field journal';nav.append(a)}})();
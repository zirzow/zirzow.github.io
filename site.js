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

/* Science disclosure navigation: one definition for all pages using site.js. */
(() => {
 const links=[['Science overview','/science.html'],['Shells & marine biology','/shells.html'],['Shell research · 3D morphometrics','/shell-morphometrics.html'],['Under the microscope','/science.html#watch'],['3D models','/models.html'],['Educational games','/games.html'],['Water quality research','/water-research.html']];
 const style=document.createElement('style');
 style.textContent='.az-science-menu{position:relative;display:inline-flex;align-items:stretch;max-width:100%}.az-science-toggle{font:600 15px/1.4 system-ui,sans-serif;color:var(--az-ink);background:transparent;border:0;border-radius:6px;padding:4px 8px;min-height:44px;cursor:pointer}.az-science-toggle:hover,.az-science-toggle[aria-expanded=true]{color:var(--az-nav-hover,var(--az-accent))}.az-science-toggle:focus-visible{outline:3px solid var(--az-accent);outline-offset:3px}.az-science-panel{position:absolute;top:100%;left:0;z-index:1000;width:min(300px,calc(100vw - 40px));background:var(--az-card);border:1px solid var(--az-edge);border-radius:12px;padding:8px;box-shadow:0 12px 30px #0005}.az-science-panel[hidden]{display:none!important}.az-header .az-nav nav .az-science-panel a{display:flex;width:100%;min-height:44px;padding:8px 12px;white-space:normal;line-height:1.35}.az-science-menu.is-current .az-science-toggle{color:var(--az-accent);text-decoration:underline;text-underline-offset:5px}@media(max-width:650px){.az-science-menu{flex-wrap:wrap}.az-science-panel{position:static;flex-basis:100%;box-shadow:none;width:100%}.az-science-menu:has(.az-science-panel:not([hidden])){flex-basis:100%}}';
 document.head.append(style);
 document.querySelectorAll('.az-header nav').forEach((nav,i)=>{
 const original=[...nav.querySelectorAll('a')].find(a=>new URL(a.href,location.href).pathname==='/science.html');
 if(!original||nav.querySelector('.az-science-menu'))return;
 const wrap=document.createElement('div');wrap.className='az-science-menu';
 const btn=document.createElement('button');btn.type='button';btn.className='az-science-toggle';btn.textContent='Science ▾';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls','az-science-panel-'+i);
 const panel=document.createElement('div');panel.className='az-science-panel';panel.id='az-science-panel-'+i;panel.hidden=true;
 for(const [label,href] of links){const a=document.createElement('a');a.href=href;a.textContent=label;if(location.pathname===href){a.setAttribute('aria-current','page');wrap.classList.add('is-current');}panel.append(a);}
 function open(value){panel.hidden=!value;btn.setAttribute('aria-expanded',String(value));}
 btn.addEventListener('click',()=>open(panel.hidden));
 wrap.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();open(false);btn.focus();}});
 wrap.addEventListener('focusout',e=>{if(e.relatedTarget&&!wrap.contains(e.relatedTarget))open(false);});
 document.addEventListener('click',e=>{if(!wrap.contains(e.target))open(false);});
 wrap.append(btn,panel);original.replaceWith(wrap);
 });
})();


/* Moderated comments: opt-in editorial pages, inert until owner deploys endpoint. */
(async()=>{
 const page=location.pathname;
 if(!/^\/(?:science|shells|shell-morphometrics|models|nature|diving|cycling|caloosa-riders|art|calusa-waterkeeper|calusa-waterkeeper-water-map|cwk-water-map|win-water-map|water-research|water-map|blog)\.html$/.test(page)&&!/^\/(?:blog|posts|field-notes|journal)\/[a-z0-9/_-]+(?:\.html|\/)?$/.test(page))return;
 const main=document.querySelector('main');if(!main)return;
 try{
 const config=await fetch('/comments-config.json',{cache:'no-store'}).then(r=>r.json());
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.endpoint||''))return;
 const section=document.createElement('section');section.className='az-wrap';section.id='community-comments';section.setAttribute('aria-label','Community comments');
 const iframe=document.createElement('iframe');iframe.title='Moderated community comments';iframe.loading='lazy';iframe.style.cssText='width:100%;height:780px;border:1px solid var(--az-edge,#888);border-radius:12px;background:var(--az-card,transparent)';
 const url=new URL(config.endpoint);url.searchParams.set('page',page);url.searchParams.set('theme',document.documentElement.dataset.azTheme==='light'?'light':'dark');iframe.src=url.href;
 section.append(iframe);main.append(section);
 }catch(e){console.warn('Community comments unavailable',e)}
})();

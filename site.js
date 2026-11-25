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

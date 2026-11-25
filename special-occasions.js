/* Reusable occasion insert loader. Edit special-occasion-settings.json to override.
   Dates use the visitor's local calendar. U.S. retail season defaults.
   Other cultural celebrations, birthdays and anniversaries are manual options. */
(() => {
  const host = document.querySelector('[data-occasion-host]');
  const valid = new Set(["general","xmas","black-friday","cyber-monday","new-year","valentines","easter","mothers-day","fathers-day","graduation","july4","back-to-school","halloween","thanksgiving","giving-tuesday","small-business-saturday","birthdays","anniversary","hanukkah","diwali","lunar-new-year","teacher-appreciation"]);
  function nthWeekday(y,m,d,n){const first=new Date(y,m,1);return new Date(y,m,1+(d-first.getDay()+7)%7+7*(n-1));}
  function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),p=h+l-7*m+114;return new Date(y,Math.floor(p/31)-1,p%31+1);}
  function shift(d,n){return new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);}
  function auto(now){
    const y=now.getFullYear(),today=new Date(y,now.getMonth(),now.getDate());
    const fixed=(m,d)=>new Date(y,m-1,d);
    const within=(a,b)=>today>=a&&today<=b;
    const thanksgiving=nthWeekday(y,10,4,4),bf=shift(thanksgiving,1),cyber=shift(thanksgiving,4),giving=shift(thanksgiving,5);
    // Narrow event windows win over longer seasonal shopping campaigns.
    if(within(giving,giving))return 'giving-tuesday';
    if(within(cyber,cyber))return 'cyber-monday';
    if(within(shift(bf,1),shift(bf,1)))return 'small-business-saturday';
    if(within(shift(bf,-3),shift(bf,2))&&today.getTime()!==thanksgiving.getTime())return 'black-friday';
    if(within(thanksgiving,thanksgiving)||within(shift(thanksgiving,-10),shift(thanksgiving,-4)))return 'thanksgiving';
    if(within(fixed(11,1),shift(thanksgiving,-11))||within(shift(giving,1),fixed(12,25)))return 'xmas';
    if(within(fixed(12,26),fixed(12,31))||within(fixed(1,1),fixed(1,7)))return 'new-year';
    if(within(fixed(2,1),fixed(2,14)))return 'valentines';
    const ep=easter(y);if(within(shift(ep,-14),ep))return 'easter';
    const mom=nthWeekday(y,4,0,2),dad=nthWeekday(y,5,0,3);
    if(within(shift(mom,-14),mom))return 'mothers-day';
    if(within(shift(dad,-14),dad))return 'fathers-day';
    if(within(fixed(5,12),fixed(6,30)))return 'graduation';
    if(within(fixed(7,1),fixed(7,4)))return 'july4';
    if(within(fixed(7,20),fixed(8,31)))return 'back-to-school';
    if(within(fixed(10,10),fixed(10,31)))return 'halloween';
    return 'general';
  }
  async function config(){try{const response=await fetch('special-occasion-settings.json',{cache:'no-cache'});if(response.ok)return await response.json();}catch(e){}return {mode:'auto'};}
  function enhanceMotion(){
    const card=host?.querySelector('.so-card');
    const icon=card?.querySelector('.so-icon');
    if(!card||!icon||card.querySelector('.so-motion-toggle'))return;
    for(const cls of ['so-particle-track','so-particle-track second','so-sparkle s1','so-sparkle s2','so-sparkle s3']){
      const el=document.createElement('span');el.className=cls;el.setAttribute('aria-hidden','true');
      if(cls.includes('sparkle'))el.textContent='✦';
      icon.appendChild(el);
    }
    const button=document.createElement('button');button.type='button';button.className='so-motion-toggle';button.textContent='Pause animation';button.setAttribute('aria-pressed','false');
    button.addEventListener('click',()=>{const paused=card.toggleAttribute('data-paused');button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Resume animation':'Pause animation';});
    card.querySelector('.so-copy').appendChild(button);card.classList.add('so-motion');
  }
  async function load(){
    if(!host)return;
    const settings=await config();
    if(settings.mode==='off'){host.hidden=true;return;}
    const id=settings.mode==='manual'&&valid.has(settings.manual)?settings.manual:auto(new Date());
    for(const candidate of [...new Set([id,'general'])]){
      try{
        const response=await fetch('special-occasion-'+candidate+'.html',{cache:'no-cache'});
        if(!response.ok)continue;
        const template=document.createElement('template');template.innerHTML=await response.text();
        const section=template.content.querySelector('section[data-occasion]');
        if(!section)continue;
        host.replaceChildren(section);enhanceMotion();return;
      }catch(e){}
    }
    // Existing fallback stays visible if a fetch fails.
    enhanceMotion();
  }
  load();
  // Reuse the same occasion metadata in the destination gift guide.
  const guide=document.querySelector('[data-occasion-guide]');
  if(guide){
    const id=new URLSearchParams(location.search).get('occasion');
    const meta={"general":{"emoji":"🎁","k":"The Curious Life gift guide","title":"Give the gift of curiosity.","desc":"Thoughtful gifts for curious minds, creative spirits and adventurous souls.","filter":"all"},"xmas":{"emoji":"🎄","k":"Christmas & winter holidays","title":"Make the season a little more wonderful.","desc":"Spark discovery, creativity and adventure with thoughtful holiday gifts.","filter":"all"},"black-friday":{"emoji":"✦","k":"Black Friday","title":"Find something worth giving.","desc":"Explore practical gift ideas and compare current prices before you buy.","filter":"all"},"cyber-monday":{"emoji":"💻","k":"Cyber Monday","title":"Curiosity meets technology.","desc":"Explore science tools, creative gear and digital adventures. Check current prices and offers.","filter":"science"},"new-year":{"emoji":"✨","k":"New Year","title":"Start a new adventure.","desc":"Make room for a new hobby, a fresh challenge or a shared experience.","filter":"experience"},"valentines":{"emoji":"💙","k":"Valentine’s Day","title":"Give an adventure for two.","desc":"Celebrate someone special with shared experiences, creative projects and thoughtful discoveries.","filter":"experience"},"easter":{"emoji":"🐣","k":"Easter & spring","title":"Fill a basket with discovery.","desc":"Inspire little explorers with nature journals, science activities and creative gifts.","filter":"kids"},"mothers-day":{"emoji":"🌷","k":"Mother’s Day","title":"Celebrate the ones who inspire us.","desc":"Find thoughtful ways to honor the people who encourage our curiosity and creativity.","filter":"all"},"fathers-day":{"emoji":"🚲","k":"Father’s Day","title":"Make memories together.","desc":"Discover gifts for outdoor explorers, cyclists, science lovers and creative dads.","filter":"all"},"graduation":{"emoji":"🎓","k":"Graduation season","title":"Celebrate the next chapter.","desc":"Encourage a new graduate to keep learning, exploring and creating.","filter":"all"},"july4":{"emoji":"🎆","k":"Fourth of July","title":"Celebrate the freedom to explore.","desc":"Enjoy summer adventures, outdoor discoveries and time together.","filter":"nature"},"back-to-school":{"emoji":"📚","k":"Back-to-school season","title":"Make learning an adventure.","desc":"Explore science tools, journals and creative supplies for a curious new school year.","filter":"kids"},"halloween":{"emoji":"🎃","k":"Halloween","title":"A little spooky. A lot curious.","desc":"Discover strange creatures, microscopic mysteries and imaginative activities.","filter":"science"},"thanksgiving":{"emoji":"🍂","k":"Thanksgiving","title":"Give thanks. Share wonder.","desc":"Celebrate the people and places that inspire you with meaningful gifts and shared experiences.","filter":"experience"},"giving-tuesday":{"emoji":"🌊","k":"Giving Tuesday","title":"Give back to what matters.","desc":"Help protect our waterways and support the work that makes discovery possible.","filter":"conservation"},"small-business-saturday":{"emoji":"🎨","k":"Small Business Saturday","title":"Celebrate independent creativity.","desc":"Explore original art, local experiences and thoughtful gifts from independent makers.","filter":"art"},"birthdays":{"emoji":"🎂","k":"Birthdays","title":"Celebrate another year of curiosity.","desc":"Find a gift that reflects what makes someone wonderfully unique.","filter":"all"},"anniversary":{"emoji":"💫","k":"Anniversaries","title":"Make another memory together.","desc":"Celebrate a milestone with an adventure, a creative project or an experience to share.","filter":"experience"},"hanukkah":{"emoji":"🕎","k":"Hanukkah","title":"Share the light of discovery.","desc":"Celebrate with thoughtful gifts, creative moments and time spent together.","filter":"all"},"diwali":{"emoji":"🪔","k":"Diwali","title":"Celebrate light and new possibilities.","desc":"Share thoughtful gifts that inspire creativity, learning and joyful experiences.","filter":"all"},"lunar-new-year":{"emoji":"🏮","k":"Lunar New Year","title":"Welcome a year of discovery.","desc":"Celebrate new beginnings with creative gifts and experiences to share.","filter":"all"},"teacher-appreciation":{"emoji":"🍎","k":"Teacher appreciation","title":"Celebrate the people who spark curiosity.","desc":"Find thoughtful science, art and nature-inspired gifts for educators.","filter":"all"}};
    const entry=Object.hasOwn(meta,id)?meta[id]:meta.general;
    guide.querySelector('.az-kicker').textContent=entry.k+' · The curious life';
    guide.querySelector('h1').textContent=entry.title;
    guide.querySelector('.az-lead').textContent=entry.desc;
    guide.querySelector('.gg-orbit').textContent=entry.emoji;
    const requested=new URLSearchParams(location.search).get('category')||entry.filter;
    const button=[...document.querySelectorAll('[data-filter]')].find(b=>b.dataset.filter===requested);
    if(button)button.click();
    if(id!=='xmas'){guide.querySelector('.gg-snow')?.setAttribute('hidden','');}
  }
})();

// THEME
const desktopTog = document.getElementById('tog');
const mobileTog = document.getElementById('mobileTog');
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const html = document.documentElement;
const saved = localStorage.getItem('theme');
if(saved) html.dataset.theme = saved;
const toggleTheme = () => {
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', html.dataset.theme);
};
[desktopTog, mobileTog].forEach(btn => btn?.addEventListener('click', toggleTheme));

const closeMobileMenu = () => {
  mobileMenu?.classList.remove('open');
  menuBtn?.classList.remove('open');
  menuBtn?.setAttribute('aria-expanded', 'false');
};
if(menuBtn && mobileMenu){
  menuBtn.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobileMenu));
  window.addEventListener('resize', () => {
    if(window.innerWidth > 900) closeMobileMenu();
  });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape') closeMobileMenu();
  });
}

// TYPEWRITER
const words = ['that scale.','that last.','that ship.','at 800ns.','without excuses.'];
let wi=0,ci=0,del=false;
const tw = document.getElementById('tw');
function typeLoop(){
  const w=words[wi];
  if(!del){ tw.textContent=w.slice(0,ci+1); ci++; if(ci===w.length){setTimeout(()=>{del=true;typeLoop()},1900);return;} setTimeout(typeLoop,68); }
  else { tw.textContent=w.slice(0,ci-1); ci--; if(ci===0){del=false;wi=(wi+1)%words.length;setTimeout(typeLoop,300);return;} setTimeout(typeLoop,36); }
}
setTimeout(typeLoop, 900);

// TERMINAL
const lines=[
  {t:'cmd',v:'whoami'},
  {t:'out',v:'Haikeys | Full-stack Developer'},
  {t:'cmd',v:'uptime'},
  {t:'out',v:'4 years, 2 months, 18 days'},
  {t:'cmd',v:'cat status.json'},
  {t:'kv',k:'available',v:'true',c:'tg'},
  {t:'kv',k:'focus',v:'"full stack + ai"'},
  {t:'kv',k:'commits',v:'41,293'},
  {t:'kv',k:'uptime_pct',v:'"99.97%"',c:'tg'},
  {t:'kv',k:'last_incident',v:'"none this quarter"',c:'tg'},
  {t:'cmd',v:'echo $READY'},
  {t:'outg',v:'> ready to build something hard'},
];
const tb=document.getElementById('tb'); let li=0;
function renderLine(){
  if(li>=lines.length) return;
  const l=lines[li++]; const d=document.createElement('div'); d.className='tal';
  if(l.t==='cmd') d.innerHTML=`<div class="trow"><span class="tp">\u276F</span><span class="tc">${l.v}</span></div>`;
  else if(l.t==='out') d.innerHTML=`<div class="to">${l.v}</div>`;
  else if(l.t==='outg') d.innerHTML=`<div class="to tg">${l.v}</div>`;
  else if(l.t==='kv') d.innerHTML=`<div class="to"><span class="tk">"${l.k}"</span>: <span class="${l.c||'tv'}">${l.v}</span></div>`;
  tb.appendChild(d); setTimeout(renderLine, l.t==='cmd'?200:80);
}
setTimeout(renderLine, 700);

// MARQUEE
const stack=['Full-stack','AI Integration','System Design','Frontend','Backend'];
const mq=document.getElementById('mq');
[...stack,...stack,...stack,...stack].forEach(s=>{ const sp=document.createElement('span'); sp.className='mqi'; sp.textContent=s; mq.appendChild(sp); });

// REVEALS
const ro=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('vis');ro.unobserve(x.target);}});},{threshold:0.07});
document.querySelectorAll('.rv').forEach(el=>ro.observe(el));

// SECTION STAGGERS
const staggerGroups = [
  { root: document.querySelector('#work'), items: '.pf, .pc' },
  { root: document.querySelector('#certificates'), items: '.ci' },
  { root: document.querySelector('#content'), items: '.wc' },
];
staggerGroups.forEach(group => {
  group.root?.querySelectorAll(group.items).forEach(item => item.classList.add('stagger-item'));
});
const staggerObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const group = staggerGroups.find(item => item.root === entry.target);
      group?.root.querySelectorAll(group.items).forEach((item, index) => {
        item.style.transitionDelay = `${index * 55}ms`;
        item.classList.add('in');
      });
      staggerObserver.unobserve(entry.target);
    }
  });
},{threshold:0.12});
staggerGroups.forEach(group => {
  if(group.root) staggerObserver.observe(group.root);
});

function initMobileCarousel(track){
  const shell = track.closest('.carousel-shell');
  if(!shell) return;

  const prev = shell.querySelector('[data-carousel-dir="prev"]');
  const next = shell.querySelector('[data-carousel-dir="next"]');

  const updateArrowState = () => {
    const mobile = window.innerWidth <= 900;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const atStart = !mobile || track.scrollLeft <= 4;
    const atEnd = !mobile || track.scrollLeft >= maxScroll - 4;

    prev?.classList.toggle('is-disabled', atStart);
    next?.classList.toggle('is-disabled', atEnd);
  };

  const getStep = () => {
    const firstCard = track.firstElementChild;
    if(!firstCard) return track.clientWidth * 0.9;

    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || 0);
    return firstCard.getBoundingClientRect().width + gap;
  };

  const scrollTrack = direction => {
    if(window.innerWidth > 900) return;
    track.scrollBy({ left: getStep() * direction, behavior: 'smooth' });
  };

  prev?.addEventListener('click', () => scrollTrack(-1));
  next?.addEventListener('click', () => scrollTrack(1));
  track.addEventListener('scroll', updateArrowState, { passive: true });
  window.addEventListener('resize', updateArrowState);

  updateArrowState();
}

document.querySelectorAll('.carousel-track').forEach(initMobileCarousel);

// SKILL BARS
const so=new IntersectionObserver(e=>{
  e.forEach(x=>{if(x.isIntersecting){
    x.target.querySelectorAll('.sfill').forEach((f,i)=>{ const p=parseFloat(f.dataset.f); setTimeout(()=>{f.style.transform=`scaleX(${p})`;},i*100); });
    so.unobserve(x.target);
  }});
},{threshold:0.2});
document.querySelectorAll('.ep').forEach(c=>so.observe(c));

// EXPERTISE TABS
document.querySelectorAll('.eni').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.eni').forEach(i=>i.classList.remove('active'));
    document.querySelectorAll('.ep').forEach(p=>p.classList.remove('active'));
    item.classList.add('active');
    const panel=document.getElementById(item.dataset.p);
    panel.classList.add('active');
    panel.querySelectorAll('.sfill').forEach((f,i)=>{
      f.style.transform='scaleX(0)';
      setTimeout(()=>{f.style.transform=`scaleX(${parseFloat(f.dataset.f)})`;},50+i*100);
    });
  });
});

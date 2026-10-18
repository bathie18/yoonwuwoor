/* Yoon Wu Wóor — éléments communs (en-tête, pied de page, utilitaires) */
const YWW = (() => {
  const I = {
    quiz:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    carto:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
    photo:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/></svg>',
    glo:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 21.5"/><path d="M8 7h8M8 11h6"/></svg>',
    stats:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/></svg>',
    dataviz:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><path d="M9 10l2 2 4-4"/></svg>',
    map:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    chevron:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>',
    moon:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>',
    prev:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/></svg>',
    circuit:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6 8l5 8M18 8l-5 8"/></svg>',
    burger:'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };
  const logo = `<svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="#1c222c" stroke="#f5b700" stroke-width="3"/>
    <path d="M17 41 L22.5 9 h3 L31 41z" fill="#3a4352"/>
    <path d="M24 12v4M24 20v5M24 29v6" stroke="#f5b700" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M14.5 38.5 20.6 11" stroke="#00853f" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M33.5 38.5 27.4 11" stroke="#e31b23" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
  const outils = [
    ['quiz.html','quiz','Quiz','Testez vos réflexes et le code de la route'],
    ['cartotheque.html','carto','Cartothèque','Cartes thématiques prêtes à télécharger'],
    ['phototheque.html','photo','Photothèque','Images des campagnes et du terrain'],
    ['glossaire.html','glo','Glossaire','Les définitions de la sécurité routière'],
    ['statistiques.html','stats','Statistiques & indicateurs','Bilans annuels, causes, usagers, axes'],
    ['dataviz.html','dataviz','Dataviz des territoires','Régions, départements et communes'],
    ['demarches.html','prev','Prévention et démarches','Bons gestes, permis, carte grise, amendes'],
    ['demarches.html#circuit','circuit','Traitement des signalements','Qui réceptionne, valide, traite et clôture']
  ];
  function header(active){
    const cur = p => p===active ? ' aria-current="page"' : '';
    return `<div class="topbar"><div class="wrap"><span><span class="flag"><i></i><i></i><i></i></span>République du Sénégal — Ministère en charge des Transports terrestres</span><span class="demo">Prototype de démonstration</span></div></div>
    <header class="site-head"><div class="wrap">
      <a class="brand" href="index.html">${logo}<span class="brand-txt"><b>Yoon Wu Wóor</b><small>Observatoire national de la sécurité routière</small></span></a>
      <button class="burger" aria-label="Ouvrir le menu" aria-expanded="false">${I.burger}</button>
      <nav class="nav" aria-label="Navigation principale">
        <a href="index.html"${cur('index')}>Accueil</a>
        <a href="statistiques.html"${cur('stats')}>Chiffres clés</a>
        <a href="carte.html"${cur('carte')}>Carte</a>
        <a href="dataviz.html"${cur('dataviz')}>Dataviz</a>
        <div class="dd"><button aria-expanded="false" aria-haspopup="true"${active==='outil'?' style="box-shadow:inset 0 -3px 0 #f5b700"':''}>Boîte à outils ${I.chevron}</button>
          <div class="dd-menu">${outils.map(o=>`<a href="${o[0]}"><span class="ic">${I[o[1]]}</span><span><b>${o[2]}</b><small>${o[3]}</small></span></a>`).join('')}</div>
        </div>
        <a href="demarches.html"${cur('prev')}>Prévention &amp; démarches</a>
        <button class="theme-btn" aria-label="Changer de thème" title="Thème clair / sombre">${I.moon}</button>
      </nav>
    </div></header>`;
  }
  function footer(){
    return `<div class="road"></div><footer class="site-foot"><div class="wrap">
      <div class="cols">
        <div><a class="brand" href="index.html" style="margin-bottom:14px">${logo}<span class="brand-txt"><b>Yoon Wu Wóor</b><small>« La route sûre »</small></span></a>
          <p>Plateforme de référence des données de sécurité routière au Sénégal : observer, comprendre, agir. Chaque trajet compte.</p></div>
        <div><h4>Observatoire</h4><a href="statistiques.html">Chiffres clés</a><a href="dataviz.html">Dataviz des territoires</a><a href="carte.html">Carte interactive</a><a href="index.html#apropos">À propos</a></div>
        <div><h4>Boîte à outils</h4>${outils.slice(0,4).map(o=>`<a href="${o[0]}">${o[2]}</a>`).join('')}<a href="demarches.html">Prévention et démarches</a></div>
        <div><h4>Partenaires</h4><a href="index.html#acteurs">ANASER</a><a href="index.html#acteurs">CETUD</a><a href="index.html#acteurs">AGEROUTE</a><a href="index.html#acteurs">Forces de défense et de sécurité</a></div>
      </div>
      <div class="bottom"><span>Prototype conçu par CEGIT — Centre d'Expertise en Géomatique et Ingénierie Territoriale · cegitgroup.com</span><span>Données nationales 2025 : ANASER. Données infranationales et points d'intérêt : simulés pour la démonstration. Limites administratives : GADM via mapSenegal.</span></div>
    </div></footer>`;
  }
  function theme(){
    let t=null; try{t=localStorage.getItem('yww-theme')}catch(e){}
    if(t) document.documentElement.dataset.theme=t;
  }
  theme();
  function mount(active){
    document.body.insertAdjacentHTML('afterbegin', header(active));
    document.body.insertAdjacentHTML('beforeend', footer());
    const nav=document.querySelector('.nav'), bur=document.querySelector('.burger');
    bur.addEventListener('click',()=>{const o=nav.classList.toggle('open');bur.setAttribute('aria-expanded',o)});
    const dd=document.querySelector('.dd'), ddb=dd.querySelector('button');
    ddb.addEventListener('click',e=>{e.stopPropagation();const o=dd.classList.toggle('open');ddb.setAttribute('aria-expanded',o)});
    document.addEventListener('click',e=>{if(!dd.contains(e.target)){dd.classList.remove('open');ddb.setAttribute('aria-expanded',false)}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){dd.classList.remove('open')}});
    document.querySelector('.theme-btn').addEventListener('click',()=>{
      const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      const n = dark?'light':'dark'; document.documentElement.dataset.theme=n;
      try{localStorage.setItem('yww-theme',n)}catch(e){}
      document.dispatchEvent(new CustomEvent('themechange'));
    });
  }
  const nf=new Intl.NumberFormat('fr-FR');
  const fmt=v=>v==null||isNaN(v)?'–':nf.format(Math.round(v));
  const fmt1=v=>v==null||isNaN(v)?'–':new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(v);
  const cache={};
  const json=u=>cache[u]||(cache[u]=fetch(u).then(r=>r.json()));
  const isDark=()=>document.documentElement.dataset.theme? document.documentElement.dataset.theme==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  return {mount,fmt,fmt1,json,I,isDark};
})();

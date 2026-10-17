/* Yoon Wu Wóor — utilitaires cartographiques partagés (fonds de plan, étiquettes) */
const YMap = (() => {
  const BASES = {
    osm: { label: 'OpenStreetMap', make: () => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© contributeurs OpenStreetMap', maxZoom: 19 }) },
    aerien: { label: 'Vue aérienne', make: () => L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Imagerie © Esri, Maxar, Earthstar Geographics', maxZoom: 19 }) },
    blanc: { label: 'Sans fond (blanc)', make: () => null }
  };
  /* Contrôle de fond de plan : boutons segmentés en haut à droite */
  function basemaps(map, initial = 'osm', onChange, position = 'topright') {
    let cur = null, key = null;
    const set = k => {
      if (cur) map.removeLayer(cur);
      cur = BASES[k].make(); key = k;
      if (cur) cur.addTo(map).bringToBack();
      map.getContainer().classList.toggle('map-blanc', k === 'blanc');
      map.getContainer().classList.toggle('map-aerien', k === 'aerien');
      ctl.getContainer().querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
      onChange && onChange(k);
    };
    const ctl = L.control({ position });
    ctl.onAdd = () => {
      const d = L.DomUtil.create('div', 'basemap-ctl');
      d.innerHTML = '<span>Fond</span>' + Object.entries(BASES).map(([k, v]) => `<button type="button" data-k="${k}" aria-pressed="false" title="${v.label}">${k === 'osm' ? 'OSM' : k === 'aerien' ? 'Aérien' : 'Blanc'}</button>`).join('');
      L.DomEvent.disableClickPropagation(d);
      d.querySelectorAll('button').forEach(b => b.addEventListener('click', () => set(b.dataset.k)));
      return d;
    };
    ctl.addTo(map);
    set(initial);
    return { set, get: () => key };
  }
  /* Étiquettes administratives selon l'échelle */
  function labels(map, data, opts = {}) {
    const R = { r: [0, 8.4], d: [8.5, 10.4], c: [10.5, 22], ...(opts.ranges || {}) };
    const groups = { r: L.layerGroup(), d: L.layerGroup(), c: L.layerGroup() };
    data.forEach(([lvl, name, lat, lon]) => {
      groups[lvl].addLayer(L.marker([lat, lon], { interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'lbl lbl-' + lvl, html: `<span>${name}</span>`, iconSize: null }) }));
    });
    let on = opts.on !== false;
    const upd = () => {
      const z = map.getZoom();
      Object.entries(groups).forEach(([k, g]) => {
        const vis = on && z >= R[k][0] && z <= R[k][1];
        if (vis && !map.hasLayer(g)) g.addTo(map);
        if (!vis && map.hasLayer(g)) map.removeLayer(g);
      });
    };
    /* masque les étiquettes qui se chevauchent (priorité : régions > départements > communes) */
    const declutter = () => {
      const placed = [];
      ['r', 'd', 'c'].forEach(k => { if (!map.hasLayer(groups[k])) return;
        groups[k].eachLayer(mk => { const el = mk.getElement(); if (!el) return; const s = el.firstElementChild; s.style.visibility = '';
          const r = s.getBoundingClientRect(); if (!r.width) return;
          const hit = placed.some(p => !(r.right + 4 < p.left || r.left - 4 > p.right || r.bottom + 2 < p.top || r.top - 2 > p.bottom));
          if (hit) s.style.visibility = 'hidden'; else placed.push(r); }); });
    };
    map.on('zoomend', () => { upd(); setTimeout(declutter, 30); }); map.on('moveend', () => setTimeout(declutter, 30));
    upd(); setTimeout(declutter, 60);
    return { toggle: v => { on = v; upd(); setTimeout(declutter, 30); } };
  }
  return { basemaps, labels };
})();

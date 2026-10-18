/* Yoon Wu Wóor — rapport PDF « Sécurité routière et accidentologie » pour un territoire.
   Dépend de jsPDF (window.jspdf) et de YWW (common.js). */
const YReport = (() => {
  const C = { asph: [18, 22, 29], jaune: [245, 183, 0], rouge: [227, 27, 35], vert: [0, 133, 63], gris: [83, 90, 102], clair: [239, 236, 229], bord: [220, 215, 204] };
  const TYPE_COL = { 'VL/VL': '#2b6cb0', 'VL/PL': '#7b3fbf', 'VL/TC': '#00853f', 'VL/2RM': '#ff7a00', '2RM': '#f5b700', 'PIETON': '#e31b23', 'SEUL': '#12161d', 'PL/TC': '#8c0e14', 'HIPPO': '#8b5e34', 'VELO': '#14b8a6' };
  const nf = v => v == null || isNaN(v) ? '-' : new Intl.NumberFormat('fr-FR').format(Math.round(v)).replace(/ | /g, ' ');
  const nf1 = v => v == null || isNaN(v) ? '-' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v).replace(/ | /g, ' ');
  const LVL = { region: 'Région', departement: 'Département', commune: 'Commune' };
  const KEY = { region: 'GID_1', departement: 'GID_2', commune: 'GID_4' };
  const FILE = { region: 'regions', departement: 'departements', commune: 'communes' };

  async function load() {
    const [st, reg, dep, com, acc, pts, rou] = await Promise.all([
      YWW.json('data/stats.json'), YWW.json('data/regions.geojson'), YWW.json('data/departements.geojson'),
      YWW.json('data/communes.geojson'), YWW.json('data/accidents.json'), YWW.json('data/points.geojson'), YWW.json('data/routes.geojson')]);
    return { st, geo: { region: reg, departement: dep, commune: com }, acc, pts, rou };
  }

  /* Carte du territoire dessinée sur un canvas (indépendante des tuiles) */
  function mapImage(D, level, ft, accRows) {
    const W = 900, H = 640, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    const rings = geom => (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates).flat();
    let b = [180, 90, -180, -90];
    rings(ft.geometry).forEach(r => r.forEach(([x, y]) => { b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; }));
    const padx = (b[2] - b[0]) * .12 + .01, pady = (b[3] - b[1]) * .12 + .01; b = [b[0] - padx, b[1] - pady, b[2] + padx, b[3] + pady];
    const kx = Math.cos((b[1] + b[3]) / 2 * Math.PI / 180), k = Math.min(W / ((b[2] - b[0]) * kx), H / (b[3] - b[1]));
    const ox = (W - (b[2] - b[0]) * kx * k) / 2, oy = (H - (b[3] - b[1]) * k) / 2;
    const px = (x, y) => [ox + (x - b[0]) * kx * k, oy + (b[3] - y) * k];
    const draw = (geom, fill, stroke, lw) => { g.beginPath(); rings(geom).forEach(r => r.forEach(([x, y], i) => { const [a, c] = px(x, y); i ? g.lineTo(a, c) : g.moveTo(a, c); })); if (fill) { g.fillStyle = fill; g.fill('evenodd'); } g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); };
    // contexte : entités du niveau inférieur ou de même niveau
    const ctx = level === 'region' ? D.geo.departement : level === 'departement' ? D.geo.commune : D.geo.commune;
    ctx.features.forEach(f => draw(f.geometry, '#f4f1ea', '#d9d2c3', 1));
    draw(ft.geometry, 'rgba(245,183,0,.16)', '#12161d', 3);
    // routes
    D.rou.features.filter(f => f.properties.type !== 'RD').forEach(f => { const ls = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
      const T = f.properties.type; g.strokeStyle = T === 'AUTOROUTE' ? '#7b3fbf' : T === 'RN' ? '#e0a400' : '#f26b2b'; g.lineWidth = T === 'AUTOROUTE' ? 4 : T === 'RN' ? 3 : 1.6; g.setLineDash(f.properties.revet === 'Non bitumée' ? [8, 6] : []);
      ls.forEach(l => { g.beginPath(); l.forEach(([x, y], i) => { const [a, c] = px(x, y); i ? g.lineTo(a, c) : g.moveTo(a, c); }); g.stroke(); }); }); g.setLineDash([]);
    // accidents
    accRows.forEach(r => { const [a, c] = px(r[4], r[3]); g.beginPath(); g.arc(a, c, r[6] === 'M' ? 7 : 5, 0, 7); g.fillStyle = r[6] === 'M' ? '#e31b23' : r[6] === 'G' ? '#ff7a00' : '#f5b700'; g.globalAlpha = .85; g.fill(); g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.stroke(); });
    return cv.toDataURL('image/png');
  }
  /* Graphique d'évolution dessiné sur canvas */
  function evoImage(years, acc, tues) {
    const W = 900, H = 380, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.font = '22px Helvetica, Arial'; g.fillStyle = '#535a66';
    const L = 70, R = 70, T = 30, B = 50, cw = W - L - R, ch = H - T - B;
    const ma = Math.max(...acc) * 1.15 || 1, mt = Math.max(...tues) * 1.25 || 1;
    for (let i = 0; i <= 4; i++) { const y = T + ch - ch * i / 4; g.strokeStyle = '#e6e2d8'; g.beginPath(); g.moveTo(L, y); g.lineTo(W - R, y); g.stroke(); g.textAlign = 'right'; g.fillText(nf(ma * i / 4), L - 8, y + 7); g.textAlign = 'left'; g.fillText(nf(mt * i / 4), W - R + 8, y + 7); }
    const bw = cw / years.length;
    years.forEach((y, i) => { const h = ch * acc[i] / ma; g.fillStyle = '#f5b700'; g.fillRect(L + i * bw + bw * .2, T + ch - h, bw * .6, h); g.fillStyle = '#535a66'; g.textAlign = 'center'; g.fillText(y, L + i * bw + bw / 2, H - 16); });
    g.strokeStyle = '#e31b23'; g.lineWidth = 4; g.beginPath(); years.forEach((y, i) => { const x = L + i * bw + bw / 2, yy = T + ch - ch * tues[i] / mt; i ? g.lineTo(x, yy) : g.moveTo(x, yy); }); g.stroke();
    years.forEach((y, i) => { const x = L + i * bw + bw / 2, yy = T + ch - ch * tues[i] / mt; g.fillStyle = '#e31b23'; g.beginPath(); g.arc(x, yy, 7, 0, 7); g.fill(); });
    return cv.toDataURL('image/png');
  }

  async function build(level, id, year = 2025) {
    if (!window.jspdf) { alert("Le module PDF n'a pas pu être chargé."); return; }
    const D = await load(), st = D.st;
    const ft = D.geo[level].features.find(f => f.properties[KEY[level]] === id); if (!ft) return;
    const name = ft.properties.NAME;
    const depName = {}; D.geo.departement.features.forEach(f => depName[f.properties.GID_2] = f.properties.NAME);
    const regName = {}; D.geo.region.features.forEach(f => regName[f.properties.GID_1] = f.properties.NAME);
    const parent = level === 'region' ? '' : level === 'departement' ? 'Région de ' + regName[ft.properties.GID_1] : 'Département de ' + depName[ft.properties.GID_2] + ' - Région de ' + regName[ft.properties.GID_1];
    const S = st[level][id], pop = st.population[level][id];
    const years = st.meta.annees, cur = S[year], prev = S[year - 1];
    const natPop = Object.values(st.population.region).reduce((a, b) => a + b, 0);
    const taux = cur.tues / pop * 1e5, natT = st.national[year].tues / natPop * 1e5;
    const grav = cur.tues / cur.acc * 100, natG = st.national[year].tues / st.national[year].acc * 100;
    // échantillon d'accidents géolocalisés du territoire
    const F = D.acc.champs.reduce((o, k, i) => (o[k] = i, o), {});
    const inT = r => level === 'region' ? r[F.region] === name : level === 'departement' ? r[F.departement] === name && r[F.region] === regName[ft.properties.GID_1] : r[F.commune] === name && r[F.departement] === depName[ft.properties.GID_2];
    const rows = D.acc.lignes.filter(inT);
    const inP = p => level === 'region' ? p.region === name : level === 'departement' ? p.departement === name : p.commune === name && p.departement === depName[ft.properties.GID_2];
    const pts = D.pts.features.map(f => f.properties).filter(inP);

    const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, M = 14;
    const header = (p) => {
      doc.setFillColor(...C.asph); doc.rect(0, 0, W, 26, 'F'); doc.setFillColor(...C.jaune); doc.rect(0, 26, W, 1.6, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.text('YOON WU WÓOR', M, 12);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(200, 204, 212); doc.text('Observatoire national de la sécurité routière du Sénégal', M, 18);
      doc.setTextColor(...C.jaune); doc.setFont('helvetica', 'bold'); doc.text('RAPPORT TERRITORIAL', W - M, 12, { align: 'right' });
      doc.setTextColor(200, 204, 212); doc.setFont('helvetica', 'normal'); doc.text('Page ' + p + ' / 2', W - M, 18, { align: 'right' });
    };
    const footer = () => {
      doc.setDrawColor(...C.bord); doc.line(M, 284, W - M, 284); doc.setFontSize(7); doc.setTextColor(...C.gris);
      doc.text("Sources : ANASER, bilan 2025 (totaux nationaux) - données infranationales, accidents géolocalisés et équipements simulés pour la démonstration.", M, 288);
      doc.text('Généré le ' + new Date().toLocaleDateString('fr-FR') + ' depuis bathie18.github.io/yoonwuwoor - Prototype CEGIT', M, 292);
    };
    const h2 = (t, y, x = M) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...C.asph); doc.text(t.toUpperCase(), x, y); doc.setFillColor(...C.jaune); doc.rect(x, y + 1.6, 14, 1, 'F'); };
    const box = (x, y, w, h, val, lab, col) => { doc.setFillColor(...C.clair); doc.roundedRect(x, y, w, h, 2, 2, 'F'); doc.setFillColor(...col); doc.rect(x, y, 1.4, h, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(...C.asph); doc.text(val, x + 5, y + 10); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...C.gris); doc.text(doc.splitTextToSize(lab, w - 8), x + 5, y + 15.5); };
    const bars = (items, x, y, w, max, col) => { items.forEach((it, i) => { const yy = y + i * 6.4; doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2); doc.setTextColor(...C.asph); doc.text(it[0], x, yy + 3);
      const lw = w > 120 ? 62 : 38, bx = x + lw, bw = w - lw - (w > 120 ? 34 : 10); doc.setFillColor(...C.clair); doc.roundedRect(bx, yy, bw, 3.8, 1.5, 1.5, 'F'); doc.setFillColor(...(it[2] || col)); doc.roundedRect(bx, yy, Math.max(1, bw * it[1] / (max || 1)), 3.8, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold'); doc.text(String(it[3] ?? nf(it[1])), x + w, yy + 3, { align: 'right' }); }); };
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

    // ---------- Page 1
    header(1);
    doc.setTextColor(...C.vert); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('SÉCURITÉ ROUTIÈRE ET ACCIDENTOLOGIE - ' + year, M, 38);
    doc.setTextColor(...C.asph); doc.setFontSize(24); doc.text(name, M, 48);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...C.gris);
    doc.text(LVL[level] + (parent ? ' - ' + parent : '') + ' - ' + nf(pop) + ' habitants', M, 55);
    const bw = (W - 2 * M - 3 * 4) / 4;
    box(M, 61, bw, 22, nf(cur.tues), 'personnes tuées', C.rouge); box(M + (bw + 4), 61, bw, 22, nf(cur.acc), 'accidents corporels', C.jaune);
    box(M + 2 * (bw + 4), 61, bw, 22, nf(cur.bg), 'blessés graves', C.asph); box(M + 3 * (bw + 4), 61, bw, 22, nf(cur.bl), 'blessés légers', C.vert);
    box(M, 87, bw * 2 + 4, 22, nf1(taux), 'tués pour 100 000 habitants (moyenne nationale : ' + nf1(natT) + ')', taux > natT ? C.rouge : C.vert);
    box(M + 2 * (bw + 4), 87, bw * 2 + 4, 22, nf1(grav), 'tués pour 100 accidents (moyenne nationale : ' + nf1(natG) + ')', grav > natG ? C.rouge : C.vert);
    // lecture
    const dT = prev ? (cur.tues - prev.tues) / Math.max(prev.tues, 1) * 100 : null;
    doc.setFontSize(9.3); doc.setTextColor(...C.asph);
    const lect = `En ${year}, ${name} enregistre ${nf(cur.acc)} accidents corporels et ${nf(cur.tues)} personnes tuées` + (dT != null ? (Math.abs(dT) < 0.5 ? `, un nombre de tués stable par rapport à ${year - 1}` : `, soit ${dT > 0 ? 'une hausse' : 'une baisse'} de ${nf1(Math.abs(dT))} % du nombre de tués par rapport à ${year - 1}`) : '') +
      `. Le risque rapporté à la population est ${taux > natT ? 'supérieur' : 'inférieur'} à la moyenne nationale et la gravité des accidents y est ${grav > natG ? 'plus élevée' : 'plus faible'} que dans l'ensemble du pays.`;
    doc.text(doc.splitTextToSize(lect, W - 2 * M), M, 117);
    h2('Localisation des accidents', 134);
    doc.addImage(mapImage(D, level, ft, rows), 'PNG', M, 139, 100, 71);
    doc.setFontSize(8); doc.setTextColor(...C.gris);
    const lg = [['#e31b23', 'Accident mortel'], ['#ff7a00', 'Accident grave'], ['#f5b700', 'Accident léger'], ['#e0a400', 'Route nationale'], ['#f26b2b', 'Route régionale'], ['#7b3fbf', 'Autoroute']];
    lg.forEach((l, i) => { doc.setFillColor(...hex(l[0])); doc.circle(M + 106, 145 + i * 6, 1.6, 'F'); doc.text(l[1], M + 110, 146 + i * 6); });
    doc.setFontSize(8.5); doc.setTextColor(...C.asph);
    doc.text(doc.splitTextToSize(`${rows.length} accidents géolocalisés (échantillon 2021-${year}), dont ${rows.filter(r => r[F.grav] === 'M').length} mortels.`, 70), M + 106, 180);
    h2('Évolution ' + years[0] + ' - ' + years[years.length - 1], 220);
    doc.addImage(evoImage(years, years.map(y => S[y].acc), years.map(y => S[y].tues)), 'PNG', M, 225, 110, 46);
    doc.setFontSize(8); doc.setTextColor(...C.gris); doc.text('Barres : accidents - courbe : tués', M, 276);
    // tableau
    let ty = 228; doc.setFontSize(8.2);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.gris); ['Année', 'Acc.', 'Tués', 'BG', 'BL'].forEach((h, i) => doc.text(h, M + 116 + i * 14 + (i ? 10 : 0), ty, { align: i ? 'right' : 'left' }));
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.asph);
    years.forEach((y, j) => { const yy = ty + 6 + j * 6; doc.setDrawColor(...C.bord); doc.line(M + 116, yy + 1.8, W - M, yy + 1.8);
      [y, S[y].acc, S[y].tues, S[y].bg, S[y].bl].forEach((v, i) => doc.text(i ? nf(v) : String(v), M + 116 + i * 14 + (i ? 10 : 0), yy, { align: i ? 'right' : 'left' })); });
    footer();

    // ---------- Page 2
    doc.addPage(); header(2);
    const count = (k, list) => { const c = {}; rows.forEach(r => c[r[F[k]]] = (c[r[F[k]]] || 0) + 1); return (list || Object.keys(c)).map(x => [x, c[x] || 0]).sort((a, b) => b[1] - a[1]); };
    const TL = Object.fromEntries(D.acc.types.map(t => [t[0], t[1]]));
    h2('Types de collision', 38);
    const ct = count('type').filter(x => x[1]);
    const tues = {}; rows.forEach(r => tues[r[F.type]] = (tues[r[F.type]] || 0) + r[F.tues]);
    bars(ct.slice(0, 8).map(x => [TL[x[0]].replace('Véhicule seul (sortie de route, renversement)', 'Véhicule seul').replace('Deux-roues motorisés (seul ou entre eux)', 'Deux-roues motorisés'), x[1], hex(TYPE_COL[x[0]]), nf(x[1]) + ' acc. / ' + nf(tues[x[0]] || 0) + ' tués']), M, 44, W - 2 * M, ct[0] ? ct[0][1] : 1);
    const half = (W - 2 * M - 8) / 2;
    h2('Luminosité', 102); bars(count('lum').map(x => [x[0], x[1], C.asph]), M, 108, half, Math.max(...count('lum').map(x => x[1]), 1));
    h2('Causes présumées', 102, M + half + 8);
    const cc = count('cause'); bars(cc.map(x => [x[0].replace('Non-respect des règles de conduite', 'Non-respect des règles').replace('Défaut de maîtrise du véhicule', 'Défaut de maîtrise'), x[1], C.rouge]), M + half + 8, 108, half, Math.max(...cc.map(x => x[1]), 1));
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...C.asph);
    // milieu & délai
    const urb = rows.filter(r => r[F.milieu] === 'U').length, del = rows.length ? rows.reduce((a, r) => a + r[F.delai], 0) / rows.length : null;
    const night = rows.filter(r => r[F.lum] !== 'Jour').length;
    const by = 150; const bw3 = (W - 2 * M - 8) / 3;
    box(M, by, bw3, 20, rows.length ? nf1(urb / rows.length * 100) + ' %' : '-', 'des accidents en agglomération', C.asph);
    box(M + bw3 + 4, by, bw3, 20, rows.length ? nf1(night / rows.length * 100) + ' %' : '-', 'des accidents de nuit ou au crépuscule', C.jaune);
    box(M + 2 * (bw3 + 4), by, bw3, 20, del ? nf(del) + ' min' : '-', "délai moyen d'arrivée des secours", C.rouge);
    // zones accidentogènes
    const zones = pts.filter(p => p.cat === 'zone').sort((a, b) => b.acc - a.acc).slice(0, 7);
    h2('Zones accidentogènes prioritaires', 182);
    let zy = 189; doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.gris);
    doc.text('Section', M, zy); doc.text('Acc. (5 ans)', M + 102, zy, { align: 'right' }); doc.text('Tués', M + 118, zy, { align: 'right' }); doc.text('Statut', M + 124, zy);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.asph);
    if (!zones.length) { doc.text('Aucune zone accidentogène recensée sur ce territoire.', M, zy + 7); zy += 7; }
    zones.forEach((z, i) => { const yy = zy + 6.5 + i * 6.2; doc.setDrawColor(...C.bord); doc.line(M, yy + 2, W - M, yy + 2);
      doc.text(doc.splitTextToSize(z.nom + (z.route !== 'Urbain' ? ' (' + z.pk + ')' : ''), 85)[0], M, yy); doc.text(nf(z.acc), M + 102, yy, { align: 'right' }); doc.text(nf(z.tues), M + 118, yy, { align: 'right' }); doc.text(z.statut, M + 124, yy); });
    // équipements
    const eq = [['Centres de contrôle technique', 'cct'], ['Auto-écoles', 'autoecole'], ['Gares routières', 'gare'], ['Centres de secours', 'secours']];
    h2('Équipements et services', 244);
    eq.forEach((e, i) => { const x = M + i * ((W - 2 * M) / 4); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...C.asph); doc.text(String(pts.filter(p => p.cat === e[1]).length), x, 256); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.gris); doc.text(e[0], x, 261); });
    // pistes d'action
    const dom = ct[0] ? ct[0][0] : null;
    const reco = { 'VL/2RM': 'contrôle du port du casque et sécurisation des carrefours', '2RM': 'formation et contrôle des conducteurs de deux-roues', 'PIETON': 'aménagement de traversées piétonnes et éclairage', 'VL/TC': 'contrôle du transport en commun (surcharge, état des véhicules)', 'VL/PL': 'contrôle des poids lourds et aires de repos', 'SEUL': 'traitement des sorties de route (accotements, signalisation de virages)', 'VL/VL': 'contrôles de vitesse et du respect des priorités', 'PL/TC': 'contrôle des temps de conduite des professionnels', 'HIPPO': 'éclairage et signalisation des charrettes', 'VELO': 'aménagements cyclables et visibilité' };
    doc.setFillColor(255, 244, 204); doc.roundedRect(M, 266, W - 2 * M, 14, 2, 2, 'F'); doc.setFontSize(8.6); doc.setTextColor(...C.asph);
    doc.text(doc.splitTextToSize('Piste d\'action prioritaire : ' + (dom ? reco[dom] : 'consolider la remontée des données d\'accidents') + (zones[0] ? ' ; diagnostic de la section « ' + zones[0].nom + ' ».' : '.'), W - 2 * M - 8), M + 4, 271.5);
    footer();
    doc.save('Yoon-Wu-Woor_rapport_' + name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-') + '_' + year + '.pdf');
  }
  return { build, KEY, FILE };
})();

# Construit les couches du portail (routes, voie ferrée, équipements) depuis le GeoPackage du projet QGIS « reseau_routier ».
# Usage : python3 tools/build_reseau.py chemin/vers/reseau_routier.gpkg
import pyogrio, geopandas as gpd, pandas as pd, json, re, warnings, math, collections
from shapely.geometry import Point, LineString, MultiLineString, mapping, shape
from shapely.ops import linemerge, unary_union, nearest_points
warnings.filterwarnings('ignore')
import sys
G=sys.argv[1] if len(sys.argv)>1 else 'reseau_routier.gpkg'; OUT='data/'
def rd(layer): return pyogrio.read_dataframe(G,layer=layer).set_crs(32628,allow_override=True)
def r5(o,d=5): return json.loads(json.dumps(o),parse_float=lambda x:round(float(x),d))
report=collections.OrderedDict()
# ---------------- réseau routier
NOMS={'AUTOROUTE':'Autoroute','RN':'Route nationale','RR':'Route régionale','RD':'Route départementale'}
parts=[]
for t,cl in [('Autoroute','AUTOROUTE'),('Route_nationale_bitumee','RN'),('Route_nationale_non_bitumee','RN'),('Route_regionale_bitumee','RR'),('Route_regionale_non_bitumee','RR'),('Route_departementale_bitumee','RD'),('Route_departementale_non_bitumee','RD')]:
    g=rd(t); g['cl']=cl; parts.append(g)
R=pd.concat(parts); R=R[R.PAYS=='SN'].copy()
def ref(r):
    n=str(r.NOM_AGEROU or '').strip()
    if r.cl=='AUTOROUTE': return 'A1' if n=='A1' else 'Ila Touba'
    if n in ('RN','RNB','RD','RDB','PNC','') or n=='nan': return None
    return n.replace('R.','R').replace(' bis','bis')
R['ref']=R.apply(ref,axis=1).astype(object)
R['ref']=[x if isinstance(x,str) else '' for x in R['ref']]
R['revet']=R.REVET.map({1:'Bitumée',2:'Non bitumée'})
R['km']=R.length/1000
feats=[]
for _,r in R.iterrows():
    geom=r.geometry.simplify(25)
    lab=NOMS[r.cl]+(' '+r.ref if r.ref and r.cl!='AUTOROUTE' else '')
    if r.cl=='AUTOROUTE': lab='Autoroute de l\'Avenir (A1)' if r.ref=='A1' else 'Autoroute Ila Touba'
    feats.append({"type":"Feature","properties":{"route":(r.ref or None) or NOMS[r.cl][6:].strip().upper()[:2],"ref":r.ref,"type":r.cl,"revet":r.revet,"nom":lab,"km":round(r.km,1),"gest":"ADS (Autoroutes du Sénégal)" if r.cl=='AUTOROUTE' else 'AGEROUTE'},"geometry":r5(mapping(gpd.GeoSeries([geom],crs=32628).to_crs(4326).iloc[0]))})
json.dump({"type":"FeatureCollection","features":feats},open(OUT+'routes.geojson','w'),separators=(',',':'),ensure_ascii=False)
report['reseau']={f'{a} {b}':v for (a,b),v in R.groupby(['cl','revet']).km.sum().round(0).items()}
# ---------------- voie ferrée
VF=rd('voie_ferree')
vf=[{"type":"Feature","properties":{"nom":"Voie ferrée","km":round(geom.length/1000,1)},"geometry":r5(mapping(gpd.GeoSeries([geom.simplify(25)],crs=32628).to_crs(4326).iloc[0]))} for geom in VF.geometry]
json.dump({"type":"FeatureCollection","features":vf},open(OUT+'voie_ferree.geojson','w'),separators=(',',':'))
report['voie_ferree_km']=round(VF.length.sum()/1000)
# ---------------- contexte : terre, communes
com=gpd.read_file(OUT+'communes.geojson').to_crs(32628)
land=unary_union(com.geometry.buffer(0))
def commune(p):
    m=com[com.contains(p)]
    return m.iloc[0].NAME if len(m) else None
roads_all=unary_union(R.geometry); A=unary_union(R[R.cl=='AUTOROUTE'].geometry); rail=unary_union(VF.geometry)
P=[]
def add(cat,pt,props,src):
    p=gpd.GeoSeries([pt],crs=32628).to_crs(4326).iloc[0]
    props.update(cat=cat,source=src,commune=props.get('commune') or commune(pt))
    P.append({"type":"Feature","properties":{k:v for k,v in props.items() if v is not None and v==v},"geometry":{"type":"Point","coordinates":[round(p.x,5),round(p.y,5)]}})
FIC='Projet QGIS – donnée fictive'
def fic_ok(layer,maxdist=None,target=None):
    g=rd(layer); keep=[]; drop=[]
    for _,r in g.iterrows():
        p=r.geometry
        if not land.buffer(1000).contains(p): drop.append((r.get('id'),'hors du territoire (en mer)')); continue
        if target is not None and p.distance(target)>maxdist: drop.append((r.get('id'),'à %.1f km du réseau concerné'%(p.distance(target)/1000))); continue
        keep.append(r)
    return keep,drop
# ---- PK calculés le long des routes nationales et autoroutes
DAKAR=gpd.GeoSeries([Point(-17.4467,14.6928)],crs=4326).to_crs(32628).iloc[0]
pk_n=0
for refn,grp in R[R.ref.str.match(r'^(N\d+|A1|Ila Touba)$')].groupby('ref'):
    u=unary_union(grp.geometry)
    m=u if u.geom_type=='LineString' else linemerge(u)
    lines=[m] if m.geom_type=='LineString' else sorted(m.geoms,key=lambda l:-l.length)
    main=lines[0]
    if Point(main.coords[-1]).distance(DAKAR)<Point(main.coords[0]).distance(DAKAR): main=LineString(list(main.coords)[::-1])
    step=5000 if refn in('A1','Ila Touba') else 10000
    for d in range(0,int(main.length)+1,step):
        pt=main.interpolate(d); pk_n+=1
        add('pk',pt,{'nom':f'{refn} – PK {d//1000}','route':refn if refn!='Ila Touba' else 'Ila Touba','pk':d//1000,'type_point':'Kilomètre zéro' if d==0 else ('Borne hectométrique principale' if d%50000==0 else 'Borne kilométrique'),'longueur_axe':round(main.length/1000)},'Calculé le long du tracé AGEROUTE (indicatif)')
report['pk_calcules']=pk_n
_,dpk=fic_ok('fic_PointsKilometriques'); report['pk_fictifs_remplaces']=24
# ---- passages à niveau : intersections réelles rail x routes
inter=rail.intersection(roads_all); pts=[inter] if inter.geom_type=='Point' else [g for g in getattr(inter,'geoms',[]) if g.geom_type=='Point']
# dédoublonner < 200 m
uniq=[]
for p in pts:
    if all(p.distance(q)>200 for q in uniq): uniq.append(p)
for i,p in enumerate(uniq):
    near=R[R.distance(p)<5].iloc[0]
    add('pn',p,{'nom':f'Passage à niveau – {((near.ref or None) or NOMS[near.cl])}','route':(near.ref or None) or NOMS[near.cl],'classe_route':NOMS[near.cl],'type_barri':'À renseigner','passage_pi':'À renseigner'},'Calculé : intersection voie ferrée × réseau routier')
keep,dpn=fic_ok('fic_PassagesANiveau',600,rail)
for r in keep: add('pn',nearest_points(r.geometry,rail)[1],{'nom':r.nom,'type_barri':r.type_barri,'passage_pi':r.passage_pi},FIC)
report['pn']={'calcules':len(uniq),'fictifs_gardes':len(keep),'fictifs_ecartes':dpn}
# ---- aires d'autoroute
keep,dai=fic_ok('fic_AiresAutoroutes',10000,A)
for r in keep:
    sp=nearest_points(r.geometry,A)[1]; near=R[(R.cl=='AUTOROUTE')&(R.distance(sp)<5)].iloc[0]
    add('aire',sp,{'nom':r.nom_aire,'autoroute':'A1' if near.ref=='A1' else 'Ila Touba','services':r.services_d},FIC+' (recalée sur l\'autoroute)')
report['aires']={'gardees':len(keep),'ecartees':dai}
# ---- autres couches fictives
for layer,cat,mp in [('fic_StationsService','station',lambda r:{'nom':r.nom_statio,'exploitant':r.exploitant,'carburants':r.carburants,'paiement':r.AC_payment,'accessible':r.accessible}),
                     ('fic_Parkings','parking',lambda r:{'nom':r.nom_parkin,'capacite':r.capacite_v,'couvert':r.couvert,'tarif':r.tarif}),
                     ('fic_ArretsBus','arret',lambda r:{'nom':r.nom_arret,'ligne':r.ligne,'abri':r.abri,'accessible':r.accessibil,'type_arret':r.type_arret}),
                     ('fic_AccesService','acces',lambda r:{'nom':r.nom_acces,'type_acces':r.type_acces,'statut':r.statut})]:
    keep,dr=fic_ok(layer)
    # pas de doublon fictif en région de Dakar pour stations et parkings (données réelles RGE)
    n=0
    for r in keep:
        p=gpd.GeoSeries([r.geometry],crs=32628).to_crs(4326).iloc[0]
        if cat in('station','parking') and p.x<-17.10: dr.append((r.id,'région de Dakar couverte par le RGE réel')); continue
        add(cat,r.geometry,mp(r),FIC); n+=1
    report[layer]={'gardes':n,'ecartes':dr}
# ---- RGE réel : stations, parkings, gares ferroviaires (région de Dakar)
rge=rd('infra_region_dakar_rge')
for c in ['TOPONYMIE','QRT_VLG_HA','CCRCA','DEPT','DESCRIPTIF']: rge[c]=rge[c].apply(lambda v: v if isinstance(v,str) else '')
rge['D']=rge.DESCRIPTIF.fillna('').str.strip()
rge=rge.drop_duplicates(subset=['LONG','LAT','D'])
MAP={'Station service':'station','Parking':'parking','Gare ferroviaire':'gare_fer'}
cnt=collections.Counter()
for _,r in rge[rge.D.isin(MAP)].iterrows():
    c=MAP[r.D]; cnt[c]+=1
    nom=(r.TOPONYMIE or '').strip() or ({'station':'Station-service','parking':'Parking','gare_fer':'Gare ferroviaire'}[c])
    add(c,r.geometry,{'nom':nom.title() if nom.isupper() else nom,'quartier':(r.QRT_VLG_HA or '').title(),'commune':(r.CCRCA or '').title(),'departement':(r.DEPT or '').title()},'RGE – Référentiel géographique (réel)')
report['rge']=dict(cnt)
# ---- aéroports
for _,r in rd('aéroports').iterrows():
    add('aeroport',r.geometry,{'nom':'Aéroport '+('international Blaise-Diagne (AIBD)' if r['localité']=='dakar' and r.type=='international' else ("de Dakar (nouveau site)" if r.type=='futur' else r['localité'].title())),'type_aero':r.type.capitalize()},'Projet QGIS')
json.dump({"type":"FeatureCollection","features":P},open(OUT+'equipements.geojson','w'),ensure_ascii=False,separators=(',',':'))
report['equipements']=dict(collections.Counter(f['properties']['cat'] for f in P))
json.dump(report,open('report.json','w'),ensure_ascii=False,indent=1,default=str)
print(json.dumps(report,ensure_ascii=False,indent=1,default=str))

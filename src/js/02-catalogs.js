/* ---------- catalogs ---------- */
const ASPECTS={'16:9':[1920,1080],'9:16':[1080,1920],'1:1':[1080,1080],'4:5':[1080,1350]};
const FONTS=[
 ['Montserrat',1],['Poppins',1],['Outfit',1],['Lexend',1],['Raleway',1],['Josefin Sans',1],['Rubik',1],['Nunito',1],['Quicksand',1],['Syne',1],['Unbounded',1],
 ['Playfair Display',1],['Lora',1],['Cormorant Garamond',1],['Libre Baskerville',1],['Bodoni Moda',1],['Cinzel',1],['DM Serif Display',0],['Prata',0],['Italiana',0],['Marcellus',0],['Abril Fatface',0],
 ['Bebas Neue',0],['Anton',0],['Oswald',1],['Barlow Condensed',1],['Teko',1],['Archivo Black',0],['Bungee',0],['Righteous',0],['Monoton',0],
 ['Great Vibes',0],['Dancing Script',1],['Pacifico',0],['Sacramento',0],['Satisfy',0],['Caveat',1],['Lobster',0],['Permanent Marker',0],['Space Mono',1]
];
(function loadFonts(){
  for(let i=0;i<FONTS.length;i+=6){
    const fam=FONTS.slice(i,i+6).map(([n,b])=>'family='+n.replace(/ /g,'+')+(b?':wght@400;700':'')).join('&');
    const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?'+fam+'&display=swap';document.head.appendChild(l);
  }
})();

const FILTERS={
 none:{name:'Original'},
 clean:{name:'Immo Clean',bright:.06,contrast:.08,sat:.1,temp:-.05,hdr:.2},
 airy:{name:'Lumineux',bright:.12,contrast:-.04,sat:.05,temp:.04,fade:.06},
 luxe:{name:'Luxe chaud',contrast:.15,sat:-.05,temp:.25,vig:.3,lift:[.02,.01,0],gain:[1.05,1,.92]},
 cinema:{name:'Cinéma',contrast:.2,sat:.05,lift:[0,.03,.06],gain:[1.08,1,.9],vig:.2},
 golden:{name:'Heure dorée',temp:.4,sat:.15,bright:.03,gain:[1.1,1,.86],gold:.3},
 hdr:{name:'HDR vif',sat:.3,contrast:.12,hdr:.6},
 nordic:{name:'Nordique',sat:-.25,temp:-.2,bright:.05,fade:.2},
 bluehour:{name:'Heure bleue',bright:-.12,temp:-.4,sat:-.05,contrast:.1},
 matte:{name:'Mat',fade:.45,contrast:-.05,sat:-.05},
 pastel:{name:'Pastel',sat:-.2,bright:.08,fade:.25,tint:.1},
 vintage:{name:'Vintage',fade:.3,temp:.2,sat:-.15,vig:.35,grain:.3},
 bw:{name:'Noir & blanc',sat:-1,contrast:.2},
 sepia:{name:'Sépia',sat:-1,gain:[1.12,.97,.78]},
};
const FX=[
 {id:'kb-in',name:'Ken Burns avant',d:'Zoom lent vers l\'intérieur',cat:'Mouvement caméra',ic:'zin'},
 {id:'kb-out',name:'Ken Burns arrière',d:'Zoom lent vers l\'extérieur',cat:'Mouvement caméra',ic:'zout'},
 {id:'pan-l',name:'Panoramique gauche',d:'Glisse lentement vers la gauche',cat:'Mouvement caméra',ic:'stepB'},
 {id:'pan-r',name:'Panoramique droite',d:'Glisse lentement vers la droite',cat:'Mouvement caméra',ic:'stepF'},
 {id:'tilt-up',name:'Travelling vertical',d:'Montée façon façade',cat:'Mouvement caméra',ic:'upload'},
 {id:'drone',name:'Drone push-in',d:'Approche aérienne avec léger roulis',cat:'Mouvement caméra',ic:'house'},
 {id:'orbit',name:'Orbite lente',d:'Rotation douce autour du bien',cat:'Mouvement caméra',ic:'loop'},
 {id:'pulse',name:'Zoom au tempo',d:'Pulsation légère, idéal Reels',cat:'Mouvement caméra',ic:'zin'},
 {id:'shake',name:'Caméra épaule',d:'Tremblement naturel',cat:'Mouvement caméra',ic:'sparkles'},
 {id:'flash',name:'Flash d\'entrée',d:'Éclair blanc au début du clip',cat:'Lumière',ic:'sun'},
 {id:'leak',name:'Light leak',d:'Fuites de lumière chaudes',cat:'Lumière',ic:'sun'},
 {id:'bokeh',name:'Bokeh doré',d:'Particules lumineuses flottantes',cat:'Lumière',ic:'sparkles'},
 {id:'vignette',name:'Vignette',d:'Assombrit les bords',cat:'Lumière',ic:'filter'},
 {id:'letterbox',name:'Bandes cinéma',d:'Format 2.39 cinémascope',cat:'Lumière',ic:'film'},
 {id:'grain',name:'Grain film',d:'Texture argentique',cat:'Stylisé',ic:'film'},
 {id:'vhs',name:'VHS',d:'Lignes, bruit et couleurs bavées',cat:'Stylisé',ic:'film'},
 {id:'glitch',name:'Glitch',d:'Coupures numériques par à-coups',cat:'Stylisé',ic:'sparkles'},
 {id:'rgb',name:'Décalage RGB',d:'Aberration chromatique',cat:'Stylisé',ic:'filter'},
 {id:'blur',name:'Flou',d:'Flou d\'arrière-plan',cat:'Stylisé',ic:'filter'},
 {id:'mirror',name:'Miroir',d:'Symétrie gauche / droite',cat:'Stylisé',ic:'trans'},
 {id:'snow',name:'Neige',d:'Flocons qui tombent',cat:'Météo',ic:'sparkles'},
 {id:'rain',name:'Pluie',d:'Averse légère',cat:'Météo',ic:'sparkles'},
];
const FXMAP=Object.fromEntries(FX.map(f=>[f.id,f]));
const TRANS=[
 ['none','Aucune'],['fade','Fondu enchaîné'],['black','Fondu au noir'],['white','Fondu au blanc'],['doors','Ouverture portes'],['curtain','Rideau'],
 ['slide-l','Glisser gauche'],['slide-r','Glisser droite'],['slide-u','Glisser haut'],['push-l','Pousser'],['wipe-l','Volet'],['wipe-d','Volet vertical'],
 ['zoom-in','Zoom avant'],['zoom-out','Zoom arrière'],['dive','Plongée drone'],['circle','Cercle'],['diamond','Losange'],['blinds','Stores'],
 ['blur','Flou'],['whip','Whip pan'],['spin','Rotation'],['glitch','Glitch'],['burn','Brûlure film'],['flash','Flash']
];
const TRANSMAP=Object.fromEntries(TRANS);
const IN_ANIMS=[['none','Aucune'],['fade','Fondu'],['slide-up','Monter'],['slide-down','Descendre'],['slide-left','Depuis la droite'],['slide-right','Depuis la gauche'],['pop','Pop'],['zoom','Zoom'],['blur','Flou'],['typewriter','Machine à écrire'],['letters','Lettre par lettre'],['wipe','Révélation'],['count','Compteur (chiffres)']];
const OUT_ANIMS=[['none','Aucune'],['fade','Fondu'],['slide-up','Monter'],['slide-down','Descendre'],['zoom','Zoom'],['blur','Flou'],['wipe','Effacement']];
const BLENDS=[['source-over','Normal'],['screen','Superposition claire'],['multiply','Produit'],['overlay','Incrustation'],['soft-light','Lumière douce'],['lighten','Éclaircir'],['darken','Assombrir'],['difference','Différence']];
const SHAPES=[
 ['rect','Rectangle'],['round','Carte arrondie'],['circle','Cercle'],['frame','Cadre'],['line','Ligne'],['arrow','Flèche'],
 ['tag','Étiquette prix'],['pin','Repère carte'],['stamp','Tampon VENDU'],['ribbon','Ruban'],['house','Icône maison'],['lowerbar','Bandeau bas'],['progress','Barre de progression'],
];
const SCENES={villa:'Villa piscine',salon:'Salon lumineux',facade:'Façade d\'immeuble'};
const COLORS=[['#141824','#2B3352','Nuit'],['#F4EFE6','#E6DCCB','Lin'],['#2E2A26','#5B4B3B','Noyer'],['#1F3B4D','#3F7A8C','Lagon'],['#F2A65E','#E27E92','Crépuscule'],['#0F0F10','#0F0F10','Noir']];

const TEXT_TPL=[
 {name:'Titre élégant',p:{text:'Villa Les Oliviers\nAix-en-Provence',font:'Playfair Display',size:112,weight:700,sub:.4,animIn:'letters',inDur:1.4,shadowBlur:30,shadowColor:'rgba(0,0,0,.45)'}},
 {name:'Prix',p:{text:'1 250 000 €\nMaison 6 pièces · 260 m²',font:'Montserrat',size:70,weight:700,sub:.42,color:'#1C1B19',bg:'#F4EFE6',bgA:1,pad:34,radius:16,animIn:'pop',x:.27,y:.78}},
 {name:'Adresse',p:{text:'12 chemin des Oliviers\n13100 Aix-en-Provence',font:'Outfit',size:54,weight:700,sub:.6,align:'left',bg:'#11131A',bgA:.7,pad:26,radius:6,animIn:'slide-right',x:.3,y:.82}},
 {name:'Caractéristiques',p:{text:'5 ch · 4 sdb · 260 m² · piscine',font:'Lexend',size:46,weight:400,bg:'#000000',bgA:.55,pad:22,radius:40,animIn:'slide-up',y:.86}},
 {name:'Surface',p:{text:'260 m²\nhabitables',font:'Bebas Neue',size:170,weight:400,sub:.28,ls:2,animIn:'zoom',shadowBlur:24,shadowColor:'rgba(0,0,0,.5)'}},
 {name:'Nouveauté',p:{text:'NOUVEAUTÉ',font:'Archivo Black',size:40,weight:400,ls:6,color:'#2B1708',bg:'#F2A65E',bgA:1,pad:20,radius:4,animIn:'slide-right',x:.17,y:.12}},
 {name:'Visite virtuelle',p:{text:'VISITE VIRTUELLE',font:'Cinzel',size:64,weight:700,ls:16,animIn:'wipe',inDur:1.2,shadowBlur:20,shadowColor:'rgba(0,0,0,.5)'}},
 {name:'Coup de cœur',p:{text:'Coup de cœur',font:'Great Vibes',size:130,weight:400,color:'#F7D9A8',animIn:'blur',inDur:1,shadowBlur:22,shadowColor:'rgba(0,0,0,.5)'}},
 {name:'Exclusivité',p:{text:'Exclusivité',font:'Bodoni Moda',size:96,weight:400,italic:true,animIn:'fade',inDur:1,shadowBlur:18,shadowColor:'rgba(0,0,0,.45)'}},
 {name:'Portes ouvertes',p:{text:'Portes ouvertes\nsamedi 10h – 18h',font:'Righteous',size:84,weight:400,sub:.5,color:'#FFE9CC',shadowBlur:40,shadowColor:'#F2A65E',animIn:'pop'}},
 {name:'Contact',p:{text:'Prenez rendez-vous\n04 00 00 00 00',font:'Lexend',size:76,weight:700,sub:.55,bg:'#11131A',bgA:.75,pad:40,radius:20,animIn:'zoom'}},
 {name:'Sous-titre',p:{text:'Votre texte ici',font:'Montserrat',size:46,weight:700,bg:'#000000',bgA:.6,pad:14,radius:8,y:.86,animIn:'fade',inDur:.15,animOut:'fade',outDur:.15}},
];

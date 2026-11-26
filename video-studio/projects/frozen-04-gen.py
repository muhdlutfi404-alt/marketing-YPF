import json, os, shutil, subprocess
ROOT="/home/user/marketing-YPF/video-studio"
C="lv_0_20261123141154"
src=json.load(open(f"{ROOT}/src/edits/frozen-04/footage.json"))
trp=f"{ROOT}/src/edits/frozen-04/transcripts/{C}.json"
TR=json.load(open(trp)); WORDS=[w for s in TR["segments"] for w in s["words"]]
facts=json.load(open(f"{ROOT}/src/edits/frozen-04/facts.json"))
facts["brandName"].update({"value":"YaPakCik Frozen","confirmed":True})
facts["presenterName"].update({"value":"Ayoh Mad","confirmed":True,"note":"owner confirmed (frozen-01)"})
facts["priceList"]={"value":"RM20 runcit; RM19 untuk orang jual; RM18.50 ambil kotak; sepaket 900g","label":"Harga daging slice","confirmed":True,"note":"owner confirmed 2026-11-23"}
facts["whatsapp"]={"value":"016-723 7170","label":"WhatsApp Ayoh Mad","confirmed":True,"note":"owner supplied 2026-11-23 for the video"}
facts["delivery"]={"value":"Warga Tumpat: penghantaran PERCUMA. Bachok, Ketereh, Melor & kawasan berhampiran: RM1,000 ke atas PERCUMA; bawah RM1,000 caj RM20","label":"Penghantaran","confirmed":True,"note":"owner confirmed 2026-11-23"}
facts["branches"]={"value":"Pasar Sumayyah, Tumpat (pusat utama)","label":"Branches","confirmed":True,"note":"owner confirmed"}
FOCUS={"x":0.5,"y":0.3}
def Q(q,**k): d={"quote":q}; d.update(k); return d
T=lambda q:{"quote":q}
def shot(id,label,i,o,base=1.3,zooms=(),tr=None,focus=None):
    z=[{"at":0,"type":"punch-in","scale":base,"duration":0.01}]+list(zooms)
    s={"id":id,"label":label,"clip":C,"in":i,"out":o,"audio":"keep","focus":focus or FOCUS,"zooms":z}
    if tr: s["transition"]=tr
    return s
P=lambda q,sc=1.45: {"at":Q(q),"type":"punch-in","scale":sc}
PO=lambda q,sc=1.28: {"at":Q(q),"type":"punch-out","scale":sc}
PUSH=lambda sc=1.38: {"at":0.02,"type":"push","scale":sc}
FADE={"type":"fade","duration":0.25}
def wt(text, after=0):
    for w in WORDS:
        if w["start"]>=after and w["text"].lower().strip(" ,.?!").startswith(text): return w["start"]
    raise SystemExit(f"word {text} not found after {after}")
def track(a,b):
    out=subprocess.check_output([f"{ROOT}/.venv/bin/python",f"{ROOT}/scripts/story/track.py","frozen-04",C,"--from",str(a),"--to",str(b),"--hsv","15,110,140,34,255,255","--ymax","1180"],cwd=ROOT)
    return json.loads(out)
CTA_SHOTS=lambda p: [shot(f"{p}cta1","CTA: mari YaPakCik Frozen",184.05,187.55,1.3,[PUSH(1.38)],FADE),
                     shot(f"{p}cta2","CTA: Pasar Sumayyah Tumpat",205.55,207.2,1.36),
                     shot(f"{p}cta3","CTA: pusat utama di Tumpat",215.75,219.6,1.32,[PUSH(1.4)])]
CTA_LAYERS=[{"id":"endcard","type":"scene","at":Q("Okey deh ha bagi siapa-siapa"),"duration":8.75,"source":"transcript","evidence":T("Pasar Sumayyah Tumpat aa pusat utama di Tumpat"),
  "props":{"layout":"split","kind":"endcard","badge":"PUSAT UTAMA","pins":[{"name":"Pasar Sumayyah","area":"Tumpat"}],"revealQuotes":["Okey deh ha bagi","boleh mari YaPakCik Frozen","Pasar Sumayyah Tumpat"]}}]
EMPH={"naik":"big","sokmo":"script","berubah":"script","bau":"big","hamis":"big","merah":"big","hitam":"big","gelap":"big","lama":"script","baru":"big","tips":"big","percuma":"big","cod":"big","runcit":"script","borong":"script"}
def project(name,title,shots,layers,cta=True):
    d=f"{ROOT}/src/edits/{name}"; os.makedirs(f"{d}/transcripts",exist_ok=True)
    json.dump({"project":name,"clips":{C:src["clips"][C]}},open(f"{d}/footage.json","w"),indent=1)
    shutil.copy(trp,f"{d}/transcripts/{C}.json")
    json.dump(facts,open(f"{d}/facts.json","w"),indent=1,ensure_ascii=False)
    e={"_readme":f"{title} — cut from the frozen-04 raw recording (clean 1080p). YPF brand motion kit on the ONE CANVAS system. Graphics only from spoken words or owner-confirmed facts; product shown only as real footage.",
       "project":name,"brand":"yapakcik-frozen","title":title,"shots":shots+(CTA_SHOTS(name[-1]) if cta else []),"layers":layers+(CTA_LAYERS if cta else []),
       "captions":{"enabled":True,"style":"minimal","combineMs":900,"uppercase":False,"position":0.7,"emphasis":EMPH,"hide":[]},
       "look":{"grade":"moody-true","gradeIntensity":0.7,"grain":True,"vignette":True,"breathing":0.012,"coverBands":[],"aiLabel":False,"canvas":"brand"},
       "audio":{"music":"music/story-documentary-bed.mp3","musicVolume":0.3,"duckTo":0.13,"sfx":"auto","sfxVolume":0.55,"voiceTargetLufs":-16,"cues":[]}}
    json.dump(e,open(f"{d}/edit.json","w"),indent=1,ensure_ascii=False)

# ── V1: harga & kenapa naik ──
project("frozen-04-v1","Harga daging slice: runcit, untuk jual, sekotak — kenapa harga naik?",[
 shot("h","HOOK: harga naik?",22.15,26.1,1.36,[P("harga naik lah",1.52)]),
 shot("p1","runcit 20, borong",0.0,5.3,1.3,[PUSH(1.38)],FADE),
 shot("p2","runcit 20, untuk jual 19, kotak 18.50",6.85,16.4,1.34),
 shot("p3","harga untuk tarikh hari ni",16.5,22.0,1.36,[P("setakat hari ni",1.48)]),
 shot("e1","bukan marketing; sentiasa berubah",26.15,33.3,1.3,[P("sentiasa berubah",1.44)]),
 shot("e2","naik sokmo, terpaksa",33.35,49.4,1.34,[P("naik sokmo",1.48),PO("Orang naik",1.32),P("tak leh nak buat apa",1.46)]),
],[
 {"id":"hook","type":"scene","at":Q("tanya naik pula tu"),"duration":2.8,"source":"transcript","evidence":T("kalau awak tanya naik pula tu harga naik lah"),
  "props":{"kind":"hook","y":120,"h":400,"words":[{"text":"harga","size":"l"},{"text":"naik?","size":"xl","style":"gold"}],"revealQuotes":["harga naik lah","naik lah"]}},
 {"id":"tiers","type":"scene","at":Q("kita jual runcit 20",offset=-0.6),"duration":15.4,"source":"facts","evidence":{"fact":"priceList"},
  "props":{"layout":"split","kind":"tiers","kicker":"daging slice · sepaket 900g","tiers":[{"price":"RM20","unit":"/ RUNCIT"},{"price":"RM19","unit":"/ UNTUK JUAL"},{"price":"RM18.50","unit":"/ AMBIL KOTAK"}],
           "revealQuotes":["runcit 20","kita tolak 19","wigo 18.50"]}},
 {"id":"ayoh","type":"scene","at":Q("Bukan kata Ayoh Mad"),"duration":3.0,"source":"facts","evidence":{"fact":"presenterName"},"props":{"kind":"nametag","name":"AYOH MAD","role":"YaPakCik Frozen"}},
 {"id":"trend","type":"scene","at":Q("Pasal harga ni sentiasa",offset=-0.2),"duration":9.6,"source":"transcript","evidence":T("Pasal harga ni sentiasa berubah daging ni bukan kata kita ni sengaja nak naik tapi memang barang naik sokmo"),
  "props":{"layout":"split","kind":"trend","kicker":"harga daging","title":"NAIK SOKMO","sub":"harga sentiasa berubah","revealQuotes":["harga ni sentiasa berubah","naik sokmo"]}},
])

# ── V2: tips pilih daging slice ──
t2=track(97.8,99.6)
project("frozen-04-v2","Tips pilih daging slice: merah vs gelap (stok lama, bau hamis)",[
 shot("h","HOOK: bau kuat, bau hamis",62.55,70.9,1.32,[P("Bau kuat",1.46)]),
 shot("t1","tips: try dulu sebelum jual",71.1,85.4,1.3,[PUSH(1.38),P("berdasarkan pengalaman",1.44)]),
 shot("t2","bau = stok lama",89.4,92.1,1.42),
 shot("t3","stok baru merah / hitam = lama",92.55,109.7,1.32,[P("dia daging merah molek",1.42),PO("hok bau ni biasanya",1.3)]),
 shot("t5a","CLOSE-UP belakang pek",144.1,153.0,1.42,focus={"x":0.7,"y":0.5}),
 shot("t5b","bau hamis, anak tak suka",152.95,160.6,1.34,[P("jadi tak suka daging",1.46)]),
 shot("t6","cari merah comel → YaPakCik Frozen",160.5,172.95,1.3,[P("Cari di YaPakCik",1.46)]),
 shot("t7","stok baru setiap hari",173.45,181.15,1.36,[PUSH(1.44)]),
],[
 {"id":"hook","type":"scene","at":Q("Bau kuat bau hamis"),"duration":2.2,"source":"transcript","evidence":T("Bau kuat bau hamis"),
  "props":{"kind":"hook","y":120,"h":380,"words":[{"text":"bau kuat,","size":"m"},{"text":"bau hamis?","size":"xl","style":"gold"}],"revealQuotes":["Bau kuat","bau hamis"]}},
 {"id":"tips","type":"scene","at":Q("tips tips salah satunya",offset=-0.2),"duration":2.0,"source":"transcript","evidence":T("tips tips salah satunya"),
  "props":{"kind":"hook","y":130,"h":300,"words":[{"text":"tips","size":"xl","style":"gold"},{"text":"salah satunya","size":"s"}],"revealAt":[0.1,0.6]}},
 {"id":"ayoh","type":"scene","at":Q("Ayoh Mad terima ni",offset=-0.6),"duration":3.2,"source":"facts","evidence":{"fact":"presenterName"},"props":{"kind":"nametag","name":"AYOH MAD","role":"Try dulu sebelum jual"}},
 {"id":"merah-real","type":"scene","at":Q("dia daging merah molek"),"duration":1.95,"source":"transcript","evidence":T("dia daging merah molek gitu deh"),
  "props":{"kind":"track","label":"MERAH · STOK BARU","track":t2}},
 {"id":"meat","type":"scene","at":Q("hok bau ni biasanya",offset=-0.1),"duration":10.7,"source":"transcript","evidence":T("hok bau ni biasanya dia jadi hitam dia jadi hitam kita tengok kat belakang tak jadi merah gelap sikit nak jadi hitam sikit tu maksudnya barang lamalah"),
  "props":{"layout":"split","kind":"meat","kicker":"daging slice","left":{"title":"MERAH","sub":"stok baru"},"right":{"title":"HITAM / GELAP","sub":"stok lama · bau"},
           "revealAt":[0,None,None],"revealQuotes":None}},
 {"id":"belakang","type":"scene","at":Q("tengok kat belakang gini"),"duration":9.8,"source":"transcript","evidence":T("kalau kita tengok kat belakang gini jadi gelap daging merah tu jadi nak jadi gelap tu tu maksudnya hok stok lamalah"),
  "props":{"kind":"hook","y":140,"h":360,"words":[{"text":"belakang gelap","size":"m"},{"text":"stok lama","size":"l","style":"gold"}],"revealQuotes":["belakang gini jadi gelap","hok stok lamalah"]}},
 {"id":"tips-list","type":"scene","at":Q("kalau nak mengelakkan daripada",offset=-0.3),"duration":7.6,"source":"transcript","evidence":T("kalau nak mengelakkan daripada daging bau tu awak cari daging hok merah-merah gini"),
  "props":{"layout":"split","kind":"list","kicker":"tips pilih daging slice","items":["Elak daging bau","Cari daging merah"],"icons":[],"revealQuotes":["mengelakkan daripada daging bau","cari daging hok merah-merah"]}},
 {"id":"stok-baru","type":"scene","at":Q("supply bagi yang baru setiap hari",offset=-0.2),"duration":5.0,"source":"transcript","evidence":T("InsyaAllah kita supply bagi yang baru setiap hari dan stok kita pun stok baru semua"),
  "props":{"kind":"hook","y":130,"h":400,"words":[{"text":"stok baru","size":"l","style":"gold"},{"text":"setiap hari","size":"m"}],"revealQuotes":["stok kita pun stok baru","baru setiap hari"]}},
 {"id":"ypf","type":"scene","at":Q("Cari di YaPakCik Frozen lah",offset=-0.1),"duration":2.0,"source":"transcript","evidence":T("Cari di YaPakCik Frozen lah"),
  "props":{"kind":"hook","y":130,"h":400,"words":[{"text":"cari di","size":"s"},{"text":"YaPakCik","size":"l"},{"text":"Frozen","size":"l","style":"gold"}],"revealAt":[0,0.25,0.5]}},
])
# meat reveal times computed from word timings (same shot t3)
m_at=wt("hok",98.9)-0.1
rv=[0.0, round(wt("hitam",101.0)-m_at,2), round(wt("gelap",105.5)-m_at,2)]
p=f"{ROOT}/src/edits/frozen-04-v2/edit.json"; e=json.load(open(p))
for l in e["layers"]:
    if l["id"]=="meat": l["props"]["revealAt"]=rv; l["props"].pop("revealQuotes",None)
json.dump(e,open(p,"w"),indent=1,ensure_ascii=False)

# ── V3: penghantaran percuma, harga semasa, PM ──
d_at=wt("ada",225.6)
project("frozen-04-v3","Penghantaran percuma, harga semasa & PM Ayoh Mad",[
 shot("h","HOOK: penghantaran percuma",219.47,224.2,1.34,[P("secara percuma",1.5)]),
 shot("d1","penghantaran: 1,000 ke atas",225.65,237.95,1.3,[PUSH(1.38)]),
 shot("d2","COD, PM Ayoh Mad",242.45,257.2,1.34,[P("COD",1.48),PO("Ha jadinya",1.32)]),
 shot("p","harga semasa runcit 20 / jual 19",187.65,192.5,1.36,[P("runcit 20 ya",1.46)],FADE),
 shot("w","WhatsApp / PM Ayoh Mad",193.75,199.25,1.32),
],[
 {"id":"hook","type":"scene","at":Q("perkhidmatan penghantaran secara percuma"),"duration":4.5,"source":"transcript","evidence":T("Kita juga menyediakan perkhidmatan penghantaran secara percuma"),
  "props":{"kind":"hook","y":120,"h":400,"words":[{"text":"penghantaran","size":"m"},{"text":"percuma","size":"xl","style":"gold"}],"revealQuotes":["perkhidmatan penghantaran","secara percuma"]}},
 {"id":"delivery","type":"scene","at":Q("Ada perkhidmatan penghantaran",offset=-0.1),"duration":12.3,"source":"facts","evidence":{"fact":"delivery"},
  "props":{"layout":"split","kind":"delivery","kicker":"YaPakCik Frozen","title":"PERCUMA","sub":"penghantaran",
           "rows":[{"title":"Warga Tumpat","chips":[{"text":"PERCUMA","free":True}]},
                   {"title":"Bachok · Ketereh · Melor","sub":"& kawasan berhampiran","chips":[{"text":"RM1,000 KE ATAS: PERCUMA","free":True},{"text":"BAWAH RM1,000: RM20"}]}],
           "revealAt":[0,round(wt("percuma",226.0)-d_at+0.1,2),round(wt("kuantiti",229)-d_at,2),round(wt("kuantiti",229)-d_at+0.3,2),round(wt("1,000",235)-d_at,2)]}},
 {"id":"cod","type":"scene","at":Q("cas juga COD"),"duration":2.2,"source":"transcript","evidence":T("cas juga COD"),
  "props":{"kind":"hook","y":140,"h":260,"words":[{"text":"COD","size":"xl","style":"gold"}],"revealQuotes":["COD"]}},
 {"id":"pm","type":"scene","at":Q("PM ko Ayoh Mad",occurrence=1),"duration":3.0,"source":"facts","evidence":{"fact":"presenterName"},"props":{"kind":"nametag","name":"PM AYOH MAD","role":"WhatsApp / PM"}},
 {"id":"harga","type":"scene","at":Q("Harga semasa lah ni",offset=-0.1),"duration":4.9,"source":"facts","evidence":{"fact":"priceList"},
  "props":{"layout":"split","kind":"tiers","kicker":"harga semasa · sepaket 900g","tiers":[{"price":"RM20","unit":"/ RUNCIT"},{"price":"RM19","unit":"/ UNTUK JUAL"}],"revealQuotes":["runcit 20 ya","orang jual 19 ya"]}},
 {"id":"contact","type":"scene","at":Q("Awak kena WhatsApp"),"duration":5.4,"source":"facts","evidence":{"fact":"whatsapp"},
  "props":{"layout":"split","kind":"contact","kicker":"WHATSAPP / PM","name":"AYOH MAD","number":"016-723 7170","revealQuotes":["WhatsApp ko Ayoh Mad","di nombor tertera"]}},
])
print("ok", rv)

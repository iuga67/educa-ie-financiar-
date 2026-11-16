/* =========================================================
   Bănuț — logică
   Progresul, obiectivele și certificatul se păstrează
   doar în browser (localStorage).
   ========================================================= */

"use strict";

const $ = (id) => document.getElementById(id);
const lei = (n) => `${Math.round(n).toLocaleString("ro-RO")} lei`;

/* ---------- Stocare ---------- */
const PREFIX = "banut_v1_";

function incarca(cheie, implicit) {
  try {
    const v = localStorage.getItem(PREFIX + cheie);
    return v ? JSON.parse(v) : implicit;
  } catch {
    return implicit;
  }
}

function salveaza(cheie, valoare) {
  try { localStorage.setItem(PREFIX + cheie, JSON.stringify(valoare)); } catch { /* indisponibil */ }
}

const stare = {
  xp: incarca("xp", 0),
  lectii: incarca("lectii", []),
  quizRecord: incarca("quiz_record", null),
  jocRecord: incarca("joc_record", null),
  obiective: incarca("obiective", []),
  nume: incarca("nume", ""),
};

function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text == null ? "" : String(text);
  return d.innerHTML;
}

function notifica(html) {
  const t = $("toast");
  t.innerHTML = html;
  t.classList.add("vizibil");
  clearTimeout(notifica.timer);
  notifica.timer = setTimeout(() => t.classList.remove("vizibil"), 3000);
}

/* ---------- XP și niveluri ---------- */
const NIVELURI = [
  { prag: 0, nume: "Începător" },
  { prag: 40, nume: "Econom în devenire" },
  { prag: 100, nume: "Planificator" },
  { prag: 180, nume: "Investitor informat" },
  { prag: 260, nume: "Maestru al bugetului" },
];

function nivel(xp) {
  let i = 0;
  NIVELURI.forEach((n, k) => { if (xp >= n.prag) i = k; });
  return { ...NIVELURI[i], urmator: NIVELURI[i + 1] || null };
}

function adaugaXp(n, motiv) {
  if (n <= 0) return;
  const vechi = nivel(stare.xp).nume;
  stare.xp += n;
  salveaza("xp", stare.xp);
  const nou = nivel(stare.xp).nume;
  randeazaNivel();
  const card = document.querySelector(".card-nivel");
  card.classList.remove("creste");
  void card.offsetWidth;
  card.classList.add("creste");
  notifica(nou !== vechi ? `Nivel nou: <b>${nou}</b> · +${n} XP` : `${motiv} · <b>+${n} XP</b>`);
}

function randeazaNivel() {
  const n = nivel(stare.xp);
  $("xp").textContent = stare.xp;
  $("nivel-nume").textContent = n.nume;
  if (n.urmator) {
    const p = ((stare.xp - n.prag) / (n.urmator.prag - n.prag)) * 100;
    $("nivel-bara").style.width = `${p}%`;
    $("nivel-urmator").textContent = `${n.urmator.prag - stare.xp} XP până la „${n.urmator.nume}”`;
  } else {
    $("nivel-bara").style.width = "100%";
    $("nivel-urmator").textContent = "Ai atins nivelul maxim. Bravo!";
  }
}

/* =========================================================
   LECȚII
   ========================================================= */
const ICON_LECTIE = {
  buget: '<rect x="8" y="16" width="48" height="34" rx="7"/><path d="M8 25h48"/><rect x="40" y="31" width="16" height="10" rx="3"/><path d="M16 16l22-8 6 8"/>',
  balanta: '<path d="M32 10v42M20 54h24M12 18h40"/><path d="M12 18 5 34a7 7 0 0 0 14 0zM52 18l-7 16a7 7 0 0 0 14 0z"/>',
  crestere: '<path d="M32 56V30"/><path d="M32 34C32 23 24 17 13 17c0 11 8 17 19 17zM32 30c0-11 8-17 19-17 0 11-8 17-19 17z"/><path d="M20 56h24"/>',
  card: '<rect x="6" y="14" width="52" height="36" rx="7"/><path d="M6 24h52M14 40h12M34 40h6"/>',
  inflatie: '<path d="M8 52h48M14 44l12-13 9 8 17-19"/><path d="M43 20h9v9"/>',
  scut: '<path d="M32 6 52 14v16c0 13-9 22-20 26-11-4-20-13-20-26V14z"/><rect x="24" y="28" width="16" height="12" rx="2"/><path d="M27 28v-4a5 5 0 0 1 10 0v4"/>',
};

const LECTII = [
  {
    id: "buget", icon: "buget", culoare: "l-violet", minute: 4,
    titlu: "Ce este un buget",
    scurt: "Planul simplu care îți spune unde se duc banii — înainte să dispară.",
    pagini: [
      { titlu: "Un plan pentru banii tăi", html: `<p>Un buget e un plan simplu: <strong>câți bani intră</strong> și <strong>pe ce ies</strong>. Nu înseamnă să nu mai cheltui nimic. Înseamnă că decizi tu unde merg banii, înainte să se ducă singuri.</p><p>Fără un plan, banii se scurg pe lucruri mici pe care nici nu le mai ții minte la sfârșitul lunii.</p><div class="caseta">Un buget bun e unul pe care chiar îl poți respecta.</div>` },
      { titlu: "Regula 50/30/20", html: `<p>O regulă ușor de ținut minte împarte banii în trei:</p><ul><li><strong>50% — nevoi</strong>: lucruri fără de care nu te descurci (transport, mâncare, telefon).</li><li><strong>30% — dorințe</strong>: lucruri care îți fac viața mai frumoasă (ieșiri, jocuri, haine în plus).</li><li><strong>20% — economii</strong>: bani puși deoparte pentru mai târziu.</li></ul><div class="bare-exemplu"><div style="width:50%;background:#6c4cf5">50% nevoi</div><div style="width:30%;background:#ff9f7a">30%</div><div style="width:20%;background:#2fc99a">20%</div></div><p style="margin-top:.9rem">E un punct de plecare, nu o lege. Dacă nu ai cheltuieli fixe mari, poți economisi chiar mai mult.</p>` },
      { titlu: "Află unde se duc banii", html: `<p>Timp de o lună, notează tot ce cumperi. Poți folosi:</p><ul><li>o notiță în telefon;</li><li>bonurile de la casă;</li><li>istoricul din aplicația băncii, dacă ai card.</li></ul><p>Vei descoperi „scurgerile”. De exemplu, un suc de 5 lei în fiecare zi înseamnă aproximativ <strong>150 de lei pe lună</strong>.</p><div class="caseta piersica">Nu te judeca. Scopul e doar să vezi clar ce se întâmplă.</div>` },
      { titlu: "De reținut", html: `<ul><li>Bugetul e un plan, nu o pedeapsă.</li><li>50/30/20 e o regulă de pornire bună.</li><li>Ca să faci un plan realist, întâi notează ce cheltui o lună.</li></ul><div class="caseta menta">Încearcă acum calculatorul de buget de mai jos, cu banii tăi reali.</div>` },
    ],
    verificare: { intrebare: "Primești 400 de lei pe lună. După regula 50/30/20, cât ar trebui să pui deoparte?", variante: ["40 de lei", "80 de lei", "200 de lei"], corect: 1, explicatie: "20% din 400 de lei înseamnă 80 de lei." },
  },
  {
    id: "nevoi", icon: "balanta", culoare: "l-piersica", minute: 4,
    titlu: "Nevoi sau dorințe",
    scurt: "Cum faci diferența și cum te ferești de cumpărăturile din impuls.",
    pagini: [
      { titlu: "Două feluri de cheltuieli", html: `<p><strong>Nevoile</strong> sunt lucrurile fără de care nu poți funcționa normal: mâncarea, transportul spre școală, medicamentele, hainele potrivite pentru anotimp.</p><p><strong>Dorințele</strong> îți fac viața mai plăcută, dar poți trăi și fără ele: încă o pereche de adidași, un joc nou, ieșirile în oraș.</p><div class="caseta">Dorințele nu sunt rele. Problema apare doar când ajung să ia locul nevoilor sau al economiilor.</div>` },
      { titlu: "Același lucru poate fi ambele", html: `<p>Un telefon poate fi o nevoie: ai nevoie de el ca să comunici și să înveți. Dar <strong>cel mai nou model</strong>, când al tău funcționează bine, e o dorință.</p><p>La fel, o geacă de iarnă e o nevoie. A treia geacă de iarnă e o dorință.</p><p>Întrebarea potrivită e: <strong>„Ce se întâmplă dacă nu cumpăr asta?”</strong></p>` },
      { titlu: "Regula celor 48 de ore", html: `<p>Înainte de o cumpărătură pe care nu ai plănuit-o, așteaptă 48 de ore. Dacă după două zile încă o vrei și ai banii în buget, cumpăr-o liniștit.</p><p>Un alt truc: transformă prețul în timp. Dacă un job îți aduce 20 de lei pe oră, niște căști de 300 de lei înseamnă <strong>15 ore de muncă</strong>. Merită?</p><div class="caseta piersica">Reclamele și reducerile „doar azi” sunt făcute special ca să nu mai aștepți.</div>` },
      { titlu: "De reținut", html: `<ul><li>Nevoile vin primele, apoi economiile, apoi dorințele.</li><li>Întreabă-te: „Ce se întâmplă dacă nu cumpăr asta?”</li><li>Pentru cumpărăturile neplanificate, așteaptă 48 de ore.</li></ul><div class="caseta menta">Exersează în jocul „Nevoie sau dorință?”.</div>` },
    ],
    verificare: { intrebare: "Care dintre acestea este o nevoie?", variante: ["Al treilea abonament de streaming", "Abonamentul de transport cu care mergi la școală", "Un skin nou într-un joc"], corect: 1, explicatie: "Fără transport nu ajungi la școală. Celelalte două sunt dorințe." },
  },
  {
    id: "economii", icon: "crestere", culoare: "l-menta", minute: 5,
    titlu: "Economisirea și dobânda compusă",
    scurt: "De ce contează să începi devreme, chiar și cu sume mici.",
    pagini: [
      { titlu: "De ce economisim?", html: `<p>Economisim pentru două lucruri:</p><ul><li><strong>Obiective</strong>: o bicicletă, o tabără, primul laptop.</li><li><strong>Neprevăzut</strong>: un telefon spart, o reparație, o cheltuială la care nu te așteptai.</li></ul><p>Adulții încearcă să aibă un <strong>fond de urgență</strong> cât cheltuielile pe 3–6 luni. Pentru tine, un început bun e o sumă mică, pusă deoparte doar pentru situații neprevăzute.</p>` },
      { titlu: "Plătește-te pe tine primul", html: `<p>Greșeala obișnuită: cheltui ce ai și economisești „ce rămâne”. De obicei nu rămâne nimic.</p><p>Fă invers: <strong>când primești bani, pune întâi deoparte</strong> partea pentru economii, apoi cheltui restul.</p><div class="caseta">Chiar și 10% din banii de buzunar, puși deoparte în fiecare lună, devin un obicei care te ajută toată viața.</div>` },
      { titlu: "Dobânda compusă", html: `<p>Dobânda e plata pe care o primești pentru că ții banii într-un cont de economii sau într-un depozit.</p><p><strong>Compusă</strong> înseamnă că primești dobândă și la dobânda câștigată înainte. Banii tăi încep să facă bani.</p><p>Exemplu: dacă pui <strong>100 de lei pe lună</strong>, la o dobândă de <strong>5% pe an</strong>, după <strong>10 ani</strong> ai aproximativ <strong>15.528 de lei</strong>, deși ai depus doar 12.000.</p><div class="caseta piersica">Exemplul e simplificat. Dobânzile reale diferă și se schimbă în timp, iar băncile pot avea comisioane și se plătește impozit pe dobândă.</div>` },
      { titlu: "Timpul e cel mai bun prieten", html: `<p>Cu aceiași 100 de lei pe lună și aceeași dobândă, dar timp de <strong>20 de ani</strong>, ajungi la aproximativ <strong>41.100 de lei</strong>, deși ai depus doar 24.000.</p><p>Ai depus de două ori mai mult, dar ai de aproape trei ori mai mulți bani. Asta e puterea timpului.</p><div class="caseta menta">Încearcă simulatorul de dobândă compusă și mută cursorul pentru ani.</div>` },
    ],
    verificare: { intrebare: "Ce înseamnă dobânda compusă?", variante: ["Primești dobândă doar la suma de la început", "Primești dobândă și la dobânda câștigată înainte", "O taxă pe care o plătești băncii"], corect: 1, explicatie: "Dobânda se adaugă la sumă, iar data viitoare se calculează dobândă și la ea." },
  },
  {
    id: "carduri", icon: "card", culoare: "l-cer", minute: 5,
    titlu: "Card de debit vs. card de credit",
    scurt: "Arată la fel, dar funcționează complet diferit.",
    pagini: [
      { titlu: "Cardul de debit", html: `<p>Cardul de debit e legat de contul tău. Când plătești, <strong>banii ies direct din cont</strong>. Dacă ai 200 de lei, poți cheltui cel mult 200 de lei.</p><p>Mulți tineri pot avea un card de debit înainte de 18 ani, cu acordul părinților. E un mod bun de a învăța să-ți urmărești banii, pentru că vezi fiecare plată în aplicație.</p>` },
      { titlu: "Cardul de credit", html: `<p>Cardul de credit îți oferă <strong>bani împrumutați de la bancă</strong>, până la o anumită limită.</p><ul><li>Dacă returnezi <strong>toată suma</strong> până la data scadentă, de obicei nu plătești dobândă. Perioada asta se numește <strong>perioadă de grație</strong>.</li><li>Dacă plătești doar o parte, banca îți calculează dobândă la ce a rămas. Dobânzile la cardurile de credit sunt printre cele mai mari.</li></ul><div class="caseta piersica">Un card de credit nu înseamnă bani în plus. Înseamnă bani pe care trebuie să-i dai înapoi.</div>` },
      { titlu: "DAE: costul real al unui credit", html: `<p>Când compari două credite, nu te uita doar la rata dobânzii. Uită-te la <strong>DAE — dobânda anuală efectivă</strong>.</p><p>DAE include și comisioanele, așa că îți arată mai corect cât te costă de fapt creditul pe un an.</p><div class="caseta">Un credit cu dobândă mică, dar cu comisioane mari, poate fi mai scump decât pare.</div>` },
      { titlu: "De reținut", html: `<ul><li>Debit = banii tăi. Credit = banii băncii, pe care îi returnezi.</li><li>La cardul de credit, plătește toată suma la timp.</li><li>Compară creditele după DAE.</li><li>Nu spune nimănui PIN-ul și nu trimite poze cu cardul.</li></ul>` },
    ],
    verificare: { intrebare: "Ce îți arată DAE?", variante: ["Doar rata dobânzii", "Costul total al creditului pe un an, cu tot cu comisioane", "Câți bani ai în cont"], corect: 1, explicatie: "DAE adună dobânda și costurile, deci arată costul real al creditului." },
  },
  {
    id: "inflatie", icon: "inflatie", culoare: "l-galben", minute: 4,
    titlu: "Inflația pe înțelesul tuturor",
    scurt: "De ce aceiași bani cumpără mai puțin cu fiecare an.",
    pagini: [
      { titlu: "Ce este inflația?", html: `<p>Inflația înseamnă că <strong>prețurile cresc, în general</strong>, de la un an la altul. Cu aceeași sumă de bani poți cumpăra, în timp, mai puține lucruri.</p><p>Poate ai auzit de la părinți cât costa o pâine sau un bilet de autobuz acum câțiva ani. Diferența aceea e, în mare parte, efectul inflației.</p>` },
      { titlu: "Banii de la saltea", html: `<p>Să zicem că inflația e de <strong>5% pe an</strong>. Dacă ții <strong>1.000 de lei</strong> în sertar timp de <strong>10 ani</strong>, la final vei putea cumpăra cu ei cam cât cumperi azi cu <strong>614 lei</strong>.</p><p>Banii nu dispar, dar <strong>pierd din valoare</strong>.</p><div class="caseta piersica">Inflația din exemplu e aleasă doar ca să fie ușor de calculat. Cea reală se schimbă de la an la an.</div>` },
      { titlu: "Cine o măsoară și cum te aperi", html: `<p>În România, inflația e măsurată de <strong>Institutul Național de Statistică (INS)</strong>, iar <strong>Banca Națională a României (BNR)</strong> încearcă să o țină sub control.</p><p>Banii ținuți într-un cont cu dobândă pot acoperi o parte din inflație. Dacă dobânda e mai mică decât inflația, tot pierzi din puterea de cumpărare, doar mai încet.</p>` },
      { titlu: "De reținut", html: `<ul><li>Inflația = prețurile cresc în timp.</li><li>Banii ținuți „la saltea” pierd din valoare.</li><li>Compară mereu dobânda primită cu inflația.</li></ul><div class="caseta menta">Încearcă calculatorul de inflație ca să vezi efectul pe suma ta.</div>` },
    ],
    verificare: { intrebare: "O inflație de 5% pe an înseamnă că...", variante: ["Prețurile scad cu 5%", "În medie, prețurile cresc cu aproximativ 5% într-un an", "Salariile cresc automat cu 5%"], corect: 1, explicatie: "Inflația măsoară cât cresc prețurile, în medie, într-un an." },
  },
  {
    id: "siguranta", icon: "scut", culoare: "l-roz", minute: 5,
    titlu: "Siguranța banilor online",
    scurt: "Cum recunoști o înșelătorie înainte să fie prea târziu.",
    pagini: [
      { titlu: "Ce este phishingul?", html: `<p><strong>Phishingul</strong> înseamnă mesaje, e-mailuri sau site-uri false care se dau drept banca ta, un curier sau un magazin, ca să-ți fure datele sau banii.</p><p>Arată tot mai convingător: au sigla băncii, un ton oficial și un link care seamănă cu cel adevărat.</p>` },
      { titlu: "Semnale de alarmă", html: `<ul><li><strong>Grabă</strong>: „Contul tău va fi blocat azi!”</li><li><strong>Linkuri ciudate</strong> sau adrese cu greșeli mici (de exemplu, o literă schimbată).</li><li>Ți se cere <strong>PIN-ul, parola sau codul primit prin SMS</strong>.</li><li><strong>Premii</strong> pe care nu le-ai cerut sau colete pe care nu le aștepți.</li><li><strong>Investiții „garantate”</strong> cu câștiguri uriașe și rapide.</li></ul>` },
      { titlu: "Regula de aur", html: `<p>Banca nu îți cere niciodată <strong>PIN-ul, parola sau codul primit prin SMS</strong> — nici la telefon, nici prin mesaj, nici prin e-mail.</p><p>Codul din SMS confirmă o plată sau o autentificare. Cine ți-l cere vrea, de fapt, să facă el plata.</p><div class="caseta">Dacă ai vreun dubiu, închide și sună tu la bancă, la numărul de pe spatele cardului sau de pe site-ul oficial.</div>` },
      { titlu: "Dacă ai pățit-o", html: `<ul><li>Sună <strong>imediat</strong> la bancă și cere blocarea cardului.</li><li>Blochează cardul și din aplicație, dacă poți.</li><li>Schimbă parolele conturilor.</li><li>Spune unui adult de încredere. Nu e vina ta: escrocii sunt profesioniști.</li></ul><div class="caseta menta">Cu cât reacționezi mai repede, cu atât sunt șanse mai mari să recuperezi banii.</div>` },
    ],
    verificare: { intrebare: "Primești un SMS „de la bancă” care îți cere codul primit prin SMS ca să-ți „deblochezi contul”. Ce faci?", variante: ["Trimiți repede codul, ca să nu se blocheze contul", "Nu trimiți nimic și suni tu la bancă, la numărul oficial", "Răspunzi cu PIN-ul cardului, e mai sigur"], corect: 1, explicatie: "Banca nu îți cere niciodată codul din SMS. E o tentativă de înșelătorie." },
  },
];

const BIFA = '<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>';

function randeazaLectii() {
  $("grila-lectii").innerHTML = LECTII.map((l, i) => {
    const gata = stare.lectii.includes(l.id);
    return `
      <button type="button" class="lectie ${l.culoare}" data-lectie="${i}">
        ${gata ? `<span class="bifa-lectie" title="Lecție terminată">${BIFA}</span>` : ""}
        <span class="lectie-ilustratie"><svg viewBox="0 0 64 64" aria-hidden="true">${ICON_LECTIE[l.icon]}</svg></span>
        <span class="lectie-meta"><span>Lecția ${i + 1}</span><span>${gata ? "Terminată · +20 XP" : `${l.minute} min · ${l.pagini.length} pagini`}</span></span>
        <h3>${l.titlu}</h3>
        <p>${l.scurt}</p>
      </button>`;
  }).join("");

  const n = stare.lectii.length;
  const p = Math.round((n / LECTII.length) * 100);
  $("meniu-lectii").textContent = `${n}/${LECTII.length}`;
  $("inel-lectii").style.setProperty("--p", p);
  $("procent-lectii").textContent = `${p}%`;
  $("text-progres").textContent = `${n} din ${LECTII.length} lecții terminate`;
  const urmatoarea = LECTII.findIndex((l) => !stare.lectii.includes(l.id));
  $("continua-lectia").textContent = n === 0 ? "Începe prima lecție" : urmatoarea === -1 ? "Recitește o lecție" : `Continuă cu lecția ${urmatoarea + 1}`;
}

/* ---------- Cititorul ---------- */
const cititor = { lectie: 0, pagina: 0, raspuns: false };

function deschideLectia(i) {
  cititor.lectie = i;
  cititor.pagina = 0;
  cititor.raspuns = false;
  randeazaPagina();
  $("cititor").showModal();
}

function randeazaPagina() {
  const l = LECTII[cititor.lectie];
  const total = l.pagini.length + 1; // + verificarea
  const p = cititor.pagina;
  $("cititor-numar").textContent = `Lecția ${cititor.lectie + 1} · ${l.titlu}`;
  $("cititor-titlu").textContent = p < l.pagini.length ? l.pagini[p].titlu : "Verifică ce ai învățat";
  $("cititor-progres").innerHTML = Array.from({ length: total }, (_, k) => `<i class="${k <= p ? "gata" : ""}"></i>`).join("");
  $("cititor-pagina").textContent = `${p + 1} / ${total}`;
  $("pagina-inapoi").disabled = p === 0;

  if (p < l.pagini.length) {
    $("cititor-corp").innerHTML = `<div class="pagina">${l.pagini[p].html}</div>`;
    $("pagina-inainte").textContent = p === l.pagini.length - 1 ? "La întrebare" : "Mai departe";
    $("pagina-inainte").disabled = false;
  } else {
    const v = l.verificare;
    $("cititor-corp").innerHTML = `
      <div class="pagina verificare">
        <h3>${v.intrebare}</h3>
        <div class="variante">${v.variante.map((t, k) => `<button type="button" class="varianta" data-varianta="${k}">${t}</button>`).join("")}</div>
        <p class="raspuns-verificare" id="raspuns-verificare"></p>
      </div>`;
    $("pagina-inainte").textContent = stare.lectii.includes(l.id) ? "Închide" : "Termină lecția";
    $("pagina-inainte").disabled = !cititor.raspuns && !stare.lectii.includes(l.id);
  }
  $("cititor-corp").scrollTop = 0;
}

$("cititor-corp").addEventListener("click", (e) => {
  const b = e.target.closest(".varianta");
  if (!b || cititor.raspuns) return;
  const v = LECTII[cititor.lectie].verificare;
  const ales = Number(b.dataset.varianta);
  const butoane = document.querySelectorAll(".varianta");
  butoane[v.corect].classList.add("corect");
  if (ales === v.corect) {
    cititor.raspuns = true;
    butoane.forEach((x) => { x.disabled = true; });
    $("raspuns-verificare").textContent = `Corect! ${v.explicatie}`;
    $("raspuns-verificare").style.color = "#128061";
    $("pagina-inainte").disabled = false;
  } else {
    b.classList.add("gresit");
    b.disabled = true;
    butoane[v.corect].classList.remove("corect");
    $("raspuns-verificare").textContent = "Nu chiar. Mai încearcă — poți să te întorci la paginile de dinainte.";
    $("raspuns-verificare").style.color = "#b42d4a";
  }
});

$("pagina-inainte").addEventListener("click", () => {
  const l = LECTII[cititor.lectie];
  if (cititor.pagina < l.pagini.length) {
    cititor.pagina += 1;
    randeazaPagina();
    return;
  }
  if (!stare.lectii.includes(l.id)) {
    stare.lectii.push(l.id);
    salveaza("lectii", stare.lectii);
    adaugaXp(20, `Lecția „${l.titlu}” terminată`);
    randeazaLectii();
    randeazaCertificat();
  }
  $("cititor").close();
});

$("pagina-inapoi").addEventListener("click", () => {
  if (cititor.pagina > 0) { cititor.pagina -= 1; randeazaPagina(); }
});

$("inchide-cititor").addEventListener("click", () => $("cititor").close());
$("cititor").addEventListener("click", (e) => { if (e.target === $("cititor")) $("cititor").close(); });

$("grila-lectii").addEventListener("click", (e) => {
  const b = e.target.closest("[data-lectie]");
  if (b) deschideLectia(Number(b.dataset.lectie));
});

$("continua-lectia").addEventListener("click", () => {
  const i = LECTII.findIndex((l) => !stare.lectii.includes(l.id));
  deschideLectia(i === -1 ? 0 : i);
});

/* =========================================================
   CALCULATOARE
   ========================================================= */
document.querySelector(".file").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  document.querySelectorAll(".file button").forEach((x) => {
    x.classList.toggle("activ", x === b);
    x.setAttribute("aria-selected", x === b);
  });
  document.querySelectorAll(".fila-panou").forEach((p) => { p.hidden = p.dataset.panou !== b.dataset.fila; });
  if (b.dataset.fila === "dobanda") calculeazaDobanda();
});

function actualizeazaCursor(el) {
  el.style.setProperty("--p", `${((el.value - el.min) / (el.max - el.min)) * 100}%`);
}

const valoare = (id) => Math.max(0, Number($(id).value) || 0);

/* ---------- Buget ---------- */
function calculeazaBuget() {
  const venit = valoare("buget-venit");
  const real = { nevoi: valoare("buget-nevoi"), dorinte: valoare("buget-dorinte"), economii: valoare("buget-economii") };
  const recomandat = { nevoi: venit * 0.5, dorinte: venit * 0.3, economii: venit * 0.2 };
  const totalReal = real.nevoi + real.dorinte + real.economii;
  const baza = Math.max(venit, totalReal, 1);

  // gogoașa arată cum împarți acum banii
  const p1 = (real.nevoi / baza) * 100;
  const p2 = p1 + (real.dorinte / baza) * 100;
  const p3 = p2 + (real.economii / baza) * 100;
  $("gogoasa").style.background = `conic-gradient(var(--violet) 0 ${p1}%, var(--piersica) ${p1}% ${p2}%, var(--menta) ${p2}% ${p3}%, var(--linie) ${p3}% 100%)`;
  $("buget-total").textContent = Math.round(venit).toLocaleString("ro-RO");

  const procent = (x) => (venit ? Math.round((x / venit) * 100) : 0);
  const nealocat = Math.max(0, venit - totalReal);
  $("legenda-buget").innerHTML = `
    <li><i class="punct violet"></i>Nevoi <small>${procent(real.nevoi)}%</small><b>${lei(real.nevoi)}</b></li>
    <li><i class="punct piersica"></i>Dorințe <small>${procent(real.dorinte)}%</small><b>${lei(real.dorinte)}</b></li>
    <li><i class="punct menta"></i>Economii <small>${procent(real.economii)}%</small><b>${lei(real.economii)}</b></li>
    ${nealocat > 0 ? `<li><i class="punct" style="background:var(--linie-2)"></i>Neplanificat <b>${lei(nealocat)}</b></li>` : ""}`;

  const culori = { nevoi: "var(--violet)", dorinte: "var(--piersica)", economii: "var(--menta)" };
  const nume = { nevoi: "Nevoi", dorinte: "Dorințe", economii: "Economii" };
  const max = Math.max(1, ...Object.values(real), ...Object.values(recomandat));
  $("comparatie-buget").innerHTML = Object.keys(real).map((k) => `
    <div class="comp-rand">
      <span>${nume[k]}</span>
      <span class="comp-bare">
        <i class="recomandat" style="width:${(recomandat[k] / max) * 100}%"></i>
        <i style="width:${(real[k] / max) * 100}%;background:${culori[k]}"></i>
      </span>
      <span class="valoare">${lei(real[k])}<small>recomandat ${lei(recomandat[k])}</small></span>
    </div>`).join("");

  const sfat = $("sfat-buget");
  if (!venit) {
    sfat.className = "sfat atentie";
    sfat.textContent = "Scrie câți bani primești pe lună ca să vezi recomandările.";
  } else if (totalReal > venit) {
    sfat.className = "sfat rau";
    sfat.textContent = `Planul tău depășește cu ${lei(totalReal - venit)} banii pe care îi primești. Încearcă să tai din dorințe.`;
  } else if (real.economii >= recomandat.economii) {
    sfat.className = "sfat bine";
    sfat.textContent = `Excelent! Economisești ${procent(real.economii)}% din bani — chiar peste recomandarea de 20%.`;
  } else {
    const lipsa = recomandat.economii - real.economii;
    sfat.className = "sfat atentie";
    sfat.textContent = real.dorinte > recomandat.dorinte
      ? `Economisești ${procent(real.economii)}%. Dacă muți ${lei(lipsa)} de la dorințe la economii, ajungi la 20%.`
      : `Economisești ${procent(real.economii)}%. Încă ${lei(lipsa)} pe lună și ajungi la 20%.`;
  }
}

["buget-venit", "buget-nevoi", "buget-dorinte", "buget-economii"].forEach((id) => $(id).addEventListener("input", calculeazaBuget));

/* ---------- Dobânda compusă ---------- */
function simuleaza(initial, lunar, rataAn, ani) {
  const r = rataAn / 100 / 12;
  let sold = initial;
  let depus = initial;
  const puncte = [{ an: 0, sold, depus }];
  for (let luna = 1; luna <= ani * 12; luna++) {
    sold = sold * (1 + r) + lunar;
    depus += lunar;
    if (luna % 12 === 0) puncte.push({ an: luna / 12, sold, depus });
  }
  return puncte;
}

function formatScurt(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} mil.`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(Math.round(n));
}

function deseneazaGrafic(puncte) {
  const L = 600, H = 260, st = 46, dr = 16, sus = 14, jos = 30;
  const max = Math.max(...puncte.map((p) => p.sold)) * 1.08 || 1;
  const ani = puncte[puncte.length - 1].an || 1;
  const x = (an) => st + (an / ani) * (L - st - dr);
  const y = (v) => sus + (1 - v / max) * (H - sus - jos);

  const linie = (cheie) => puncte.map((p, i) => `${i ? "L" : "M"}${x(p.an).toFixed(1)},${y(p[cheie]).toFixed(1)}`).join(" ");
  const zona = `${linie("sold")} L${x(ani)},${y(0)} L${x(0)},${y(0)} Z`;

  const gradatii = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = (max / 1.08) * f;
    return `<line class="axa" x1="${st}" x2="${L - dr}" y1="${y(v)}" y2="${y(v)}"/><text class="eticheta" x="${st - 8}" y="${y(v) + 4}" text-anchor="end">${formatScurt(v)}</text>`;
  }).join("");

  const pas = Math.max(1, Math.ceil(ani / 8));
  const etAni = puncte.filter((p) => p.an % pas === 0 || p.an === ani)
    .map((p) => `<text class="eticheta" x="${x(p.an)}" y="${H - 8}" text-anchor="middle">${p.an === 0 ? "acum" : p.an + " ani"}</text>`).join("");

  const ultim = puncte[puncte.length - 1];
  $("grafic-dobanda").innerHTML = `
    <svg viewBox="0 0 ${L} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="g-zona" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c4cf5" stop-opacity="0.28"/><stop offset="1" stop-color="#6c4cf5" stop-opacity="0"/></linearGradient></defs>
      ${gradatii}
      <path class="zona" d="${zona}"/>
      <path class="linie-depus" d="${linie("depus")}"/>
      <path class="linie-dobanda" d="${linie("sold")}"/>
      <circle class="punct-final" cx="${x(ultim.an)}" cy="${y(ultim.sold)}" r="6"/>
      ${etAni}
    </svg>`;
}

function calculeazaDobanda() {
  const rata = Number($("d-rata").value);
  const ani = Number($("d-ani").value);
  $("d-rata-val").textContent = `${String(rata).replace(".", ",")}%`;
  $("d-ani-val").textContent = `${ani} ${ani === 1 ? "an" : "ani"}`;
  actualizeazaCursor($("d-rata"));
  actualizeazaCursor($("d-ani"));
  const puncte = simuleaza(valoare("d-initial"), valoare("d-lunar"), rata, ani);
  const ultim = puncte[puncte.length - 1];
  $("d-depus").textContent = lei(ultim.depus);
  $("d-castig").textContent = `+${lei(ultim.sold - ultim.depus)}`;
  $("d-final").textContent = lei(ultim.sold);
  deseneazaGrafic(puncte);
}

["d-initial", "d-lunar", "d-rata", "d-ani"].forEach((id) => $(id).addEventListener("input", calculeazaDobanda));

/* ---------- Inflația ---------- */
function calculeazaInflatie() {
  const suma = valoare("i-suma");
  const rata = Number($("i-rata").value);
  const ani = Number($("i-ani").value);
  $("i-rata-val").textContent = `${String(rata).replace(".", ",")}%`;
  $("i-ani-val").textContent = `${ani} ${ani === 1 ? "an" : "ani"}`;
  actualizeazaCursor($("i-rata"));
  actualizeazaCursor($("i-ani"));
  const ramas = suma / Math.pow(1 + rata / 100, ani);
  $("i-suma-text").textContent = lei(suma);
  $("i-ani-text").textContent = `${ani} ${ani === 1 ? "an" : "ani"}`;
  $("i-rezultat").textContent = lei(ramas);
  const raport = suma ? ramas / suma : 1;
  const pline = Math.round(raport * 10);
  $("cos").innerHTML = Array.from({ length: 10 }, (_, i) => `<i class="${i < pline ? "" : "pierdut"}"></i>`).join("");
  $("i-explicatie").textContent = suma
    ? `Puterea de cumpărare scade cu aproximativ ${Math.round((1 - raport) * 100)}%. Fiecare pătrățel din coș înseamnă o zecime din ce poți cumpăra azi.`
    : "";
}

["i-suma", "i-rata", "i-ani"].forEach((id) => $(id).addEventListener("input", calculeazaInflatie));

/* =========================================================
   OBIECTIVE
   ========================================================= */
const CULORI_OBIECTIV = ["var(--violet)", "var(--piersica)", "var(--menta)", "var(--cer)", "var(--roz)"];

function luniPana(termen) {
  const [an, luna] = termen.split("-").map(Number);
  const azi = new Date();
  return (an - azi.getFullYear()) * 12 + (luna - 1 - azi.getMonth());
}

function randeazaObiective() {
  const lista = $("lista-obiective");
  $("numar-obiective").textContent = stare.obiective.length;
  if (!stare.obiective.length) {
    lista.innerHTML = `<div class="gol-obiective"><strong>Niciun obiectiv încă</strong><span>Adaugă primul tău obiectiv în formular. Îți calculăm cât să pui deoparte lunar.</span></div>`;
    return;
  }
  lista.innerHTML = stare.obiective.map((o, i) => {
    const p = Math.min(100, Math.round((o.strans / o.tinta) * 100));
    const ramas = Math.max(0, o.tinta - o.strans);
    const luni = luniPana(o.termen);
    const atins = ramas === 0;
    let lunar;
    if (atins) lunar = "Obiectiv atins! Bravo!";
    else if (luni <= 0) lunar = `Termenul a trecut. Îți mai lipsesc <b>${lei(ramas)}</b>.`;
    else lunar = `Pune deoparte <b>${lei(Math.ceil(ramas / luni))} pe lună</b>, timp de ${luni} ${luni === 1 ? "lună" : "luni"}.`;
    const data = new Date(o.termen + "-01T12:00:00").toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
    return `
      <article class="obiectiv ${atins ? "atins" : ""}" data-index="${i}">
        <button type="button" class="btn-x sterge" data-act="sterge" aria-label="Șterge obiectivul"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        <div class="obiectiv-sus">
          <div class="inel-mare" style="--p:${p};--culoare:${atins ? "var(--menta)" : CULORI_OBIECTIV[i % CULORI_OBIECTIV.length]}"><span>${p}%</span></div>
          <div>
            <h4>${escapeHtml(o.nume)}</h4>
            <p class="obiectiv-suma"><b>${lei(o.strans)}</b> din ${lei(o.tinta)}<br>până în ${data}</p>
          </div>
        </div>
        <p class="obiectiv-lunar">${lunar}</p>
        ${atins ? "" : `<div class="obiectiv-butoane">
          <button type="button" class="btn btn-alb btn-mic" data-act="adauga" data-suma="10">+10 lei</button>
          <button type="button" class="btn btn-alb btn-mic" data-act="adauga" data-suma="50">+50 lei</button>
          <button type="button" class="btn btn-alb btn-mic" data-act="alta">Altă sumă</button>
        </div>`}
      </article>`;
  }).join("");
}

$("form-obiectiv").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  const nume = String(d.get("nume") || "").trim();
  const tinta = Number(d.get("tinta"));
  const strans = Math.max(0, Number(d.get("strans")) || 0);
  const termen = String(d.get("termen") || "");
  let eroare = "";
  if (!nume) eroare = "Scrie ce vrei să cumperi.";
  else if (!(tinta > 0)) eroare = "Scrie cât costă.";
  else if (!termen) eroare = "Alege luna până la care vrei să strângi banii.";
  else if (luniPana(termen) < 1) eroare = "Alege o lună din viitor.";
  $("eroare-obiectiv").textContent = eroare;
  if (eroare) return;

  stare.obiective.unshift({ nume, tinta, strans: Math.min(strans, tinta), termen, xpAtins: false });
  salveaza("obiective", stare.obiective);
  e.target.reset();
  seteazaTermenImplicit();
  randeazaObiective();
  if (stare.obiective.length <= 3) adaugaXp(10, "Obiectiv nou");
  else notifica("Obiectiv adăugat.");
});

$("lista-obiective").addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  const card = e.target.closest(".obiectiv");
  if (!b || !card) return;
  const o = stare.obiective[Number(card.dataset.index)];
  if (b.dataset.act === "sterge") {
    if (!confirm(`Ștergi obiectivul „${o.nume}”?`)) return;
    stare.obiective.splice(Number(card.dataset.index), 1);
  } else {
    let suma = Number(b.dataset.suma);
    if (b.dataset.act === "alta") {
      suma = Number(String(prompt("Câți lei ai pus deoparte?", "20") || "").replace(",", "."));
      if (!(suma > 0)) return;
    }
    o.strans = Math.min(o.tinta, o.strans + suma);
    if (o.strans >= o.tinta && !o.xpAtins) {
      o.xpAtins = true;
      adaugaXp(25, `Ai atins obiectivul „${escapeHtml(o.nume)}”`);
    }
  }
  salveaza("obiective", stare.obiective);
  randeazaObiective();
});

function seteazaTermenImplicit() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  const camp = document.querySelector("#form-obiectiv input[name=termen]");
  camp.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const min = new Date();
  min.setMonth(min.getMonth() + 1);
  camp.min = `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(2, "0")}`;
}

/* =========================================================
   JOC: NEVOIE SAU DORINȚĂ?
   ========================================================= */
const ICON_JOC = {
  autobuz: '<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M8 18v2M16 18v2M8 15h.01M16 15h.01"/>',
  telefon: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  mancare: '<path d="M4 11h16a8 8 0 0 1-16 0zM12 3v4M8 5v2M16 5v2"/>',
  pantof: '<path d="M3 16h18v3H3zM3 16l1-8 5 2 4 3 7 1 1 2"/>',
  bec: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
  ecran: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  carte: '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
  joc: '<rect x="3" y="7" width="18" height="11" rx="5"/><path d="M8 11v3M6.5 12.5h3M15 12h.01M17.5 13.5h.01"/>',
  pastila: '<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><path d="m9.5 8.5 5 7"/>',
  restaurant: '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 2-2 6 0 8v10"/>',
  geaca: '<path d="M8 3 3 7l2 5 2-1v10h10V11l2 1 2-5-5-4c-1 2-2.5 3-4 3S9 5 8 3z"/>',
  bilet: '<path d="M3 8a2 2 0 0 0 0 4v5h18v-5a2 2 0 0 0 0-4V5H3z"/><path d="M14 5v12" stroke-dasharray="2 2"/>',
};

const CARTONASE = [
  { text: "Abonamentul de transport pentru drumul la școală", tip: "nevoie", icon: "autobuz", de_ce: "Fără el nu ajungi la școală." },
  { text: "Cel mai nou model de telefon, deși al tău merge bine", tip: "dorinta", icon: "telefon", de_ce: "Telefonul tău își face treaba. Modelul nou e un moft." },
  { text: "Mâncarea pentru săptămâna asta", tip: "nevoie", icon: "mancare", de_ce: "Hrana e o nevoie de bază." },
  { text: "A patra pereche de adidași de firmă", tip: "dorinta", icon: "pantof", de_ce: "Ai deja încălțăminte. Încă o pereche e o dorință." },
  { text: "Factura la curent a familiei", tip: "nevoie", icon: "bec", de_ce: "Facturile trebuie plătite, altfel rămâi fără curent." },
  { text: "Al treilea abonament la un serviciu de streaming", tip: "dorinta", icon: "ecran", de_ce: "E divertisment, iar unul ar fi fost de ajuns." },
  { text: "Manualele și rechizitele pentru școală", tip: "nevoie", icon: "carte", de_ce: "Ai nevoie de ele ca să înveți." },
  { text: "Un skin nou în jocul tău preferat", tip: "dorinta", icon: "joc", de_ce: "Arată bine, dar nu schimbă nimic important." },
  { text: "Medicamentele prescrise de medic", tip: "nevoie", icon: "pastila", de_ce: "Sănătatea vine întotdeauna prima." },
  { text: "Cină la restaurant în fiecare weekend", tip: "dorinta", icon: "restaurant", de_ce: "E plăcut, dar poți mânca și acasă." },
  { text: "O geacă de iarnă, pentru că a ta s-a rupt", tip: "nevoie", icon: "geaca", de_ce: "Iarna ai nevoie de o haină groasă." },
  { text: "Un bilet la concertul trupei preferate", tip: "dorinta", icon: "bilet", de_ce: "O experiență frumoasă, dar nu una necesară." },
];

const joc = { pachet: [], index: 0, corecte: 0, blocat: false, activ: false };

function amesteca(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randeazaRecordJoc() {
  $("record-joc").textContent = stare.jocRecord == null ? "Recordul tău: —" : `Recordul tău: ${stare.jocRecord}/8`;
}

function pornesteJoc() {
  joc.pachet = amesteca(CARTONASE).slice(0, 8);
  joc.index = 0;
  joc.corecte = 0;
  joc.activ = true;
  $("joc-butoane").hidden = false;
  $("joc-feedback").textContent = "";
  $("joc-feedback").className = "joc-feedback";
  arataCartonas();
}

function arataCartonas() {
  const c = joc.pachet[joc.index];
  joc.blocat = false;
  $("joc-scena").innerHTML = `
    <div class="cartonas intra" id="cartonas">
      <small>${joc.index + 1} din ${joc.pachet.length}</small>
      <span class="icon-cartonas"><svg viewBox="0 0 24 24">${ICON_JOC[c.icon]}</svg></span>
      <strong>${c.text}</strong>
    </div>`;
}

function alege(tip) {
  if (!joc.activ || joc.blocat) return;
  joc.blocat = true;
  const c = joc.pachet[joc.index];
  const corect = tip === c.tip;
  if (corect) joc.corecte += 1;
  $("joc-feedback").textContent = `${corect ? "Corect!" : "Nu chiar."} ${c.de_ce}`;
  $("joc-feedback").className = `joc-feedback ${corect ? "bine" : "rau"}`;
  $("cartonas").classList.add(tip === "nevoie" ? "spre-stanga" : "spre-dreapta");
  setTimeout(() => {
    joc.index += 1;
    if (joc.index < joc.pachet.length) arataCartonas();
    else terminaJoc();
  }, 420);
}

function terminaJoc() {
  joc.activ = false;
  $("joc-butoane").hidden = true;
  const vechi = stare.jocRecord || 0;
  let mesaj = "Mai exersează: întreabă-te „ce se întâmplă dacă nu cumpăr asta?”.";
  if (joc.corecte === 8) mesaj = "Perfect! Faci diferența fără greș.";
  else if (joc.corecte >= 6) mesaj = "Foarte bine! Aproape perfect.";
  $("joc-scena").innerHTML = `
    <div class="joc-final">
      <strong>${joc.corecte}/8</strong>
      <span>${mesaj}</span>
      <button type="button" class="btn btn-principal" id="porneste-joc">Joacă din nou</button>
    </div>`;
  if (joc.corecte > vechi) {
    stare.jocRecord = joc.corecte;
    salveaza("joc_record", stare.jocRecord);
    adaugaXp((joc.corecte - vechi) * 3, "Record nou la joc");
  }
}

$("joc-scena").addEventListener("click", (e) => { if (e.target.closest("#porneste-joc")) pornesteJoc(); });
$("joc-butoane").addEventListener("click", (e) => {
  const b = e.target.closest("[data-alegere]");
  if (b) alege(b.dataset.alegere);
});
document.addEventListener("keydown", (e) => {
  if (!joc.activ || $("cititor").open) return;
  if (e.key === "ArrowLeft") { e.preventDefault(); alege("nevoie"); }
  if (e.key === "ArrowRight") { e.preventDefault(); alege("dorinta"); }
});

/* =========================================================
   QUIZ (TEST FINAL)
   ========================================================= */
const INTREBARI = [
  { text: "După regula 50/30/20, la ce merg cei 20%?", variante: ["La dorințe", "La economii", "La nevoi"], corect: 1 },
  { text: "Ce înseamnă dobânda compusă?", variante: ["Dobândă doar la suma de la început", "Dobândă și la dobânda câștigată înainte", "O taxă lunară a băncii"], corect: 1 },
  { text: "O inflație de 5% pe an înseamnă că...", variante: ["prețurile scad", "în medie, prețurile cresc cu aproximativ 5% într-un an", "salariul crește automat cu 5%"], corect: 1 },
  { text: "Primești un SMS „de la bancă” care îți cere codul primit prin SMS. Ce faci?", variante: ["Trimiți codul repede", "Nu trimiți nimic și suni la bancă, la numărul oficial", "Răspunzi cu PIN-ul"], corect: 1 },
  { text: "Ca să compari corect două credite, te uiți la...", variante: ["doar rata dobânzii", "DAE — dobânda anuală efectivă", "culoarea cardului"], corect: 1 },
  { text: "Când plătești cu cardul de debit...", variante: ["cheltui banii tăi din cont", "te împrumuți de la bancă", "plătești mereu dobândă"], corect: 0 },
];

const quiz = { index: 0, scor: 0, raspuns: false, rezultate: [] };
const butonStart = $("start");
const butonUrmator = $("urmatoarea");
const butonReia = $("reia");
const zonaScor = $("scor");
const zonaIntrebare = $("intrebare");
const zonaRaspunsuri = $("raspunsuri");
const zonaMesaj = $("mesaj");

function randeazaPuncteQuiz() {
  $("quiz-puncte").innerHTML = INTREBARI.map((_, i) => {
    let clasa = "";
    if (quiz.rezultate[i] === true) clasa = "corect";
    else if (quiz.rezultate[i] === false) clasa = "gresit";
    else if (i === quiz.index && butonStart.hidden) clasa = "curent";
    return `<i class="${clasa}"></i>`;
  }).join("");
}

function afiseazaIntrebare() {
  const intrebare = INTREBARI[quiz.index];
  quiz.raspuns = false;
  zonaIntrebare.textContent = intrebare.text;
  zonaMesaj.textContent = "";
  zonaMesaj.className = "";
  zonaRaspunsuri.innerHTML = "";
  butonUrmator.hidden = true;
  intrebare.variante.forEach((varianta, i) => {
    const buton = document.createElement("button");
    buton.type = "button";
    buton.innerHTML = `<span class="litera">${"ABC"[i]}</span>`;
    buton.append(varianta);
    buton.addEventListener("click", () => verifica(i));
    zonaRaspunsuri.appendChild(buton);
  });
  $("progres-quiz").textContent = `Întrebarea ${quiz.index + 1} din ${INTREBARI.length}`;
  zonaScor.textContent = "Scor: " + quiz.scor;
  randeazaPuncteQuiz();
}

function verifica(alegere) {
  if (quiz.raspuns) return; // la o întrebare se poate răspunde o singură dată
  quiz.raspuns = true;
  const intrebare = INTREBARI[quiz.index];
  const butoane = zonaRaspunsuri.querySelectorAll("button");
  butoane.forEach((b) => { b.disabled = true; });
  butoane[intrebare.corect].classList.add("corect");
  const corect = alegere === intrebare.corect;
  quiz.rezultate[quiz.index] = corect;
  if (corect) {
    quiz.scor += 10;
    zonaMesaj.textContent = "Corect! +10 puncte";
    zonaMesaj.className = "bine";
  } else {
    butoane[alegere].classList.add("gresit");
    zonaMesaj.textContent = "Nu chiar. Răspunsul corect era: " + intrebare.variante[intrebare.corect];
    zonaMesaj.className = "rau";
  }
  zonaScor.textContent = "Scor: " + quiz.scor;
  butonUrmator.textContent = quiz.index === INTREBARI.length - 1 ? "Vezi rezultatul" : "Următoarea întrebare";
  butonUrmator.hidden = false;
  randeazaPuncteQuiz();
}

function afiseazaFinal() {
  const maxim = INTREBARI.length * 10;
  let verdict = "Recitește lecțiile și încearcă din nou — ai nevoie de 40 de puncte pentru certificat.";
  if (quiz.scor === maxim) verdict = "Perfect! Știi exact cum să te descurci cu banii.";
  else if (quiz.scor >= 40) verdict = "Bravo! Ai trecut testul.";
  $("progres-quiz").textContent = "Gata!";
  zonaIntrebare.textContent = "";
  zonaRaspunsuri.innerHTML = `<div class="quiz-final"><strong>${quiz.scor}/${maxim}</strong>puncte</div>`;
  zonaMesaj.textContent = verdict;
  zonaMesaj.className = quiz.scor >= 40 ? "bine" : "rau";
  butonUrmator.hidden = true;
  butonReia.hidden = false;
  const vechi = stare.quizRecord || 0;
  if (stare.quizRecord == null || quiz.scor > stare.quizRecord) {
    stare.quizRecord = quiz.scor;
    salveaza("quiz_record", quiz.scor);
    adaugaXp(quiz.scor - vechi, "Record nou la test");
  }
  randeazaCertificat();
  randeazaPuncteQuiz();
}

function pornesteQuiz() {
  butonStart.hidden = true;
  butonReia.hidden = true;
  quiz.index = 0;
  quiz.scor = 0;
  quiz.rezultate = [];
  afiseazaIntrebare();
}

butonStart.addEventListener("click", pornesteQuiz);
butonReia.addEventListener("click", pornesteQuiz);
butonUrmator.addEventListener("click", () => {
  quiz.index += 1;
  if (quiz.index < INTREBARI.length) afiseazaIntrebare();
  else afiseazaFinal();
});

/* =========================================================
   GLOSAR
   ========================================================= */
const GLOSAR = [
  ["Acțiune", "O mică parte dintr-o companie. Valoarea ei poate crește sau scădea, deci poți câștiga, dar și pierde bani."],
  ["Buget", "Planul banilor tăi: câți bani intră și pe ce îi cheltui."],
  ["Card de credit", "Card cu bani împrumutați de la bancă, până la o limită. Dacă nu returnezi totul la timp, plătești dobândă."],
  ["Card de debit", "Card legat de contul tău. Plătești cu banii pe care îi ai deja."],
  ["Comision", "O taxă pe care o plătești pentru un serviciu, de exemplu pentru unele transferuri sau retrageri de numerar."],
  ["DAE", "Dobânda anuală efectivă: costul total al unui credit pe un an, cu dobândă și comisioane. Cu ea compari corect creditele."],
  ["Depozit bancar", "Bani pe care îi lași la bancă o perioadă stabilită, în schimbul unei dobânzi."],
  ["Descoperit de cont", "O sumă pe care banca îți permite să o cheltui peste ce ai în cont. E un împrumut și se returnează, de obicei cu dobândă."],
  ["Diversificare", "Împarți banii în mai multe locuri, ca să nu pierzi tot dacă unul dintre ele merge prost."],
  ["Dobândă", "Prețul banilor: o primești când economisești la bancă și o plătești când te împrumuți."],
  ["Dobândă compusă", "Dobânda care se adaugă la sumă și produce, la rândul ei, dobândă."],
  ["Fond de urgență", "Bani puși deoparte doar pentru situații neprevăzute, nu pentru cumpărături."],
  ["IBAN", "Codul unic al unui cont bancar, folosit pentru transferuri. Îl poți da cuiva care vrea să-ți trimită bani."],
  ["Inflație", "Creșterea generală a prețurilor în timp. Din cauza ei, aceiași bani cumpără mai puțin."],
  ["Phishing", "Înșelătorie prin mesaje, e-mailuri sau site-uri false care se dau drept bănci sau firme, ca să-ți fure datele."],
  ["Rată", "O plată fixă, de obicei lunară, prin care returnezi un împrumut."],
  ["Scadență", "Data până la care trebuie plătită o sumă."],
  ["Venit", "Toți banii care îți intră: salariu, alocație, bani de buzunar, un job de weekend."],
];

function randeazaGlosar() {
  const t = $("cautare-glosar").value.trim().toLowerCase();
  const evidentiaza = (text) => {
    const sigur = escapeHtml(text);
    if (!t) return sigur;
    const idx = sigur.toLowerCase().indexOf(escapeHtml(t));
    return idx === -1 ? sigur : `${sigur.slice(0, idx)}<mark>${sigur.slice(idx, idx + escapeHtml(t).length)}</mark>${sigur.slice(idx + escapeHtml(t).length)}`;
  };
  const gasite = GLOSAR.filter(([termen, def]) => !t || termen.toLowerCase().includes(t) || def.toLowerCase().includes(t));
  $("lista-glosar").innerHTML = gasite.length
    ? gasite.map(([termen, def]) => `<dl class="termen"><dt><span>${termen[0]}</span>${evidentiaza(termen)}</dt><dd>${evidentiaza(def)}</dd></dl>`).join("")
    : `<p class="glosar-gol">Nu am găsit „${escapeHtml(t)}”. Încearcă alt cuvânt.</p>`;
}

$("cautare-glosar").addEventListener("input", randeazaGlosar);

/* =========================================================
   CERTIFICAT
   ========================================================= */
function randeazaCertificat() {
  const lectiiOk = stare.lectii.length === LECTII.length;
  const quizOk = (stare.quizRecord || 0) >= 40;
  const deblocat = lectiiOk && quizOk;
  $("stare-certificat").textContent = deblocat ? "Deblocat!" : "Blocat";
  $("cel-mai-bun-quiz").textContent = stare.quizRecord == null ? "—" : `${stare.quizRecord}/60`;

  const data = new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
  const nume = stare.nume || "Numele tău";
  $("certificat-zona").innerHTML = `
    <div class="carta">
      <div class="conditii">
        <div class="conditie ${lectiiOk ? "ok" : ""}"><i>${BIFA}</i>Toate cele 6 lecții<small>${stare.lectii.length}/6</small></div>
        <div class="conditie ${quizOk ? "ok" : ""}"><i>${BIFA}</i>Minimum 40 de puncte la test<small>${stare.quizRecord == null ? "—" : stare.quizRecord}/60</small></div>
      </div>
      <div class="certificat-actiuni">
        <label class="camp"><span>Numele de pe certificat</span><input type="text" id="nume-certificat" maxlength="40" placeholder="Ex: Andrei Popescu" value="${escapeHtml(stare.nume)}" ${deblocat ? "" : "disabled"}></label>
        <button type="button" class="btn btn-principal" id="imprima" ${deblocat ? "" : "disabled"}>Imprimă sau salvează ca PDF</button>
        ${deblocat ? "" : '<p class="nota">Certificatul se deblochează după ce îndeplinești ambele condiții.</p>'}
      </div>
    </div>
    <div class="diploma ${deblocat ? "" : "blocata"}" id="diploma">
      <span class="sigiliu">BĂNUȚ<br>2026</span>
      <span class="logo-moneda"><svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="14"/><path d="M20 15v14M16 18.5c0-2 1.8-3 4-3s4 1 4 2.6c0 4-8 2.4-8 6.4 0 1.7 1.8 2.8 4 2.8s4-1 4-3"/><path class="frunza" d="M20 8c0-4 3-6 7-6 0 4-3 6-7 6z"/></svg></span>
      <small>Certificat de absolvire</small>
      <h3>Educație financiară pentru tineri</h3>
      <div class="nume-diploma" id="nume-diploma">${escapeHtml(nume)}</div>
      <p>a parcurs toate cele 6 lecții — buget, nevoi și dorințe, economisire, carduri, inflație și siguranță online — și a promovat testul final cu <b>${stare.quizRecord || 0}/60</b> de puncte.</p>
      <div class="diploma-jos"><span>${data}</span><span>Nivel: ${nivel(stare.xp).nume}</span></div>
    </div>`;
}

$("certificat-zona").addEventListener("input", (e) => {
  if (e.target.id !== "nume-certificat") return;
  stare.nume = e.target.value.trim();
  salveaza("nume", stare.nume);
  $("nume-diploma").textContent = stare.nume || "Numele tău";
});

$("certificat-zona").addEventListener("click", (e) => {
  if (e.target.id !== "imprima") return;
  if (!stare.nume) {
    notifica("Scrie-ți întâi numele pe certificat.");
    $("nume-certificat").focus();
    return;
  }
  window.print();
});

/* =========================================================
   NAVIGARE
   ========================================================= */
if ("IntersectionObserver" in window) {
  const linkuri = document.querySelectorAll(".meniu a, .bara-jos a");
  const obs = new IntersectionObserver((intrari) => {
    intrari.forEach((i) => {
      if (!i.isIntersecting) return;
      linkuri.forEach((a) => a.classList.toggle("activ", a.getAttribute("href") === `#${i.target.id}`));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("main > section").forEach((s) => obs.observe(s));
}

/* ---------- Pornire ---------- */
randeazaNivel();
randeazaLectii();
calculeazaBuget();
calculeazaDobanda();
calculeazaInflatie();
seteazaTermenImplicit();
randeazaObiective();
randeazaRecordJoc();
randeazaPuncteQuiz();
randeazaGlosar();
randeazaCertificat();

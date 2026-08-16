/* ============================================================
   DATA-LOADER
   ------------------------------------------------------------
   Dit bestand leest data/projects.json in en bouwt daaruit automatisch de lijst van foto's per project op:

       <prefix>-<nummer>.<extensie>        bv. 30-VD-P-01.jpg
       <prefix>-menu.<extensie>            bv. 30-VD-P-menu.jpg  (optioneel)

   - <prefix>   = projectnummer-initialen-plaatsafkorting, bv. "32-D-P"
   - <nummer>   = volgnummer van de foto binnen het project (01, 02, 03…)
   - "-menu"    = de foto die op de overzichtspagina (nieuwbouw/renovatie en op de homepagina) als menufoto getoond wordt.
                  Als er op geklikt wordt, opent de fotoviewer bij foto 01, 02, 03… in volgorde.

   BELANGRIJK over paden:
   De paden in projects.json (het "map"-veld, bv. "images/nieuwbouw/32-D-Poederlee")
   zijn geschreven t.o.v. de site-root. Dat werkt vanzelf correct op de
   homepage (die ook in de root staat), maar NIET op pagina's die zelf in
   een submap staan (bv. /nieuwbouw/ of /renovatie/) — daar moet elk pad
   eerst "terug naar boven" wijzen (../).
   Om dat automatisch juist te laten lopen, wordt hier hetzelfde
   voorvoegsel gebruikt als waarmee projects.json zelf werd ingeladen
   (zie window.PROJECTS_DATA_PATH, ingesteld per pagina): werd
   projects.json bv. ingeladen via "../data/projects.json", dan krijgen
   alle fotopaden ook automatisch "../" vooraan.
   ============================================================ */

async function laadEnBouwProjecten(pad) {
  const respons = await fetch(pad);
  if (!respons.ok) {
    throw new Error('Kon ' + pad + ' niet laden (status ' + respons.status + ')');
  }
  const data = await respons.json();

  // Voorvoegsel om terug naar de site-root te wijzen, afgeleid uit het
  // pad waarmee projects.json zelf werd ingeladen (zie hierboven).
  const basis = pad.replace(/data\/projects\.json.*$/, '');

  return {
    nieuwbouw: bouwProjectenArray(data.nieuwbouw, basis),
    renovatie: bouwProjectenArray(data.renovatie, basis)
  };
}

function bouwProjectenArray(projectenLijst, basis) {
  basis = basis || '';
  return (projectenLijst || []).map(function (p) {
    const extensie = p.extensie || 'jpg';
    const cijfers = (p.cijfers !== undefined) ? p.cijfers : 2;
    const startNummer = p.startNummer || 1;
    const aantalFotos = p.aantalFotos || 0;

    // Bouw automatisch de bestandsnamen 01, 02, 03… op
    const images = [];
    for (let n = startNummer; n < startNummer + aantalFotos; n++) {
      const nummer = String(n).padStart(cijfers, '0');
      images.push(basis + p.map + '/' + p.prefix + '-' + nummer + '.' + extensie);
    }

    // De coverfoto (miniatuur op overzichtspagina's):
    // - als heeftMenuFoto true is: de aparte "-menu" foto
    // - anders: gewoon de eerste foto van de reeks
    const cover = p.heeftMenuFoto
      ? (basis + p.map + '/' + p.prefix + '-menu.' + extensie)
      : images[0];

    return {
      naam: p.naam,
      locatie: p.locatie,
      home: !!p.home,
      ph: p.ph || 'ph-1',
      cover: cover,
      images: images
    };
  });
}

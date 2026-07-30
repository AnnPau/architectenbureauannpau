/* ============================================================
   DATA-LOADER
   ------------------------------------------------------------
   Dit bestand leest data/projects.json in en bouwt daaruit
   automatisch de lijst van foto's per project op, volgens de
   bestandsnaam-conventie:

       <prefix>-<nummer>.<extensie>        bv. 30-VD-P-01.jpg
       <prefix>-menu.<extensie>            bv. 30-VD-P-menu.jpg  (optioneel)

   - <prefix>   = projectnummer-initialen-plaatsafkorting, bv. "30-VD-P"
   - <nummer>   = volgnummer van de foto binnen het project (01, 02, 03…)
   - "-menu"    = de foto die op de overzichtspagina (nieuwbouw/renovatie
                  en op de homepagina) als miniatuur getoond wordt.
                  Als er op geklikt wordt, opent de fotoviewer gewoon
                  bij foto 01, 02, 03… in volgorde.

   Om een foto toe te voegen aan een bestaand project:
     1. Zet de foto in de juiste map (zie "map" in projects.json)
        met de volgende volgnummer, bv. 30-VD-P-08.jpg
     2. Verhoog "aantalFotos" in projects.json met 1
   Dat is alles — de website laadt de foto automatisch op de
   juiste plaats in.

   Om een volledig nieuw project toe te voegen: zie het voorbeeld
   bovenaan projects.json en README.md.
   ============================================================ */

/**
 * Haalt het databestand op en bouwt de projecten (nieuwbouw + renovatie)
 * op tot bruikbare objecten voor de website (naam, locatie, cover, images…).
 * @param {string} pad - pad naar het JSON-databestand
 * @returns {Promise<{nieuwbouw: Array, renovatie: Array}>}
 */
async function laadEnBouwProjecten(pad) {
  const respons = await fetch(pad);
  if (!respons.ok) {
    throw new Error('Kon ' + pad + ' niet laden (status ' + respons.status + ')');
  }
  const data = await respons.json();

  return {
    nieuwbouw: bouwProjectenArray(data.nieuwbouw),
    renovatie: bouwProjectenArray(data.renovatie)
  };
}

/**
 * Zet een lijst project-definities (zoals in projects.json) om naar
 * de objectvorm die de rest van de website verwacht:
 *   { naam, locatie, home, ph, cover, images }
 */
function bouwProjectenArray(projectenLijst) {
  return (projectenLijst || []).map(function (p) {
    const extensie = p.extensie || 'jpg';
    const cijfers = (p.cijfers !== undefined) ? p.cijfers : 2;
    const startNummer = p.startNummer || 1;
    const aantalFotos = p.aantalFotos || 0;

    // Bouw automatisch de bestandsnamen 01, 02, 03… op
    const images = [];
    for (let n = startNummer; n < startNummer + aantalFotos; n++) {
      const nummer = String(n).padStart(cijfers, '0');
      images.push(p.map + '/' + p.prefix + '-' + nummer + '.' + extensie);
    }

    // De coverfoto (miniatuur op overzichtspagina's):
    // - als heeftMenuFoto true is: de aparte "-menu" foto
    // - anders: gewoon de eerste foto van de reeks
    const cover = p.heeftMenuFoto
      ? (p.map + '/' + p.prefix + '-menu.' + extensie)
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

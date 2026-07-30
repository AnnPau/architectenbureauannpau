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

   ============================================================ */

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

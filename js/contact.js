/* ============================================================
   CONTACT.JS — enkel geladen op de contactpagina
   ============================================================ */

async function submitForm() {
  const naam = document.getElementById('cNaam').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const onderwerp = document.getElementById('cOnderwerp').value.trim();
  if (!naam || !email) {
    alert('Vul minstens uw naam en e-mailadres in.');
    return;
  }
  const btn = document.querySelector('.submit-btn');
  btn.textContent = 'Bezig…';
  btn.disabled = true;
  try {
    const res = await fetch('https://formspree.io/f/xeebvyvk', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ naam, email, onderwerp })
    });
    if (res.ok) {
      document.getElementById('contactFormWrap').style.display = 'none';
      document.getElementById('formSuccess').classList.add('show');
    } else {
      alert('Er is iets misgegaan. Probeer het opnieuw of neem contact op via telefoon.');
      btn.textContent = 'Versturen';
      btn.disabled = false;
    }
  } catch {
    alert('Geen internetverbinding. Probeer het opnieuw.');
    btn.textContent = 'Versturen';
    btn.disabled = false;
  }
}

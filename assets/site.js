// leyack.fr — la séquence d'ouverture (au défilement), le rail des dernières toiles, les filtres, les apparitions.
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tete = document.querySelector('.tete');

  // ── menu du téléphone ──
  var bouton = document.querySelector('.menu-bouton');
  var nav = document.querySelector('.nav');
  if (bouton && nav) {
    var basculer = function (ouvrir) {
      nav.classList.toggle('est-ouverte', ouvrir);
      bouton.setAttribute('aria-expanded', ouvrir ? 'true' : 'false');
      document.body.style.overflow = ouvrir ? 'hidden' : '';
    };
    bouton.addEventListener('click', function () { basculer(true); });
    var fermer = nav.querySelector('.nav__fermer');
    if (fermer) fermer.addEventListener('click', function () { basculer(false); bouton.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') basculer(false); });
  }

  // ── l'ouverture : ses photos d'atelier, l'une après l'autre ──
  var photos = document.querySelectorAll('.portrait__photo');
  var legende = document.querySelector('.portrait__legende');
  if (photos.length > 1 && !calme) {
    var i = 0;
    setInterval(function () {
      if (document.hidden) return;
      photos[i].classList.remove('est-active');
      i = (i + 1) % photos.length;
      photos[i].classList.add('est-active');
      if (legende) legende.textContent = photos[i].dataset.legende || '';
    }, 5200);
  }

  // ── le prochain rendez-vous : le premier dont la date n'est pas passée ──
  var rdv = document.querySelectorAll('.rendez-vous[data-fin]');
  if (rdv.length) {
    var aujourdhui = new Date().toISOString().slice(0, 10), montre = false;
    rdv.forEach(function (r) { var ok = !montre && r.dataset.fin >= aujourdhui; r.hidden = !ok; if (ok) montre = true; });
  }

  // ── vidéos de l'atelier : chargées et lancées quand elles arrivent à l'écran ──
  var videos = document.querySelectorAll('video[data-src]');
  if (videos.length && 'IntersectionObserver' in window) {
    var mobile = window.matchMedia('(max-width: 760px)').matches;
    var vo = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src) { v.src = mobile && v.dataset.srcMobile ? v.dataset.srcMobile : v.dataset.src; }
          if (!calme) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        } else if (!v.paused) v.pause();
      });
    }, { rootMargin: '200px 0px' });
    videos.forEach(function (v) { if (calme) v.controls = true; vo.observe(v); });
  }

  // ── le formulaire de contact : enregistré par l'Atelier Joconde, qui prévient atelier.joconde@gmail.com ──
  var form = document.getElementById('formulaire');
  if (form) {
    var d = form.dataset, retour = form.querySelector('.formulaire__retour'), envoyer = form.querySelector('[type=submit]');
    var oeuvre = new URLSearchParams(location.search).get('oeuvre');
    if (oeuvre) form.message.value = d.aPropos.replace('{oeuvre}', oeuvre);
    var dire = function (texte) { retour.textContent = texte; retour.hidden = false; };
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form.site.value) return;
      var champs = ['nom', 'tel', 'email', 'message'], manque = false;
      champs.forEach(function (n) {
        var c = form[n], vide = !c.value.trim() || (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value.trim()));
        c.setAttribute('aria-invalid', vide ? 'true' : 'false'); if (vide) manque = true;
      });
      if (manque) { dire(d.requis); return; }
      if (form.message.value.trim().length < 10) { form.message.setAttribute('aria-invalid', 'true'); dire(d.court); return; }
      var corps = {
        intent: 1, name: form.nom.value.trim(), email: form.email.value.trim(), phone: form.tel.value.trim(),
        message: 'Message envoyé depuis leyack.fr\n\n' + form.message.value.trim(),
        artist: 'Le Yack', artwork: oeuvre || null, budget: null, status: 'new'
      };
      var entetes = { 'Content-Type': 'application/json', apikey: d.cle, Authorization: 'Bearer ' + d.cle };
      envoyer.disabled = true; var libelle = envoyer.textContent; envoyer.textContent = d.envoi;
      fetch(d.url + '/rest/v1/contact_messages', { method: 'POST', headers: Object.assign({ Prefer: 'return=minimal' }, entetes), body: JSON.stringify(corps) })
        .then(function (r) { if (!r.ok) throw new Error('enregistrement ' + r.status); })
        .then(function () {
          var alerte = Object.assign({}, corps); delete alerte.status;
          return fetch(d.url + '/functions/v1/send-contact-email', { method: 'POST', headers: entetes, body: JSON.stringify(alerte) }).catch(function () {});
        })
        .then(function () { form.reset(); dire(d.merci); })
        .catch(function () {
          dire(d.erreur);
          var texte = 'Nom : ' + corps.name + '\nTéléphone : ' + corps.phone + '\nE-mail : ' + corps.email + (oeuvre ? '\nŒuvre : ' + oeuvre : '') + '\n\n' + form.message.value.trim();
          location.href = 'mailto:' + d.repli + '?subject=' + encodeURIComponent('Message pour Le Yack (leyack.fr)') + '&body=' + encodeURIComponent(texte);
        })
        .then(function () { envoyer.disabled = false; envoyer.textContent = libelle; });
    });
  }

  // ── rail des dernières toiles ──
  document.querySelectorAll('[data-rail]').forEach(function (rail) {
    var fl = document.querySelector('[data-rail-fleches="' + rail.id + '"]');
    if (!fl) return;
    fl.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var carte = rail.querySelector('.carte');
        var pas = carte ? carte.getBoundingClientRect().width + 22 : 400;
        rail.scrollBy({ left: (b.dataset.sens === 'g' ? -1 : 1) * pas, behavior: calme ? 'auto' : 'smooth' });
      });
    });
  });

  // ── apparitions au défilement ──
  var aReveler = document.querySelectorAll('.revele');
  if ('IntersectionObserver' in window && aReveler.length) {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('est-vue'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    aReveler.forEach(function (el) { io.observe(el); });
  } else aReveler.forEach(function (el) { el.classList.add('est-vue'); });

  // ── filtres du catalogue ──
  var grille = document.querySelector('[data-filtrable]');
  if (grille) {
    var cartes = grille.querySelectorAll('.carte');
    var boutons = document.querySelectorAll('[data-filtre]');
    var appliquer = function (decor) {
      boutons.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.filtre === decor ? 'true' : 'false'); });
      cartes.forEach(function (c) {
        c.hidden = !(decor === 'tout' || (decor === 'disponibles' ? c.dataset.vendue === 'non' : c.dataset.decor === decor));
      });
    };
    boutons.forEach(function (b) {
      b.addEventListener('click', function () {
        appliquer(b.dataset.filtre);
        history.replaceState(null, '', b.dataset.filtre === 'tout' ? location.pathname : '#' + b.dataset.filtre);
      });
    });
    var depart = location.hash.replace('#', '');
    if (depart && document.querySelector('[data-filtre="' + depart + '"]')) appliquer(depart);
  }
})();

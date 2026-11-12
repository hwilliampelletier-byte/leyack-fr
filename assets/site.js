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

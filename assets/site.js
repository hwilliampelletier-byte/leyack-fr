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

  // ── la séquence d'ouverture ──
  var seq = document.querySelector('.sequence');
  if (seq && calme) doc.classList.add('sans-mouvement');
  if (seq && !calme) {
    var scene = seq.querySelector('.sequence__scene');
    var fond = seq.querySelector('.sequence__fond');
    var toile = seq.querySelector('.sequence__toile');
    var fx = parseFloat(toile.dataset.fx || '0.5'), fy = parseFloat(toile.dataset.fy || '0.5');
    var preuves = seq.querySelector('.sequence__preuves');
    var compteurs = seq.querySelectorAll('[data-compte]');
    var compte = false;
    var borne = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var plage = function (p, a, b) { return borne((p - a) / (b - a)); };
    var douce = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
    var L = 0, vw = 0, vh = 0;
    var mesurer = function () {
      vw = window.innerWidth; vh = window.innerHeight;
      L = Math.min(vh * 0.6, vw * 0.84, 680);
      scene.style.setProperty('--toile-l', L + 'px');
    };
    var compter = function () {
      compte = true;
      compteurs.forEach(function (c) {
        var fin = parseInt(c.dataset.compte, 10), t0 = performance.now();
        var pas = function (t) {
          var k = borne((t - t0) / 1400);
          c.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3))) + (c.dataset.suffixe || '');
          if (k < 1) requestAnimationFrame(pas);
        };
        requestAnimationFrame(pas);
      });
    };
    var dessiner = function () {
      var r = seq.getBoundingClientRect();
      var p = borne(-r.top / (r.height - vh));
      // l'ouverture : la signature s'efface
      var titre = 1 - plage(p, 0.05, 0.15);
      scene.style.setProperty('--titre', titre);
      scene.style.setProperty('--titre-y', (-40 * (1 - titre)) + 'px');
      // le gros plan se retire, la toile entière apparaît en reculant
      // un fondu au noir entre le gros plan et la toile entière (deux photos différentes : jamais superposées)
      scene.style.setProperty('--detail', 1 - plage(p, 0.1, 0.17));
      var apparition = plage(p, 0.18, 0.27);
      scene.style.setProperty('--detail-echelle', 1 - 0.12 * plage(p, 0.08, 0.3));
      var S0 = Math.max(vw, vh) / L * 1.9;
      var recul = douce(plage(p, 0.18, 0.52));
      var echelle = S0 + (1.18 - S0) * recul;
      var tx = -(fx - 0.5) * L * (1 - recul), ty = -(fy - 0.5) * L * (1 - recul);
      // le mur s'éclaire, la toile s'y pose
      var mur = douce(plage(p, 0.52, 0.66));
      echelle = echelle + (1 - 1.18) * mur;
      // puis la toile se retire pour laisser parler les preuves
      var sortie = douce(plage(p, 0.76, 0.88));
      echelle = echelle * (1 - 0.18 * sortie);
      toile.style.setProperty('--echelle', echelle.toFixed(4));
      toile.style.setProperty('--tx', tx.toFixed(1) + 'px');
      toile.style.setProperty('--ty', (ty - sortie * vh * 0.06).toFixed(1) + 'px');
      toile.style.opacity = (apparition * (1 - sortie)).toFixed(3);
      toile.classList.toggle('a-ombre', mur > 0.5);
      var c = Math.round(245 * mur);
      fond.style.background = 'rgb(' + c + ',' + c + ',' + Math.round(247 * mur) + ')';
      // la phrase, pendant le recul
      var texte = plage(p, 0.26, 0.34) * (1 - plage(p, 0.44, 0.5));
      scene.style.setProperty('--texte', texte.toFixed(3));
      toile.style.filter = texte > 0.01 ? 'brightness(' + (1 - 0.5 * texte).toFixed(3) + ')' : '';
      scene.style.setProperty('--texte-y', (20 - 20 * plage(p, 0.26, 0.34)) + 'px');
      scene.style.setProperty('--legende', (plage(p, 0.6, 0.68) * (1 - sortie)).toFixed(3));
      var pr = plage(p, 0.82, 0.92);
      scene.style.setProperty('--preuves', pr.toFixed(3));
      preuves.classList.toggle('est-active', pr > 0.5);
      if (pr > 0.3 && !compte) compter();
      if (tete) tete.classList.toggle('sur-noir', r.bottom > 60 && mur < 0.5);
    };
    var attente = false;
    var demander = function () { if (!attente) { attente = true; requestAnimationFrame(function () { attente = false; dessiner(); }); } };
    mesurer(); dessiner();
    window.addEventListener('scroll', demander, { passive: true });
    window.addEventListener('resize', function () { mesurer(); demander(); });
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

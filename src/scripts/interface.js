/* A interface: a sombra do cabeçalho, o menu e a procura (dois <dialog>), o aviso do topo, a galeria
   das fichas (fotografias e vídeo), as pastilhas das criações (a página não volta ao topo quando se
   muda de categoria) e as entradas ao descer. */
(function () {
  'use strict';

  // ---------------------------------------------------------------- cabeçalho
  var topo = document.getElementById('topo');
  function sombra() { if (topo) topo.classList.toggle('com-sombra', window.scrollY > 8); }
  window.addEventListener('scroll', sombra, { passive: true });
  sombra();

  // ---------------------------------------------------------------- aviso do topo (esconde-se no dia seguinte)
  document.querySelectorAll('.aviso[data-ate]').forEach(function (a) {
    var hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date());
    if (hoje > a.getAttribute('data-ate')) a.hidden = true;
  });

  // ---------------------------------------------------------------- dialogs (menu e procura)
  function ligarDialogo(botaoId, dialogoId, aoAbrir) {
    var botao = document.getElementById(botaoId);
    var d = document.getElementById(dialogoId);
    if (!botao || !d || typeof d.showModal !== 'function') return;
    botao.addEventListener('click', function () {
      d.showModal();
      botao.setAttribute('aria-expanded', 'true');
      if (aoAbrir) aoAbrir(d);
    });
    d.addEventListener('close', function () { botao.setAttribute('aria-expanded', 'false'); });
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-fechar]')) d.close();
    });
    // uma ligação dentro do menu fecha-o (para o «voltar» do browser não o encontrar aberto)
    d.addEventListener('click', function (e) { if (e.target.closest('a[href]')) d.close(); });
  }
  ligarDialogo('abrir-menu', 'menu');
  ligarDialogo('abrir-procura', 'procura', function (d) {
    var i = d.querySelector('input[type="search"]');
    if (i) setTimeout(function () { i.focus(); }, 30);
  });
  // o menu é só do telemóvel: ao passar ao computador fecha-se
  var mq = window.matchMedia('(min-width: 861px)');
  mq.addEventListener && mq.addEventListener('change', function (e) { var m = document.getElementById('menu'); if (e.matches && m && m.open) m.close(); });

  // ---------------------------------------------------------------- galeria da ficha
  document.querySelectorAll('[data-galeria]').forEach(function (g) {
    var fila = g.querySelector('.galeria__fila');
    var slides = Array.prototype.slice.call(fila.children);
    var minis = Array.prototype.slice.call(g.querySelectorAll('.galeria__miniaturas a'));
    var pontos = Array.prototype.slice.call(g.querySelectorAll('.galeria__pontos span'));
    var video = g.querySelector('[data-video]');
    function atual() { return Math.round(fila.scrollLeft / Math.max(1, fila.clientWidth)); }
    function marcar() {
      var i = atual();
      pontos.forEach(function (p, k) { p.classList.toggle('ativo', k === i); });
      minis.forEach(function (a) {
        var alvo = document.getElementById(a.getAttribute('href').slice(1));
        if (alvo === slides[i]) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    var espera = null;
    fila.addEventListener('scroll', function () { clearTimeout(espera); espera = setTimeout(marcar, 60); }, { passive: true });
    minis.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var alvo = document.getElementById(a.getAttribute('href').slice(1));
        if (alvo) fila.scrollTo({ left: alvo.offsetLeft, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    });
    // as setas do teclado mudam de fotografia quando a fila tem o foco
    fila.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var i = Math.max(0, Math.min(slides.length - 1, atual() + (e.key === 'ArrowRight' ? 1 : -1)));
      fila.scrollTo({ left: slides[i].offsetLeft, behavior: 'smooth' });
    });
    // o vídeo (sem som) toca só quando se vê, e pára quando sai
    if (video && 'IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting && en.intersectionRatio > 0.6) { video.preload = 'auto'; var p = video.play(); if (p && p.catch) p.catch(function () {}); } else video.pause();
        });
      }, { threshold: [0, 0.6, 1] });
      obs.observe(video);
    }
  });

  // ---------------------------------------------------------------- pastilhas das criações
  /* As categorias são páginas (/criacoes/<slug>/): ao mudar, a página abre no mesmo sítio, sem voltar
     ao topo (o Renato, 13 nov 2026). Guarda-se no clique onde a fila estava no ecrã; o script em linha
     da página nova repõe-no antes da primeira pintura. */
  document.querySelectorAll('[data-pastilhas] a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var nav = a.closest('[data-pastilhas]');
      var ul = nav.querySelector('ul');
      try {
        sessionStorage.setItem('becreative:lugar', JSON.stringify({ para: new URL(a.href).pathname, topo: nav.getBoundingClientRect().top, esq: ul.scrollLeft, t: Date.now() }));
      } catch (er) {}
    });
  });
  // no telemóvel, a pastilha da página aberta fica à vista na fila (menos quando a página veio de uma pastilha)
  var aberta = document.querySelector('[data-pastilhas] a[aria-current]');
  if (aberta && !document.documentElement.hasAttribute('data-lugar')) {
    var ul = aberta.closest('ul');
    if (ul.scrollWidth > ul.clientWidth) ul.scrollLeft = Math.max(0, aberta.offsetLeft - 16);
  }

  // ---------------------------------------------------------------- entradas ao descer
  /* Como no apple.com: o que está ABAIXO do primeiro ecrã entra a subir ligeiramente, ao aparecer. O
     primeiro ecrã nunca pisca (o título é o maior elemento pintado), e sem JavaScript ou com «menos
     movimento» está tudo à vista. Uma fila que desliza de lado entra inteira. */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ALVOS = '.titulo, .indice li, .duo__foto, .duo__texto, .grelha > li, .celebs > li, .passo, .fecho .contentor, .mosaico li, .contacto, .leitura__foto, .trio__foto';
    var obs = new IntersectionObserver(function (ents) {
      var k = 0;
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.style.setProperty('--d', (Math.min(k++, 6) * 0.08).toFixed(2) + 's');
        el.classList.add('entrou');
        el.addEventListener('animationend', function fim() { el.classList.remove('revelar', 'entrou'); el.style.removeProperty('--d'); el.removeEventListener('animationend', fim); });
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll(ALVOS).forEach(function (el) {
      if (el.parentElement && el.parentElement.closest(ALVOS)) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight || r.width === 0) return;
      var fila = el.closest('.celebs');
      if (fila && fila !== el && fila.scrollWidth > fila.clientWidth) return;
      el.classList.add('revelar');
      obs.observe(el);
    });
    // salvaguarda: aos 4 s, nada fica escondido (um observador que não disparou)
    setTimeout(function () { document.querySelectorAll('.revelar:not(.entrou)').forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.remove('revelar'); }); }, 4000);
  }
})();

// A moldura de todas as páginas (a proposta A, «Pedra»): o cabeçalho na pedra do logótipo (o logótipo
// à esquerda, as quatro páginas, a lupa e o pedido), o menu de ecrã inteiro do telemóvel, a procura,
// o rodapé curto (o logótipo, a frase, as redes, a ajuda e a linha legal) e o aviso do topo.
import { esc } from './util.mjs';
import { sprite, ico } from './icones.mjs';
import { logo, livroBotao, miniatura } from './componentes.mjs';

/* As páginas do cabeçalho (o menu principal: as mesmas em todas as páginas, com a actual marcada). */
const PRINCIPAIS = [['/criacoes/', 'Criações'], ['/celebracoes/', 'Celebrações'], ['/como-funciona/', 'Como funciona'], ['/contactos/', 'Contactos']];
const atual = (caminho, c) => (c === '/criacoes/' ? caminho.startsWith('/criacoes/') || caminho.startsWith('/pecas/') : c === '/celebracoes/' ? caminho.startsWith('/celebracoes/') : caminho === c);

/* O aviso do topo (content/site.json, «aviso»): uma faixa fina por baixo do cabeçalho, só com uma
   campanha ou um aviso, até ao dia escolhido (o site.js esconde-o no dia seguinte, sem publicar). */
function aviso(ctx) {
  const a = ctx.site.aviso || {};
  if (!a.texto || (a.ate && ctx.hoje > a.ate)) return '';
  const texto = esc(a.texto);
  const destino = a.ligacao && ctx.existe(a.ligacao) ? a.ligacao : '';
  return `<div class="aviso"${a.ate ? ` data-ate="${esc(a.ate)}"` : ''}><p class="contentor">${destino ? `<a href="${ctx.url(destino)}">${texto}${ico('seta')}</a>` : texto}</p></div>`;
}

function cabecalho(ctx, caminho) {
  return `<header class="topo" id="topo">
  <div class="contentor topo__barra">
    <a class="topo__logo" href="${ctx.url('/')}"${caminho === '/' ? ' aria-current="page"' : ''}>${logo(ctx, { alto: 64, classe: 'topo__logo-img', alt: `${ctx.site.marca} — página inicial`, prioridade: true })}</a>
    <nav class="topo__nav" aria-label="Principal">
      <ul role="list">
        ${PRINCIPAIS.map(([c, t]) => `<li><a href="${ctx.url(c)}"${atual(caminho, c) ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('\n        ')}
      </ul>
    </nav>
    <div class="topo__acoes">
      <button class="botao-icone" type="button" id="abrir-procura" aria-label="Procurar" aria-haspopup="dialog" aria-controls="procura" aria-expanded="false">${ico('lupa')}</button>
      <a class="botao-icone pedido-icone" href="${ctx.url('/pedido/')}" aria-label="O meu pedido"${caminho === '/pedido/' ? ' aria-current="page"' : ''}>${ico('saco')}<span class="pedido-icone__n" data-conta hidden></span></a>
      <button class="botao-icone so-telemovel" type="button" id="abrir-menu" aria-label="Abrir o menu" aria-haspopup="dialog" aria-controls="menu" aria-expanded="false">${ico('menu')}</button>
    </div>
  </div>
</header>`;
}

function redes(ctx, classe = 'redes') {
  const c = ctx.site.contactos;
  const r = [];
  if (c.instagram) r.push(`<a href="https://www.instagram.com/${esc(c.instagram)}/" target="_blank" rel="noopener" aria-label="Instagram da ${esc(ctx.site.marca)}">${ico('instagram')}</a>`);
  if (c.facebook) r.push(`<a href="https://www.facebook.com/${esc(c.facebook)}" target="_blank" rel="noopener" aria-label="Facebook da ${esc(ctx.site.marca)}">${ico('facebook')}</a>`);
  if (c.email) r.push(`<a href="mailto:${esc(c.email)}" aria-label="Email da ${esc(ctx.site.marca)}">${ico('carta')}</a>`);
  return r.length ? `<div class="${classe}">${r.join('')}</div>` : '';
}

/* O menu do telemóvel: um <dialog> de ecrã inteiro FORA do <header> (no iPhone, um menu dentro do
   cabeçalho preso fica do tamanho dele). As categorias com a fotografia pequena, as páginas e as
   redes. */
function menu(ctx, caminho) {
  const marca = (c) => (c === caminho ? ' aria-current="page"' : '');
  const paginas = [['/celebracoes/', 'Celebrações'], ['/como-funciona/', 'Como funciona'], ['/sobre-nos/', 'Sobre nós'], ['/contactos/', 'Contactos']].filter(([c]) => ctx.existe(c));
  return `<dialog class="menu" id="menu" aria-label="Menu">
  <div class="menu__interior">
    <div class="menu__topo">
      ${logo(ctx, { alto: 52, classe: 'menu__logo', alt: ctx.site.marca })}
      <button class="botao-icone" type="button" data-fechar aria-label="Fechar o menu">${ico('fechar')}</button>
    </div>
    <nav class="menu__meio" aria-label="Criações">
      <a class="menu__todas" href="${ctx.url('/criacoes/')}"${marca('/criacoes/')}>Todas as criações${ico('seta')}</a>
      <ul class="menu__cats" role="list">
        ${ctx.categoriasComPecas.map((c) => `<li><a href="${ctx.url(`/criacoes/${c.slug}/`)}"${marca(`/criacoes/${c.slug}/`)}>${miniatura(ctx, c.foto)}<span>${esc(c.nome)}</span></a></li>`).join('\n        ')}
      </ul>
      <ul class="menu__paginas" role="list">
        ${paginas.map(([c, t]) => `<li><a href="${ctx.url(c)}"${marca(c)}>${esc(t)}</a></li>`).join('\n        ')}
      </ul>
    </nav>
    ${redes(ctx, 'redes menu__redes')}
  </div>
</dialog>`;
}

/* A procura: o campo e, por baixo, os resultados (o site.js procura no catálogo: o nome, a frase curta
   e a categoria, sem acentos nem maiúsculas). Vazia, mostra as categorias. */
function procura(ctx) {
  return `<dialog class="procura" id="procura" aria-label="Procurar">
  <div class="procura__interior">
    <form class="procura__linha" role="search" action="${ctx.url('/criacoes/')}" data-procura>
      <label class="procura__campo">
        ${ico('lupa')}
        <span class="so-leitor">Procurar nas criações</span>
        <input type="search" name="q" placeholder="Convites, velas, padrinhos…" autocomplete="off" enterkeyhint="search" spellcheck="false" aria-controls="procura-resultados">
      </label>
      <button class="botao-icone" type="button" data-fechar aria-label="Fechar a procura">${ico('fechar')}</button>
    </form>
    <p class="so-leitor" role="status" data-procura-estado></p>
    <div class="procura__resultados" id="procura-resultados" data-procura-resultados hidden></div>
    <div class="procura__inicio" data-procura-inicio>
      <p class="rotulo">Categorias</p>
      <div class="fichas">
        ${ctx.categoriasComPecas.map((c) => `<a href="${ctx.url(`/criacoes/${c.slug}/`)}">${esc(c.nome)}</a>`).join('\n        ')}
      </div>
    </div>
  </div>
</dialog>`;
}

/* O RODAPÉ curto (o Renato, 12 nov 2026: «está cheio de informação»): o logótipo, a frase e as redes;
   a ajuda em quatro ligações; e a linha de baixo só com «© ano Marca», as páginas legais e o Livro de
   Reclamações discreto (nunca o nome do dono, o NIF ou a morada: esses vivem nos Contactos e nos
   termos). */
function rodape(ctx) {
  const ligacao = (caminho, texto) => (ctx.existe(caminho) ? `<li><a href="${ctx.url(caminho)}">${esc(texto)}</a></li>` : '');
  return `<footer class="rodape">
  <div class="contentor">
    <div class="rodape__grelha">
      <div class="rodape__marca">
        <a class="rodape__logo" href="${ctx.url('/')}">${logo(ctx, { alto: 84, alt: `${ctx.site.marca} — página inicial` })}</a>
        <p class="rodape__frase">${esc(ctx.site.assinatura || '')}</p>
        ${redes(ctx)}
      </div>
      <nav class="rodape__ajuda" aria-labelledby="r-ajuda">
        <h2 class="rodape__titulo" id="r-ajuda">Ajuda</h2>
        <ul role="list">
          ${ligacao('/como-funciona/', 'Como funciona')}
          ${ligacao('/sobre-nos/', 'Sobre nós')}
          ${ligacao('/contactos/', 'Contactos')}
          ${ligacao('/pedido/', 'O meu pedido')}
        </ul>
      </nav>
    </div>
    <div class="rodape__legal">
      <p>© ${ctx.hoje.slice(0, 4)} ${esc(ctx.site.marca)}</p>
      <ul role="list">
        ${ligacao('/termos-e-condicoes/', 'Termos')}
        ${ligacao('/politica-de-privacidade/', 'Privacidade')}
        ${ligacao('/politica-de-cookies/', 'Cookies')}
        ${ligacao('/garantia/', 'Garantia')}
        ${ligacao('/resolucao-de-litigios/', 'Litígios')}
        <li>${livroBotao()}</li>
      </ul>
    </div>
  </div>
</footer>`;
}

export function pagina(ctx, { titulo, descricao, caminho, conteudo, partilha, tipo = 'website', jsonld = [], classe = '', indexar = true }) {
  const marca = ctx.site.marca;
  const tituloCompleto = titulo.includes(marca) ? titulo : `${titulo} | ${marca}`;
  const cartaoPartilha = partilha || ctx.manifesto.partilha._site;
  const l = ctx.manifesto.logo;
  const robots = !ctx.producao ? 'noindex, nofollow' : indexar === false ? 'noindex' : '';
  return `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(tituloCompleto)}</title>
<meta name="description" content="${esc(descricao)}">
<link rel="canonical" href="${ctx.absoluto(caminho)}">
${robots ? `<meta name="robots" content="${robots}">\n` : ''}<meta property="og:type" content="${tipo}">
<meta property="og:site_name" content="${esc(marca)}">
<meta property="og:locale" content="pt_PT">
<meta property="og:title" content="${esc(tituloCompleto)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${ctx.absoluto(caminho)}">
<meta property="og:image" content="${ctx.absoluto(`/assets/img/${cartaoPartilha}`)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(marca)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#EAE5DF">
<link rel="icon" type="image/png" sizes="32x32" href="${ctx.asset(`img/${l.icones[32]}`)}">
<link rel="icon" type="image/png" sizes="48x48" href="${ctx.asset(`img/${l.icones[48]}`)}">
<link rel="apple-touch-icon" href="${ctx.asset(`img/${l.icones.apple}`)}">
<link rel="preload" href="${ctx.asset('fontes/bellefair-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${ctx.asset('fontes/outfit-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${ctx.asset(ctx.ficheiros.css)}">
<script>document.documentElement.classList.add('js')</script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
<script src="${ctx.asset(ctx.ficheiros.js)}" defer></script>
</head>
<body${classe ? ` class="${esc(classe)}"` : ''} data-catalogo="${ctx.asset(ctx.ficheiros.catalogo)}" data-base="${ctx.url('/')}">
${sprite()}
<a class="saltar" href="#conteudo">Saltar para o conteúdo</a>
${cabecalho(ctx, caminho)}
${aviso(ctx)}
<main id="conteudo" tabindex="-1">
${conteudo}
</main>
${rodape(ctx)}
${menu(ctx, caminho)}
${procura(ctx)}
<div class="recado" role="status" aria-live="polite" data-recado></div>
</body>
</html>
`;
}

// As páginas do site: a inicial, as criações (todas e por categoria), a ficha de cada peça, as
// celebrações (a lista e cada uma), os contactos, o pedido, as páginas de texto e a 404.
// Cada função devolve { caminho, titulo, descricao, conteudo, … } e o layout.mjs veste-a.
import { esc, markdown, resumir, moradaCompleta } from './util.mjs';
import { ico } from './icones.mjs';
import { imagem, miniatura, cartao, cartaoCategoria, cartaoCelebracao, pastilhas, preco, logo, TAMANHOS_CARTAO } from './componentes.mjs';
import { opcoesDe, personalizacaoDe, quantidadeMinimaDe, OCASIOES } from '../lib/regras.mjs';

/* O que o Google lê de cada categoria (o <title> e a descrição), escrito à mão: o nome sozinho
   («Mesa | BE!Creative») não diz o que lá está. Uma categoria nova sem linha aqui usa o título e o
   texto dela. */
const SEO_CATEGORIAS = {
  batismo: ['Conjuntos de batismo personalizados', 'Caixas de batismo em veludo, linho ou pele, com a concha, a vela e a toalha bordada, personalizadas com o nome e a data. Atelier em Coimbra.'],
  convites: ['Convites personalizados de batizado, casamento e comunhão', 'Convites desenhados de raiz para batizados, casamentos, comunhões, aniversários e chás revelação. Também imprimimos convites digitais.'],
  lembrancas: ['Lembranças personalizadas para convidados', 'Lembranças em gesso perfumado, velas, ímans, dezenas, bolinhas de sabão e muito mais, com o nome e a data da celebração.'],
  padrinhos: ['Pedidos e presentes para padrinhos', 'Molduras livro, caixinhas para os padrinhos e convites com surpresa para fazer o grande pedido, ou agradecer a quem aceitou.'],
  mesa: ['Papelaria de mesa e decoração para eventos', 'Seating plans, marcadores de mesa, ementas, missais, livros de honra e placares de boas-vindas, a combinar com o convite.'],
  bebe: ['Recordações personalizadas para o bebé', 'Quadros e placas de nascimento, placas mensais, mealheiros, escovinhas com o nome e caixinhas de recordações.'],
  presentes: ['Presentes personalizados', 'Quadros ilustrados, caixas gravadas e chocolates com mensagem para o Dia da Mãe, o Dia do Pai, os Namorados e a Páscoa.'],
};

const trilho = (ctx, passos) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: passos.map(([nome, caminho], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, item: ctx.absoluto(caminho) })),
});

const fotoAbsoluta = (ctx, nome) => {
  const m = ctx.manifesto.fotos[nome];
  return ctx.absoluto(`/assets/img/${nome}-${m.resumo}-${m.larguras[m.larguras.length - 1]}.webp`);
};

function cabecaSeccao(etiqueta, titulo, { mais = '', id = '' } = {}) {
  return `<div class="cabeca">
  <div>${etiqueta ? `<p class="etiqueta">${esc(etiqueta)}</p>` : ''}<h2${id ? ` id="${id}"` : ''}>${esc(titulo)}</h2></div>
  ${mais}
</div>`;
}
const ligacaoMais = (ctx, caminho, texto) => `<a class="mais" href="${ctx.url(caminho)}">${esc(texto)}${ico('seta')}</a>`;

// ---------------------------------------------------------------- página inicial
export function inicio(ctx) {
  const h = ctx.inicio;
  const destaques = ctx.produtos.filter((p) => p.destaque).slice(0, 8);
  const celebracoes = ctx.celebracoes.filter((c) => c.destaque).slice(0, 3);
  const capa = h.capa;
  const fotoPeq = capa.fotoPequena && ctx.manifesto.fotos[capa.fotoPequena] ? capa.fotoPequena : '';
  const ligacaoCapa = ctx.existe(capa.ligacao) ? capa.ligacao : '/criacoes/';
  const passos = (h.passos.lista || []).slice(0, 4);
  const site = ctx.site;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: site.marca, alternateName: ['BE Creative', 'BE!Creative ®'], url: ctx.absoluto('/') },
    {
      '@context': 'https://schema.org', '@type': 'Organization', name: site.marca, url: ctx.absoluto('/'),
      logo: ctx.absoluto(`/assets/img/${ctx.manifesto.logo.altura[256].png}`), description: site.descricao,
      email: site.contactos.email,
      address: { '@type': 'PostalAddress', addressLocality: site.local.localidade, addressRegion: site.local.distrito, addressCountry: 'PT', ...(site.empresa.morada ? { streetAddress: site.empresa.morada } : {}), ...(site.empresa.codigoPostal ? { postalCode: site.empresa.codigoPostal } : {}) },
      sameAs: [site.contactos.instagram && `https://www.instagram.com/${site.contactos.instagram}/`, site.contactos.facebook && `https://www.facebook.com/${site.contactos.facebook}`].filter(Boolean),
    },
  ];
  const conteudo = `
<section class="capa">
  <div class="contentor capa__grelha">
    <div class="capa__texto">
      ${capa.etiqueta ? `<p class="etiqueta etiqueta--fio">${esc(capa.etiqueta)}</p>` : ''}
      <h1>${esc(capa.titulo)}</h1>
      ${capa.texto ? `<p class="capa__frase">${esc(capa.texto)}</p>` : ''}
      <div class="botoes">
        <a class="btn btn--cheio" href="${ctx.url(ligacaoCapa)}">${esc(capa.botao)}${ico('seta')}</a>
        <a class="btn btn--linha" href="${ctx.url('/como-funciona/')}">Como funciona</a>
      </div>
    </div>
    <div class="capa__fotos">
      <div class="capa__grande">${imagem(ctx, capa.foto, { tamanhos: '(min-width: 1240px) 600px, (min-width: 860px) 48vw, calc(100vw - 32px)', prioridade: true, moldura: 4 / 5 })}</div>
      ${fotoPeq ? `<div class="capa__pequena">${imagem(ctx, fotoPeq, { tamanhos: '(min-width: 860px) 250px, 38vw', moldura: 4 / 5, cedo: true })}</div>` : ''}
    </div>
  </div>
</section>

<section class="seccao" aria-labelledby="s-criacoes">
  <div class="contentor">
    ${cabecaSeccao(h.criacoes.etiqueta, h.criacoes.titulo, { id: 's-criacoes', mais: ligacaoMais(ctx, '/criacoes/', 'Ver todas') })}
    <ul class="cats" role="list">
      ${ctx.categoriasComPecas.map((c) => cartaoCategoria(ctx, c)).join('\n      ')}
    </ul>
  </div>
</section>

${destaques.length ? `<section class="seccao" aria-labelledby="s-destaques">
  <div class="contentor">
    ${cabecaSeccao(h.destaques.etiqueta, h.destaques.titulo, { id: 's-destaques' })}
    <ul class="grelha" role="list">
      ${destaques.map((p) => `<li>${cartao(ctx, p)}</li>`).join('\n      ')}
    </ul>
  </div>
</section>` : ''}

${celebracoes.length ? `<section class="seccao" aria-labelledby="s-celebracoes">
  <div class="contentor">
    ${cabecaSeccao(h.celebracoes.etiqueta, h.celebracoes.titulo, { id: 's-celebracoes', mais: ligacaoMais(ctx, '/celebracoes/', 'Ver celebrações') })}
    <ul class="celebs" role="list">
      ${celebracoes.map((c) => `<li>${cartaoCelebracao(ctx, c)}</li>`).join('\n      ')}
    </ul>
  </div>
</section>` : ''}

<section class="seccao" aria-labelledby="s-passos">
  <div class="contentor">
    ${cabecaSeccao(h.passos.etiqueta, h.passos.titulo, { id: 's-passos', mais: ligacaoMais(ctx, '/como-funciona/', 'Saber mais') })}
    <ol class="passos" role="list">
      ${passos.map((p, i) => `<li class="passo"><span class="passo__num" aria-hidden="true">${i + 1}</span><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="seccao">
  <div class="contentor">
    <div class="chamada">
      <div class="chamada__texto">
        <h2>${esc(h.chamada.titulo)}</h2>
        ${h.chamada.texto ? `<p>${esc(h.chamada.texto)}</p>` : ''}
        <a class="btn btn--claro" href="${ctx.url('/pedido/')}">${esc(h.chamada.botao)}${ico('seta')}</a>
      </div>
      <div class="chamada__foto">${imagem(ctx, h.chamada.foto, { tamanhos: '(min-width: 860px) 600px, 100vw', moldura: 4 / 3, alt: '' })}</div>
    </div>
  </div>
</section>`;
  return { caminho: '/', titulo: h.seo.titulo, descricao: h.seo.descricao, conteudo, jsonld, classe: 'pagina-inicio' };
}

// ---------------------------------------------------------------- criações
export function criacoes(ctx, slug = '') {
  const c = slug ? ctx.categorias.find((k) => k.slug === slug) : null;
  const lista = c ? ctx.produtos.filter((p) => p.categoria === slug) : ctx.produtos;
  const caminho = c ? `/criacoes/${slug}/` : '/criacoes/';
  const [seoTitulo, seoDescricao] = c ? (SEO_CATEGORIAS[slug] || [c.titulo, c.resumo]) : ['Criações personalizadas para batizados, casamentos e celebrações', 'Todas as criações da BE!Creative: conjuntos de batismo, convites, lembranças, peças para padrinhos, papelaria de mesa, recordações do bebé e presentes.'];
  const titulo = c ? c.titulo : 'Criações';
  const texto = c ? c.resumo : 'Tudo é feito de propósito para a tua celebração: escolhe as peças, junta-as ao pedido e recebe o orçamento.';
  const jsonld = [
    trilho(ctx, c ? [['Início', '/'], ['Criações', '/criacoes/'], [c.nome, caminho]] : [['Início', '/'], ['Criações', '/criacoes/']]),
    { '@context': 'https://schema.org', '@type': 'ItemList', name: titulo, itemListElement: lista.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: ctx.absoluto(`/pecas/${p.slug}/`), name: p.nome })) },
  ];
  const conteudo = `
<div class="contentor pagina-lista">
  ${pastilhas(ctx, slug)}
  <div class="lista__cabeca" data-painel-criacoes>
    <h1>${esc(titulo)}</h1>
    <p class="lista__texto">${esc(texto)}</p>
    <p class="lista__conta">${lista.length} ${lista.length === 1 ? 'peça' : 'peças'}</p>
  </div>
  <ul class="grelha" role="list">
    ${lista.map((p, i) => `<li>${cartao(ctx, p, { categoria: !c, cedo: i < 4 })}</li>`).join('\n    ')}
  </ul>
</div>`;
  return { caminho, titulo: seoTitulo, descricao: resumir(seoDescricao), conteudo, jsonld, classe: 'pagina-criacoes' };
}

// ---------------------------------------------------------------- ficha da peça
function galeria(ctx, p) {
  const fotos = p.fotos;
  const video = p.video && ctx.ficheiros.videos[p.video] ? p.video : '';
  const slides = fotos.map((f, i) => `<li class="galeria__slide" id="foto-${i + 1}">${imagem(ctx, f, { tamanhos: '(min-width: 1240px) 620px, (min-width: 860px) 52vw, 100vw', prioridade: i === 0, cedo: i === 0, moldura: 4 / 5 })}</li>`);
  if (video) {
    const poster = urlPoster(ctx, fotos[0]);
    slides.splice(1, 0, `<li class="galeria__slide galeria__slide--video" id="video"><video src="${ctx.asset(ctx.ficheiros.videos[video])}" poster="${poster}" muted loop playsinline preload="none" aria-label="Vídeo: ${esc(p.nome)}" data-video></video></li>`);
  }
  const total = slides.length;
  return `<div class="galeria" data-galeria>
  <ul class="galeria__fila" role="list" tabindex="0" aria-label="Fotografias de ${esc(p.nome)}">${slides.join('')}</ul>
  ${total > 1 ? `<div class="galeria__miniaturas" role="list">${fotos.map((f, i) => `<a role="listitem" href="#foto-${i + 1}" aria-label="Fotografia ${i + 1} de ${fotos.length}"${i === 0 ? ' aria-current="true"' : ''}>${miniatura(ctx, f, { lado: 64 })}</a>`).join('')}${video ? `<a role="listitem" class="galeria__mini-video" href="#video" aria-label="Ver o vídeo">${ico('play')}</a>` : ''}</div>
  <p class="galeria__pontos" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span${i === 0 ? ' class="ativo"' : ''}></span>`).join('')}</p>` : ''}
</div>`;
}
const urlPoster = (ctx, nome) => {
  const m = ctx.manifesto.fotos[nome];
  return ctx.asset(`img/${nome}-${m.resumo}-${m.larguras.find((w) => w >= 720) || m.larguras[m.larguras.length - 1]}.webp`);
};

export function peca(ctx, p) {
  const c = ctx.categorias.find((k) => k.slug === p.categoria);
  const caminho = `/pecas/${p.slug}/`;
  const opcoes = opcoesDe(p);
  const pers = personalizacaoDe(p);
  const minimo = quantidadeMinimaDe(p);
  const detalhes = [
    ...(Array.isArray(p.inclui) && p.inclui.length ? [['Inclui', p.inclui.join(' · ')]] : []),
    ...(p.composicao ? [['Composição', p.composicao]] : []),
    ...(Array.isArray(p.medidas) ? p.medidas.map((m) => [m.rotulo, m.valor]) : []),
    ...(p.idade ? [['Idade recomendada', p.idade]] : []),
    ...(p.referencia ? [['Referência', p.referencia]] : []),
  ];
  const avisos = String(p.avisos || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const perigos = String(p.perigos || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const fab = p.fabricante && p.fabricante.nome && p.fabricante.morada && p.fabricante.email ? p.fabricante : null;
  const campo = (f) => {
    const id = `p-${f.id}`;
    if (f.id === 'frase') return `<label class="campo" for="${id}"><span>${esc(f.rotulo)}</span><textarea id="${id}" name="${f.id}" rows="2" maxlength="300"></textarea></label>`;
    if (f.id === 'data') return `<label class="campo" for="${id}"><span>${esc(f.rotulo)}</span><input id="${id}" name="data" type="text" inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10" autocomplete="off" data-data></label>`;
    return `<label class="campo" for="${id}"><span>${esc(f.rotulo)}</span><input id="${id}" name="nome" type="text" maxlength="120" autocomplete="off"></label>`;
  };
  const relacionadas = ctx.produtos.filter((x) => x.categoria === p.categoria && x.slug !== p.slug).slice(0, 4);
  const emCelebracoes = ctx.celebracoes.filter((k) => (k.produtos || []).includes(p.slug)).slice(0, 3);
  const descricao = resumir(`${p.resumo} ${c ? `${c.nome} personalizados pela BE!Creative, em Coimbra.` : ''}`);
  const jsonld = [
    trilho(ctx, [['Início', '/'], ['Criações', '/criacoes/'], ...(c ? [[c.nome, `/criacoes/${c.slug}/`]] : []), [p.nome, caminho]]),
    { '@context': 'https://schema.org', '@type': 'Product', name: p.nome, description: p.resumo, image: p.fotos.slice(0, 4).map((f) => fotoAbsoluta(ctx, f)), brand: { '@type': 'Brand', name: ctx.site.marca }, category: c ? c.titulo : undefined, url: ctx.absoluto(caminho) },
  ];
  const conteudo = `
<div class="contentor ficha">
  <nav class="migalhas" aria-label="Estás aqui">
    <ol role="list"><li><a href="${ctx.url('/criacoes/')}">Criações</a></li>${c ? `<li><a href="${ctx.url(`/criacoes/${c.slug}/`)}">${esc(c.nome)}</a></li>` : ''}<li aria-current="page">${esc(p.nome)}</li></ol>
  </nav>
  <div class="ficha__grelha">
    ${galeria(ctx, p)}
    <div class="ficha__info">
      ${c ? `<p class="etiqueta">${esc(c.nome)}</p>` : ''}
      <h1 class="ficha__nome">${esc(p.nome)}</h1>
      ${preco(p, { classe: 'ficha__preco' })}
      <p class="ficha__resumo">${esc(p.resumo)}</p>
      ${p.descricao && p.descricao !== p.resumo ? `<div class="ficha__descricao">${markdown(p.descricao, ctx.url)}</div>` : ''}
      <form class="ficha__form" data-juntar="${esc(p.slug)}" novalidate>
        ${opcoes.map((g, i) => `<fieldset class="escolha">
          <legend>${esc(g.nome)}</legend>
          <div class="escolha__valores">${g.valores.map((v, j) => `<label><input type="radio" name="o${i}" value="${esc(v.nome)}"${j === 0 ? ' checked' : ''}><span>${esc(v.nome)}</span></label>`).join('')}</div>
        </fieldset>`).join('\n        ')}
        ${pers.length ? `<div class="campos">${pers.map(campo).join('')}</div>` : ''}
        <div class="ficha__juntar">
          <div class="quantidade" data-quantidade data-minimo="${minimo}">
            <button type="button" class="botao-icone" data-menos aria-label="Menos uma">${ico('menos')}</button>
            <label class="so-leitor" for="p-qtd">Quantidade</label>
            <input id="p-qtd" name="quantidade" type="number" inputmode="numeric" min="${minimo}" max="9999" value="${minimo}">
            <button type="button" class="botao-icone" data-mais aria-label="Mais uma">${ico('mais')}</button>
          </div>
          <button class="btn btn--cheio btn--largo" type="submit">${ico('saco')}Juntar ao pedido</button>
        </div>
        ${minimo > 1 ? `<p class="ficha__minimo">Mínimo: ${minimo} unidades.</p>` : ''}
      </form>
      <ul class="ficha__linhas" role="list">
        <li>${ico('conversa')}<span>Recebes o orçamento e o prazo antes de decidir.</span></li>
        <li>${ico('caixa')}<span>Levantamento em ${esc(ctx.site.local.localidade)} ou envio por transportadora.</span></li>
      </ul>
      ${detalhes.length ? `<dl class="detalhes">${detalhes.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${avisos.length || perigos.length ? `<div class="ficha__avisos"><p class="etiqueta">Avisos</p><ul>${[...perigos, ...avisos].map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
      ${fab ? `<p class="ficha__fabricante">Fabricante: ${esc(fab.nome)}, ${esc(fab.morada)}, ${esc(fab.email)}</p>` : ''}
    </div>
  </div>
</div>
${emCelebracoes.length ? `<section class="seccao" aria-labelledby="s-nas-celebracoes">
  <div class="contentor">
    ${cabecaSeccao('Celebrações', 'Vê esta peça numa celebração', { id: 's-nas-celebracoes' })}
    <ul class="celebs" role="list">${emCelebracoes.map((k) => `<li>${cartaoCelebracao(ctx, k)}</li>`).join('')}</ul>
  </div>
</section>` : ''}
${relacionadas.length ? `<section class="seccao" aria-labelledby="s-mais">
  <div class="contentor">
    ${cabecaSeccao(c ? c.nome : 'Criações', 'Também podes gostar', { id: 's-mais', mais: c ? ligacaoMais(ctx, `/criacoes/${c.slug}/`, 'Ver todas') : '' })}
    <ul class="grelha" role="list">${relacionadas.map((x) => `<li>${cartao(ctx, x, { categoria: false })}</li>`).join('')}</ul>
  </div>
</section>` : ''}`;
  return { caminho, titulo: c ? `${p.nome} · ${c.nome}` : p.nome, descricao, conteudo, jsonld, partilha: ctx.manifesto.partilha[p.slug], tipo: 'product', classe: 'pagina-peca' };
}

// ---------------------------------------------------------------- celebrações
export function celebracoes(ctx) {
  const lista = ctx.celebracoes;
  const conteudo = `
<div class="contentor pagina-lista">
  <div class="lista__cabeca">
    <h1>Celebrações</h1>
    <p class="lista__texto">Batizados, casamentos e outras festas em que fizemos tudo a combinar, do convite à mesa.</p>
  </div>
  <ul class="celebs celebs--lista" role="list">
    ${lista.map((c) => `<li>${cartaoCelebracao(ctx, c, { titulo: 'h2' })}</li>`).join('\n    ')}
  </ul>
</div>`;
  return { caminho: '/celebracoes/', titulo: 'Celebrações: batizados, casamentos e festas personalizados', descricao: 'Batizados, casamentos, chás revelação e outras festas com convites, lembranças e papelaria de mesa a combinar, feitos pela BE!Creative.', conteudo, jsonld: [trilho(ctx, [['Início', '/'], ['Celebrações', '/celebracoes/']])], classe: 'pagina-celebracoes' };
}

export function celebracao(ctx, c) {
  const caminho = `/celebracoes/${c.slug}/`;
  const pecas = (c.produtos || []).map((s) => ctx.produtos.find((p) => p.slug === s)).filter(Boolean);
  const creditos = [...new Set([c.credito, ...c.fotos.map((f) => ctx.fotos[f]?.credito)].filter(Boolean))];
  const conteudo = `
<article class="contentor celebracao">
  <nav class="migalhas" aria-label="Estás aqui"><ol role="list"><li><a href="${ctx.url('/celebracoes/')}">Celebrações</a></li><li aria-current="page">${esc(c.titulo)}</li></ol></nav>
  <header class="celebracao__cabeca">
    <p class="etiqueta">${esc(c.ocasiao)}${c.quando ? ` · ${esc(c.quando)}` : ''}</p>
    <h1>${esc(c.titulo)}</h1>
    ${c.texto ? `<div class="celebracao__texto">${markdown(c.texto, ctx.url)}</div>` : `<p class="celebracao__texto">${esc(c.resumo)}</p>`}
  </header>
  <ul class="mosaico" role="list">
    ${c.fotos.map((f, i) => `<li>${imagem(ctx, f, { tamanhos: '(min-width: 1240px) 400px, (min-width: 860px) 31vw, (min-width: 560px) 46vw, 100vw', prioridade: i === 0, cedo: i < 2 })}</li>`).join('\n    ')}
  </ul>
  ${creditos.length ? `<p class="celebracao__credito">Fotografias: ${creditos.map(esc).join(' · ')}</p>` : ''}
</article>
${pecas.length ? `<section class="seccao" aria-labelledby="s-pecas">
  <div class="contentor">
    ${cabecaSeccao('Nesta celebração', 'As peças', { id: 's-pecas' })}
    <ul class="grelha" role="list">${pecas.map((p) => `<li>${cartao(ctx, p)}</li>`).join('')}</ul>
  </div>
</section>` : ''}`;
  return { caminho, titulo: `${c.titulo} · ${c.ocasiao}`, descricao: resumir(`${c.ocasiao}: ${c.resumo}`), conteudo, jsonld: [trilho(ctx, [['Início', '/'], ['Celebrações', '/celebracoes/'], [c.titulo, caminho]])], partilha: ctx.manifesto.partilha[`celebracao-${c.slug}`], classe: 'pagina-celebracao' };
}

// ---------------------------------------------------------------- contactos
export function contactos(ctx) {
  const c = ctx.site.contactos;
  const e = ctx.site.empresa || {};
  const cartoes = [];
  if (c.email) cartoes.push(['carta', 'Email', `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`]);
  if (c.instagram) cartoes.push(['instagram', 'Instagram', `<a href="https://www.instagram.com/${esc(c.instagram)}/" target="_blank" rel="noopener">@${esc(c.instagram)}</a>`]);
  if (c.facebook) cartoes.push(['facebook', 'Facebook', `<a href="https://www.facebook.com/${esc(c.facebook)}" target="_blank" rel="noopener">${esc(ctx.site.marca)}</a>`]);
  if (c.whatsapp) cartoes.push(['whatsapp', 'WhatsApp', `<a href="https://wa.me/351${esc(String(c.whatsapp).replace(/\D/g, '').slice(-9))}" target="_blank" rel="noopener">Enviar mensagem</a>`]);
  cartoes.push(['local', 'Atelier', `${esc(e.morada ? moradaCompleta(e) : ctx.site.local.localidade)}<span class="contacto__nota">Levantamentos e reuniões combinados previamente.</span>`]);
  const ident = [e.nome, e.tipo, e.nif && `NIF ${e.nif}`].filter(Boolean).map(esc).join(' · ');
  const conteudo = `
<div class="contentor pagina-texto">
  <div class="lista__cabeca">
    <h1>Contactos</h1>
    <p class="lista__texto">Cada encomenda começa com uma conversa. Escreve-nos por onde preferires.</p>
  </div>
  <ul class="contactos" role="list">
    ${cartoes.map(([i, t, v]) => `<li class="contacto"><span class="contacto__icone">${ico(i)}</span><div><h2>${esc(t)}</h2><p>${v}</p></div></li>`).join('\n    ')}
  </ul>
  <p class="contactos__pedido"><a class="btn btn--cheio" href="${ctx.url('/pedido/')}">${ico('saco')}Fazer um pedido</a></p>
  <p class="contactos__identificacao">${ident || (ctx.producao ? '' : ctx.marcador('o nome, o tipo e o NIF de quem vende'))}</p>
</div>`;
  return { caminho: '/contactos/', titulo: 'Contactos', descricao: `Fala connosco por email, Instagram ou Facebook. Atelier em ${ctx.site.local.localidade}, com levantamento combinado previamente.`, conteudo, jsonld: [trilho(ctx, [['Início', '/'], ['Contactos', '/contactos/']])], classe: 'pagina-contactos' };
}

// ---------------------------------------------------------------- o pedido
export function pedido(ctx) {
  const c = ctx.site.contactos;
  const conteudo = `
<div class="contentor pagina-pedido" data-pedido>
  <div class="lista__cabeca">
    <h1>O teu pedido</h1>
    <p class="lista__texto">Junta as peças, conta-nos a ideia e envia: respondemos com o orçamento e o prazo.</p>
  </div>
  <div class="pedido__vazio" data-vazio hidden>
    <p>Ainda não juntaste nenhuma peça.</p>
    <p><a class="btn btn--cheio" href="${ctx.url('/criacoes/')}">Ver as criações${ico('seta')}</a></p>
    <p class="pedido__ou">Também podes escrever-nos sem escolher nada: conta-nos a tua ideia no formulário abaixo.</p>
  </div>
  <div class="pedido__grelha">
    <section class="pedido__pecas" aria-labelledby="p-pecas">
      <h2 class="so-leitor" id="p-pecas">As peças</h2>
      <ul class="linhas" role="list" data-linhas></ul>
    </section>
    <form class="pedido__form" data-formulario novalidate>
      <h2>Os teus dados</h2>
      <label class="campo" for="f-nome"><span>Nome</span><input id="f-nome" name="nome" type="text" autocomplete="name" required maxlength="120"></label>
      <label class="campo" for="f-contacto"><span>Email ou telemóvel</span><input id="f-contacto" name="contacto" type="text" autocomplete="email" required maxlength="160"></label>
      <div class="campos-lado">
        <label class="campo" for="f-ocasiao"><span>Celebração</span><select id="f-ocasiao" name="ocasiao"><option value="">Escolher…</option>${OCASIOES.map((o) => `<option>${esc(o)}</option>`).join('')}</select></label>
        <label class="campo" for="f-data"><span>Data</span><input id="f-data" name="data" type="text" inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10" autocomplete="off" data-data></label>
      </div>
      <fieldset class="escolha escolha--entrega">
        <legend>Entrega</legend>
        <div class="escolha__valores"><label><input type="radio" name="entrega" value="levantamento" checked><span>Levantamento em ${esc(ctx.site.local.localidade)}</span></label><label><input type="radio" name="entrega" value="envio"><span>Envio</span></label></div>
      </fieldset>
      <label class="campo" for="f-localidade" data-so-envio hidden><span>Localidade do envio</span><input id="f-localidade" name="localidade" type="text" autocomplete="address-level2" maxlength="80"></label>
      <label class="campo" for="f-mensagem"><span>A tua ideia (opcional)</span><textarea id="f-mensagem" name="mensagem" rows="4" maxlength="1500" placeholder="O tema, as cores, o que já tens…"></textarea></label>
      <p class="erro" data-erro hidden></p>
      <div class="pedido__enviar">
        ${c.whatsapp ? `<button class="btn btn--cheio btn--largo" type="submit" data-canal="whatsapp">${ico('whatsapp')}Enviar pelo WhatsApp</button>` : ''}
        <button class="btn ${c.whatsapp ? 'btn--linha' : 'btn--cheio'} btn--largo" type="submit" data-canal="email">${ico('carta')}Enviar por email</button>
        ${c.instagram ? `<button class="btn btn--linha btn--largo" type="submit" data-canal="instagram">${ico('instagram')}Enviar pelo Instagram</button>` : ''}
      </div>
      <p class="pedido__nota">O pedido abre no teu email ou no Instagram, já escrito: és tu que o envias. Enviar não te obriga a nada.</p>
    </form>
  </div>
  <div class="pedido__enviado" data-enviado hidden>
    <h2>Pedido pronto a enviar</h2>
    <p data-enviado-texto></p>
    <div class="botoes"><button class="btn btn--linha" type="button" data-copiar>${ico('copiar')}Copiar o pedido</button><button class="btn btn--linha" type="button" data-novo>Começar outro pedido</button></div>
  </div>
</div>`;
  return { caminho: '/pedido/', titulo: 'O teu pedido', descricao: 'Junta as peças de que gostas e envia o pedido por email ou pelo Instagram: respondemos com o orçamento e o prazo.', conteudo, indexar: false, classe: 'pagina-pedido' };
}

// ---------------------------------------------------------------- páginas de texto
export function texto(ctx, m) {
  const legal = Boolean(m.atualizado);
  const foto = m.foto && ctx.manifesto.fotos[m.foto] ? m.foto : '';
  const conteudo = `
<article class="contentor pagina-texto${m.modelo === 'passos' ? ' pagina-passos' : ''}${foto ? ' pagina-texto--foto' : ''}">
  <header class="lista__cabeca">
    <h1>${esc(m.titulo)}</h1>
    ${m.subtitulo ? `<p class="lista__texto">${esc(m.subtitulo)}</p>` : ''}
    ${legal ? `<p class="atualizado">Atualizado a ${esc(m.atualizado.split('-').reverse().join('/'))}</p>` : ''}
  </header>
  <div class="leitura__grelha">
    <div class="leitura">${m.html}</div>
    ${foto ? `<figure class="leitura__foto">${imagem(ctx, foto, { tamanhos: '(min-width: 860px) 420px, 100vw', moldura: 4 / 5 })}</figure>` : ''}
  </div>
</article>`;
  return { caminho: m.caminho, titulo: m.tituloSeo || m.titulo, descricao: m.descricao || '', conteudo, indexar: m.indexar && !legal, jsonld: [trilho(ctx, [['Início', '/'], [m.titulo, m.caminho]])], classe: legal ? 'pagina-legal' : 'pagina-leitura' };
}

// ---------------------------------------------------------------- 404
export function erro404(ctx) {
  const conteudo = `
<div class="contentor pagina-texto erro404">
  <div class="lista__cabeca">
    <h1>Esta página não existe</h1>
    <p class="lista__texto">Pode ter mudado de sítio. Procura nas criações, ou volta ao início.</p>
  </div>
  <div class="botoes"><a class="btn btn--cheio" href="${ctx.url('/criacoes/')}">Ver as criações${ico('seta')}</a><a class="btn btn--linha" href="${ctx.url('/')}">Página inicial</a></div>
</div>`;
  return { caminho: '/404.html', titulo: 'Página não encontrada', descricao: 'Esta página não existe.', conteudo, indexar: false, classe: 'pagina-404' };
}

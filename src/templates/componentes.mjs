// As peças que se repetem: fotografias, o logótipo, os cartões (peça, categoria, celebração), as
// pastilhas das categorias e as peças legais comuns.
import { esc, euros } from './util.mjs';
import { ico } from './icones.mjs';
import { precoDe } from '../lib/regras.mjs';
import { livroReclamacoes, VERSAO as LEGAL_COMUM_VERSAO } from '../../legal-comum/index.mjs';

/* AS PEÇAS DA BIBLIOTECA legal-comum (a cópia está em legal-comum/; não se edita aqui), entre os
   marcadores que o verificar-versoes.mjs dela procura nas páginas publicadas. */
export const pecaLegal = (nome, html) => `<!-- legal-comum:${nome} v${LEGAL_COMUM_VERSAO} -->${html}<!-- /legal-comum:${nome} -->`;

/* O Livro de Reclamações Eletrónico na variante DISCRETA da biblioteca (ícone e texto, a letra e a cor
   das ligações vizinhas, sem caixa), e só no rodapé. */
export const livroBotao = () => pecaLegal('livro', livroReclamacoes());

// ---------------------------------------------------------------- fotografias
/** O endereço de uma versão web de uma fotografia (scripts/imagens.py). */
export function urlFoto(ctx, nome, largura, fmt = 'webp') {
  const m = ctx.manifesto.fotos[nome] || ctx.manifesto.posters[nome];
  const w = largura ?? m.larguras[m.larguras.length - 1];
  return ctx.asset(`img/${nome}-${m.resumo}-${w}.${fmt}`);
}

/* O sizes de uma fotografia cortada numa moldura (object-fit: cover): uma fotografia mais larga do que
   a moldura mostra-se mais larga do que a caixa (os lados ficam de fora) e precisa de mais píxeis. */
export function escalarSizes(sizes, f) {
  if (!(f > 1.01)) return sizes;
  const partes = [];
  let fundo = 0;
  let atual = '';
  for (const ch of sizes) {
    if (ch === '(') fundo++;
    if (ch === ')') fundo--;
    if (ch === ',' && fundo === 0) { partes.push(atual.trim()); atual = ''; } else atual += ch;
  }
  partes.push(atual.trim());
  const k = f.toFixed(3);
  return partes.map((x) => {
    const m = /^(\([^()]*\))\s+(.+)$/.exec(x);
    return m ? `${m[1]} calc(${m[2]} * ${k})` : `calc(${x} * ${k})`;
  }).join(', ');
}

/* <picture> com AVIF e WebP em várias larguras (só as que a fotografia tem: o imagens.py nunca
   aumenta). «tamanhos» é o atributo sizes (a largura a que a fotografia aparece): é com ele que o
   browser escolhe a versão. Fora do primeiro ecrã, loading="lazy". O ponto de foco
   (content/fotos.json) diz onde se corta quando a moldura é de outra forma. «moldura»: a forma
   (largura/altura) da caixa onde a fotografia é cortada. */
export function imagem(ctx, nome, { tamanhos = '100vw', classe = '', prioridade = false, alt, foco, ate = Infinity, moldura = 0, cedo = false } = {}) {
  const m = ctx.manifesto.fotos[nome] || ctx.manifesto.posters[nome];
  if (!m) throw new Error(`imagem «${nome}» não existe em media/fotos`);
  if (moldura) tamanhos = escalarSizes(tamanhos, (m.largura / m.altura) / moldura);
  const info = ctx.fotos[nome] || {};
  const texto = alt ?? info.alt ?? '';
  const ponto = foco ?? info.foco ?? '50% 50%';
  const larguras = m.larguras.filter((w, i) => w <= ate || i === 0 || m.larguras[i - 1] < ate);
  const srcset = (fmt) => larguras.map((w) => `${ctx.asset(`img/${nome}-${m.resumo}-${w}.${fmt}`)} ${w}w`).join(', ');
  const fontes = m.formatos.filter((f) => f !== 'webp').map((f) => `<source type="image/${f}" srcset="${srcset(f)}" sizes="${tamanhos}">`).join('');
  const meio = larguras.find((w) => w >= 720) || larguras[larguras.length - 1];
  const estilo = ponto !== '50% 50%' ? ` style="object-position:${esc(ponto)}"` : '';
  const carga = prioridade ? ' fetchpriority="high"' : cedo ? '' : ' loading="lazy"';
  return `<picture${classe ? ` class="${esc(classe)}"` : ''}>${fontes}<img src="${ctx.asset(`img/${nome}-${m.resumo}-${meio}.webp`)}" srcset="${srcset('webp')}" sizes="${tamanhos}" width="${m.largura}" height="${m.altura}" alt="${esc(texto)}"${carga} decoding="async"${estilo}></picture>`;
}

/* Uma fotografia pequena (o menu, a procura, as linhas do pedido): só a versão de 360. */
export function miniatura(ctx, nome, { lado = 52, classe = 'mini' } = {}) {
  const m = ctx.manifesto.fotos[nome];
  const ponto = ctx.fotos[nome]?.foco || '50% 50%';
  return `<img class="${esc(classe)}" src="${urlFoto(ctx, nome, m.larguras[0])}" width="${lado}" height="${lado}" alt="" loading="lazy" decoding="async"${ponto !== '50% 50%' ? ` style="object-position:${esc(ponto)}"` : ''}>`;
}

// ---------------------------------------------------------------- o logótipo
/* O logótipo da BE!Creative tal como é (media/marca/logo.png: o desenho deles, só sem o fundo, nunca
   redesenhado nem recolorido): o bordô sobre a pedra. «alto» é a altura em CSS. */
export function logo(ctx, { alto, classe = '', alt = '', prioridade = false } = {}) {
  const l = ctx.manifesto.logo;
  const alturas = Object.keys(l.altura).map(Number).sort((a, b) => a - b);
  const largo = Math.round((l.w * alto) / l.h);
  const src = l.altura[alturas.find((h) => h >= alto * 2) || alturas[alturas.length - 1]];
  const srcset = alturas.map((h) => `${ctx.asset(`img/${l.altura[h].webp}`)} ${l.altura[h].largura}w`).join(', ');
  const carga = prioridade ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<img${classe ? ` class="${esc(classe)}"` : ''} src="${ctx.asset(`img/${src.webp}`)}" srcset="${srcset}" sizes="${largo}px" width="${largo}" height="${alto}" alt="${esc(alt)}"${carga} decoding="async">`;
}

// ---------------------------------------------------------------- preços (quando os houver)
/* A BE!Creative trabalha por orçamento: sem preço não se mostra nada (o cartão e a ficha não dizem
   «sob consulta» em cada peça — di-lo uma vez a ficha, junto do botão). Com preço: «desde 12,00 €». */
export function preco(p, { classe = 'preco' } = {}) {
  const v = precoDe(p);
  if (v.valor === null) return '';
  return `<p class="${classe}">${v.desde ? '<span class="preco__desde">desde </span>' : ''}<span class="preco__valor">${euros(v.valor)}</span></p>`;
}

// ---------------------------------------------------------------- cartões
/* A seta num círculo, igual em todos os cartões (decorativa: o cartão inteiro é a ligação). */
export const setaCirculo = () => `<span class="seta-circulo" aria-hidden="true">${ico('seta')}</span>`;

/* O cartão de uma peça: a fotografia (4:5, cantos redondos), o nome, a categoria e a seta. Sem
   botão de juntar: escolhe-se e junta-se na ficha. O cartão inteiro leva à ficha (a ligação do nome
   estende-se por cima dele com ::after). */
export const TAMANHOS_CARTAO = '(min-width: 1240px) 290px, (min-width: 1100px) calc(25vw - 33px), (min-width: 640px) calc(33.3vw - 30px), calc(50vw - 28px)';
export function cartao(ctx, p, { titulo = 'h3', tamanhos = TAMANHOS_CARTAO, prioridade = false, cedo = false, categoria = true } = {}) {
  const c = ctx.categorias.find((k) => k.slug === p.categoria);
  return `<article class="cartao">
  <div class="cartao__foto">${imagem(ctx, p.fotos[0], { tamanhos, prioridade, cedo, moldura: 4 / 5, alt: '' })}</div>
  <div class="cartao__linha">
    <div>
      <${titulo} class="cartao__nome"><a href="${ctx.url(`/pecas/${p.slug}/`)}">${esc(p.nome)}</a></${titulo}>
      ${categoria && c ? `<p class="cartao__cat">${esc(c.nome)}</p>` : ''}${preco(p, { classe: 'cartao__preco' })}
    </div>
    ${setaCirculo()}
  </div>
</article>`;
}

/* O cartão de uma celebração (como na proposta C): a fotografia (3:4), a ocasião em letra manuscrita,
   o título e a frase curta. O cartão inteiro leva à celebração. */
export function cartaoCelebracao(ctx, c, { tamanhos = '(min-width: 1240px) 380px, (min-width: 860px) 31vw, 82vw', titulo = 'h3', foto = c.fotos[0] } = {}) {
  return `<article class="celeb">
  <div class="celeb__foto">${imagem(ctx, foto, { tamanhos, moldura: 3 / 4, alt: '' })}</div>
  <span class="esc celeb__ocasiao" aria-hidden="true">${esc(c.ocasiao.toLowerCase())}</span>
  <${titulo} class="celeb__titulo"><a href="${ctx.url(`/celebracoes/${c.slug}/`)}">${esc(c.titulo)}</a></${titulo}>
  <p class="celeb__resumo">${esc(c.resumo)}</p>
</article>`;
}

/* As pastilhas das categorias, por cima da grelha das criações: são PÁGINAS (/criacoes/<slug>/), e a
   página não volta ao topo quando se muda (o interface.js guarda onde estava a fila). */
export function pastilhas(ctx, atual) {
  const lista = [{ slug: '', nome: 'Todas' }, ...ctx.categoriasComPecas];
  return `<nav class="pastilhas" aria-label="Categorias" data-pastilhas>
  <ul role="list">
    ${lista.map((c) => {
      const caminho = c.slug ? `/criacoes/${c.slug}/` : '/criacoes/';
      return `<li><a href="${ctx.url(caminho)}"${(atual || '') === c.slug ? ' aria-current="page"' : ''}>${esc(c.nome)}</a></li>`;
    }).join('\n    ')}
  </ul>
</nav>
<script>${REPOR_LUGAR}</script>`;
}

/* Repõe a página no sítio onde estava quando se carregou numa pastilha (o interface.js guardou-o): corre
   EM LINHA, logo a seguir à fila, antes da primeira pintura, e outra vez quando chegam as letras (que
   mudam uns píxeis a altura por cima), até a pessoa mexer na página. */
const REPOR_LUGAR = `(function(){try{var l=JSON.parse(sessionStorage.getItem('becreative:lugar')||'null');if(!l||l.para!==location.pathname||Date.now()-l.t>15000)return;sessionStorage.removeItem('becreative:lugar');document.documentElement.setAttribute('data-lugar','');var nav=document.querySelector('[data-pastilhas]'),ul=nav.querySelector('ul'),parado=false;function repor(){if(parado)return;var h=document.documentElement,s=h.style.scrollBehavior;h.style.scrollBehavior='auto';window.scrollTo(0,nav.getBoundingClientRect().top+window.scrollY-l.topo);ul.scrollLeft=l.esq;h.style.scrollBehavior=s;}repor();['wheel','touchstart','keydown','mousedown'].forEach(function(e){window.addEventListener(e,function(){parado=true;},{once:true,passive:true});});document.addEventListener('DOMContentLoaded',repor);window.addEventListener('load',repor);if(document.fonts)document.fonts.ready.then(repor);}catch(e){}})();`;

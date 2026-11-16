#!/usr/bin/env node
// Os testes do site da BE!Creative: as regras dos dados (com conteúdo de ensaio, nunca o content/ dos
// donos), e o site construído numa pasta à parte (pré-visualização e produção). O CI corre-os antes de
// cada publicação.   node scripts/testar.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../src/lib/regras.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0;
const falhas = [];
function t(nome, fn) {
  try { fn(); ok++; } catch (e) { falhas.push(`${nome}: ${e.message}`); }
}
const igual = (a, b, m = '') => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m} esperava ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`); };
const verdade = (v, m) => { if (!v) throw new Error(m || 'falso'); };

// ---------------------------------------------------------------- regras (conteúdo de ensaio)
const lerPasta = (d) => Object.fromEntries(fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => [f.slice(0, -5), fs.readFileSync(path.join(d, f), 'utf8')]));
const base = {
  site: fs.readFileSync(path.join(RAIZ, 'content/site.json'), 'utf8'),
  inicio: fs.readFileSync(path.join(RAIZ, 'content/inicio.json'), 'utf8'),
  categorias: fs.readFileSync(path.join(RAIZ, 'content/categorias.json'), 'utf8'),
  fotos: fs.readFileSync(path.join(RAIZ, 'content/fotos.json'), 'utf8'),
  artigos: lerPasta(path.join(RAIZ, 'content/produtos')),
  celebracoes: lerPasta(path.join(RAIZ, 'content/celebracoes')),
  ficheirosFotos: fs.readdirSync(path.join(RAIZ, 'media/fotos')).filter((f) => f.endsWith('.jpg')).map((f) => f.slice(0, -4)),
  videos: fs.readdirSync(path.join(RAIZ, 'media/video')).filter((f) => f.endsWith('.mp4')).map((f) => f.slice(0, -4)),
};
const peca = (extra = {}) => ({ nome: 'Peça de ensaio', fotos: ['moldura-livro-1'], resumo: 'Uma frase.', descricao: 'Um texto.', categoria: 'padrinhos', publicado: true, ...extra });
const com = (artigos) => ({ ...base, artigos: { ...artigos } });
const classes = (lista, prefixo) => lista.filter((p) => p.chave.startsWith(prefixo)).map((p) => p.classe);

t('o conteúdo atual não bloqueia', () => igual(R.problemas(base, {}).filter((p) => p.classe === 'bloqueia').length, 0));
t('uma peça sem preço não tem problema (é por orçamento)', () => igual(R.problemas(com({ x: JSON.stringify(peca()) })).filter((p) => p.slug === 'x').length, 0));
t('um preço escrito com € avisa', () => verdade(R.problemas(com({ x: JSON.stringify(peca({ preco: '12 €' })) })).some((p) => p.chave === 'artigo:x:preco')));
t('sem nome, a peça fica escondida', () => verdade(classes(R.problemas(com({ x: JSON.stringify(peca({ nome: '' })) })), 'artigo:x:nome').includes('neutraliza')));
t('sem fotografias, a peça fica escondida', () => verdade(R.problemas(com({ x: JSON.stringify(peca({ fotos: [] })) })).some((p) => p.chave === 'artigo:x:sem-fotos' && p.efeito === 'esconder')));
t('uma fotografia que não existe sai só ela', () => {
  const l = R.problemas(com({ x: JSON.stringify(peca({ fotos: ['moldura-livro-1', 'nao-existe'] })) }));
  verdade(l.some((p) => p.chave === 'artigo:x:foto-em-falta:nao-existe' && p.efeito === 'sem_fotografia'));
  const n = R.neutralizar(com({ x: JSON.stringify(peca({ fotos: ['moldura-livro-1', 'nao-existe'] })) }), l);
  igual(n.artigos.x.fotos, ['moldura-livro-1']);
});
t('uma categoria que não existe esconde a peça', () => verdade(R.problemas(com({ x: JSON.stringify(peca({ categoria: 'outra' })) })).some((p) => p.chave === 'artigo:x:categoria' && p.classe === 'neutraliza')));
t('«sustentável» esconde a peça', () => verdade(R.problemas(com({ x: JSON.stringify(peca({ resumo: 'Prático e sustentável.' })) })).some((p) => p.chave === 'artigo:x:alegacoes')));
t('«</script» esconde a peça', () => verdade(R.problemas(com({ x: JSON.stringify(peca({ descricao: 'a</script>b' })) })).some((p) => p.chave === 'artigo:x:partia-a-pagina')));
t('uma toalha sem composição: lembrete na prévia, esconde em produção', () => {
  const a = JSON.stringify(peca({ nome: 'Toalha bordada' }));
  verdade(R.problemas(com({ x: a })).some((p) => p.chave === 'artigo:x:composicao:previa' && p.lembrete));
  verdade(R.problemas(com({ x: a }), { producao: true }).some((p) => p.chave === 'artigo:x:composicao:producao' && p.classe === 'neutraliza'));
});
t('escolhas: só os grupos com dois valores', () => igual(R.opcoesDe({ opcoes: [{ nome: 'Caixa', valores: [{ nome: 'Veludo' }, { nome: 'Linho' }] }, { nome: 'Só um', valores: [{ nome: 'x' }] }] }), [{ nome: 'Caixa', valores: [{ nome: 'Veludo' }, { nome: 'Linho' }] }]));
t('personalização: os campos ligados com o rótulo', () => igual(R.personalizacaoDe({ personalizacao: { nome: true, data: false, frase: true, rotuloNome: 'Nome do bebé' } }), [{ id: 'nome', rotulo: 'Nome do bebé' }, { id: 'frase', rotulo: 'Tema, cores ou frase' }]));
t('o email é obrigatório (bloqueia)', () => {
  const site = JSON.parse(base.site); site.contactos.email = '';
  verdade(R.problemas({ ...base, site: JSON.stringify(site) }).some((p) => p.chave === 'site:contactos.email:vazio' && p.classe === 'bloqueia'));
});
t('em produção, sem o nome e o NIF, bloqueia', () => {
  const l = R.problemas(base, { producao: true }).filter((p) => p.classe === 'bloqueia').map((p) => p.chave);
  verdade(l.includes('site:empresa.nome:vazio:producao') && l.includes('site:empresa.nif:vazio:producao'), l.join(','));
});
t('um NIF inválido bloqueia', () => {
  const site = JSON.parse(base.site); site.empresa.nif = '123456780';
  verdade(R.problemas({ ...base, site: JSON.stringify(site) }).some((p) => p.chave === 'site:empresa.nif'));
});
t('celebração com uma peça que não existe avisa', () => {
  const c = JSON.parse(base.celebracoes['lacos-em-aguarela']); c.produtos.push('nao-existe');
  verdade(R.problemas({ ...base, celebracoes: { ...base.celebracoes, 'lacos-em-aguarela': JSON.stringify(c) } }).some((p) => p.chave.startsWith('celebracao:lacos-em-aguarela:produtos.')));
});
t('as fotografias em uso incluem as das celebrações e da capa', () => {
  const u = R.fotosEmUso(base);
  verdade(u.has('lacos-em-aguarela-1') && u.has('convite-de-batizado-1') && u.has('moldura-livro-1'));
});
t('a peça em destaque que não existe lembra (e a secção sai)', () => {
  const h = JSON.parse(base.inicio); h.destaque.peca = 'nao-existe';
  verdade(R.problemas({ ...base, inicio: JSON.stringify(h) }).some((p) => p.chave === 'inicio:destaque.peca' && p.lembrete));
});
t('a capa sem fotografias bloqueia', () => {
  const h = JSON.parse(base.inicio); h.capa.fotos = [];
  verdade(R.problemas({ ...base, inicio: JSON.stringify(h) }).some((p) => p.chave === 'inicio:capa.fotos:vazia' && p.classe === 'bloqueia'));
});
t('o slug de uma peça nova', () => igual(R.gerarSlug('Vela & Concha', ['vela-concha']), 'vela-concha-2'));
t('o painel não muda a marca', () => igual(R.mudancasBloqueadas({ marca: 'BE!Creative' }, { marca: 'Outra' }, 'site').map((x) => x.caminho), ['marca']));

// ---------------------------------------------------------------- o site construído
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'becreative-testar-'));
const construir = (args) => execFileSync('node', [path.join(RAIZ, 'scripts/build.mjs'), '--sem-imagens', ...args], { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const previa = path.join(tmp, 'previa');
let construiu = false;
t('a pré-visualização constrói', () => { construir([`--saida=${previa}`, '--base=/becreative']); construiu = true; });
if (construiu) {
  const ler = (rel) => fs.readFileSync(path.join(previa, rel), 'utf8');
  t('as páginas principais existem', () => {
    for (const c of ['index.html', 'criacoes/index.html', 'criacoes/batismo/index.html', 'pecas/moldura-livro/index.html', 'celebracoes/index.html', 'celebracoes/lacos-em-aguarela/index.html', 'pedido/index.html', 'contactos/index.html', 'como-funciona/index.html', 'sobre-nos/index.html', 'termos-e-condicoes/index.html', '404.html']) verdade(fs.existsSync(path.join(previa, c)), c);
  });
  t('a pré-visualização é noindex e não tem sitemap', () => { verdade(ler('index.html').includes('content="noindex, nofollow"')); verdade(!fs.existsSync(path.join(previa, 'sitemap.xml'))); });
  t('o rodapé leva só «© ano Marca», sem NIF nem morada', () => {
    const r = ler('index.html').split('<footer')[1];
    verdade(/© \d{4} BE!Creative/.test(r)); verdade(!/NIF|\d{4}-\d{3}/.test(r), 'o rodapé tem dados da empresa');
  });
  t('o Livro de Reclamações só no rodapé', () => {
    const h = ler('contactos/index.html');
    igual((h.match(/<!-- legal-comum:livro v/g) || []).length, 1);
    verdade(h.indexOf('legal-comum:livro') > h.indexOf('<footer'));
  });
  t('as fichas não têm botão de comprar nos cartões', () => verdade(!/cartao[^"]*"[^>]*>\s*<button/.test(ler('criacoes/index.html'))));
  t('a ficha tem o formulário do pedido', () => verdade(ler('pecas/conjunto-de-batismo/index.html').includes('data-juntar="conjunto-de-batismo"')));
  t('o catálogo do browser tem as peças e o email', () => {
    const f = fs.readdirSync(path.join(previa, 'assets')).find((x) => x.startsWith('catalogo-'));
    const c = JSON.parse(fs.readFileSync(path.join(previa, 'assets', f), 'utf8'));
    verdade(c.email === 'creativebe.design20@gmail.com'); verdade(Object.keys(c.produtos).length > 40); verdade(c.produtos['moldura-livro'].url === '/becreative/pecas/moldura-livro/');
  });
  t('as categorias sem peças não têm página', () => {
    const cats = JSON.parse(base.categorias);
    for (const c of cats) verdade(fs.existsSync(path.join(previa, 'criacoes', c.slug, 'index.html')), c.slug);
  });
  t('um parágrafo que é só um marcador fica num <p> (e os de bloco não)', () => {
    verdade(ler('como-funciona/index.html').includes('<p>MB WAY ou transferência'));
    verdade(!/<p>\s*<(div|figure|ul)/.test(ler('politica-de-privacidade/index.html') + ler('garantia/index.html')));
  });
  t('a página inicial não repete fotografias', () => {
    const h = ler('index.html');
    const corpo = h.slice(h.indexOf('<main'), h.indexOf('</main>'));
    const nomes = [...corpo.matchAll(/src="[^"]*\/img\/([a-z0-9-]+?)-[0-9a-f]{10}-\d+\.\w+"/g)].map((m) => m[1]);
    igual(nomes.filter((n, i) => nomes.indexOf(n) !== i), []);
  });
  t('nada de restos de outros sites', () => verdade(!/dream ?art|mimices|rio tinto|gondomar/i.test(ler('index.html') + ler('termos-e-condicoes/index.html'))));
}
// a produção: só com os dados legais (conteúdo de ensaio numa cópia, nunca o content/ dos donos)
const conteudoProd = path.join(tmp, 'conteudo');
fs.cpSync(path.join(RAIZ, 'content'), conteudoProd, { recursive: true });
{
  const site = JSON.parse(fs.readFileSync(path.join(conteudoProd, 'site.json'), 'utf8'));
  site.empresa = { ...site.empresa, nome: 'Nome de Ensaio', tipo: 'Empresário em nome individual', nif: '123456789', morada: 'Rua de Ensaio, 1', codigoPostal: '3000-000', iva: 'Os preços incluem IVA à taxa legal em vigor.' };
  // um NIF válido de ensaio (o dígito de controlo certo)
  let s = 0; const n = '12345678'; for (let i = 0; i < 8; i++) s += Number(n[i]) * (9 - i); const r = s % 11; site.empresa.nif = n + (r < 2 ? 0 : 11 - r);
  site.pedido.portes = 'Os portes vão no orçamento, conforme o tamanho da encomenda e a morada.';
  fs.writeFileSync(path.join(conteudoProd, 'site.json'), JSON.stringify(site, null, 2) + '\n');
}
const prod = path.join(tmp, 'prod');
let construiuProd = false;
t('a produção constrói com os dados legais', () => { construir([`--saida=${prod}`, `--conteudo=${conteudoProd}`, '--producao']); construiuProd = true; });
if (construiuProd) {
  const ler = (rel) => fs.readFileSync(path.join(prod, rel), 'utf8');
  t('em produção, as legais têm noindex e ficam fora do sitemap', () => {
    const mapa = ler('sitemap.xml');
    for (const p of ['termos-e-condicoes', 'politica-de-privacidade', 'politica-de-cookies', 'resolucao-de-litigios', 'garantia']) {
      verdade(ler(`${p}/index.html`).includes('name="robots" content="noindex"'), p);
      verdade(!mapa.includes(`/${p}/`), `${p} no sitemap`);
    }
    for (const p of ['/criacoes/', '/celebracoes/', '/como-funciona/', '/sobre-nos/', '/contactos/']) verdade(mapa.includes(p), `${p} fora do sitemap`);
    verdade(!mapa.includes('/pedido/'), 'o pedido no sitemap');
  });
  t('em produção, nada por confirmar', () => verdade(!ler('termos-e-condicoes/index.html').includes('por-confirmar')));
  t('em produção, o NIF nos contactos e nos termos', () => { verdade(ler('contactos/index.html').includes('NIF')); verdade(ler('termos-e-condicoes/index.html').includes('NIF')); });
}
t('em produção, sem os dados legais, a construção pára', () => {
  let parou = false;
  try { construir([`--saida=${path.join(tmp, 'prod2')}`, '--producao']); } catch { parou = true; }
  verdade(parou);
});
fs.rmSync(tmp, { recursive: true, force: true });

for (const f of falhas) console.error(`  ✗ ${f}`);
console.log(`testes: ${ok} certos, ${falhas.length} errados`);
process.exit(falhas.length ? 1 : 0);

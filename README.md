# BE!Creative — o site

Site da **BE!Creative ®**, atelier de design em Coimbra (@be.creative.design): conjuntos de batismo,
convites, lembranças, peças para padrinhos, papelaria de mesa, recordações do bebé e presentes, tudo
personalizado para batizados, casamentos e outras celebrações.

**Não há preços nem pagamentos no site.** Junta-se peças a um **pedido** (as quantidades, as escolhas, os
nomes) e envia-se por email ou pelo Instagram, com a mensagem já escrita. A BE!Creative responde com o
orçamento e o prazo; a encomenda fica feita quando o cliente o aceita.

- **O desenho é próprio**: a proposta C, «Papelaria» (escolhida pelo Renato a 16 nov 2026) — papel claro
  (#F7F4EF), o bordô do logótipo (#79232E) nos títulos e botões, cabeças ao centro com uma palavra
  manuscrita por cima; Gloock nos títulos, Pinyon Script no manuscrito, Red Hat Text no texto.
  O gerador, as regras e a legal-comum são os dos outros sites do Renato.
- **Celebrações**: o portefólio de eventos reais (batizados, casamentos, chás revelação), cada um com as
  fotografias e as peças que levou.

## Correr

```bash
python3 scripts/imagens.py               # as versões web das fotografias (Pillow), para .cache/imagens
node scripts/build.mjs                   # o site em _site/ (python3 -m http.server 4960 --directory _site)
node scripts/build.mjs --base=/becreative   # como no GitHub Pages
node scripts/build.mjs --producao        # como no domínio: pára se faltar um dado que a lei pede
node scripts/testar.mjs                  # os testes
```

## Onde está cada coisa

| | |
|---|---|
| `content/site.json` | marca, contactos, dados legais, aviso do topo, prazos, pagamento, levantamento e envio |
| `content/produtos/*.json` | uma peça por ficheiro (o nome do ficheiro é o endereço: /pecas/<nome>/) |
| `content/celebracoes/*.json` | uma celebração por ficheiro (/celebracoes/<nome>/) |
| `content/categorias.json` | as 7 categorias (as que não têm peças não aparecem) |
| `content/inicio.json` | os textos e as fotografias da página inicial |
| `content/paginas/*.md` | páginas de texto (como funciona, sobre nós, legais), com marcadores `{{…}}` |
| `content/fotos.json` | texto alternativo, ponto de foco e crédito de cada fotografia |
| `media/fotos/` | as fotografias (as versões web faz o `scripts/imagens.py`) |
| `media/video/` | os vídeos das fichas (sem som: a música dos reels é do Instagram) |
| `media/marca/logo.png` | o logótipo deles, só sem o fundo (nunca redesenhado nem recolorido) |
| `src/lib/regras.mjs` | as regras dos dados: as mesmas no gerador e no painel (cópia byte a byte) |
| `legal-comum/` | as peças legais comuns aos sites do Renato (instalada por `_ferramentas/legal-comum`) |

O material do cliente (a recolha do Instagram, a conversa, o logótipo original, o script do catálogo)
está em `_cliente/`, fora do git. O catálogo inicial foi gerado por `_cliente/ferramentas/catalogo.py`
(a partir do Instagram, a 16 nov 2026); depois disso, o conteúdo muda-se no painel.

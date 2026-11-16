# Plano — o site da BE!Creative

Escrito a 16 nov 2026. Pedido do Renato: um site para a BE!Creative ® com tudo o que está no Instagram
(@be.creative.design) — as criações, os vídeos e a informação dos destaques —, «organizado muito bem»,
e um backoffice simples, moderno e intuitivo.

## 0. Decisões

1. **Sem preços**: no Instagram não há nenhum (zero nas 157 histórias, lidas por OCR), e o destaque «Como
   funciona» diz que cada encomenda começa com uma conversa. O site é um catálogo com **pedido de
   orçamento**: juntam-se peças (quantidade, escolhas, nomes), e o pedido sai por email (o deles) ou pelo
   Instagram, já escrito. Com WhatsApp (se o derem), o botão principal passa a ser esse. O campo do preço
   existe (opcional, com «desde») para o dia em que o quiserem pôr.
2. **O catálogo**: 7 categorias (Batismo, Convites, Lembranças, Padrinhos, Mesa, Bebé, Presentes) e 59
   peças, cada uma com as fotografias das publicações (e, no bebé, das histórias, recortadas sem o texto).
   As escolhas dos conjuntos de batismo (caixa, vela, cor, concha) são as do destaque deles.
3. **Celebrações**: o portefólio de 8 eventos reais (batizados, casamentos, um chá revelação), com as peças
   de cada um — é o que mostra a força da marca: tudo a combinar, do convite à mesa. Títulos pelo tema
   («Laços em aguarela»), nunca pelo nome das crianças.
4. **Fotografias fora do site**: caras de crianças e de pessoas, personagens de terceiros (Disney, Panda),
   garrafas de marca, imagens do Freepik (lista em `_cliente/notas/resumo.md`). As dos fotógrafos levam
   o crédito.
5. **O desenho**: a proposta C, «Papelaria» (o Renato escolheu-a a 16 nov 2026, entre a A «Pedra» e a B
   «Bordô»): papel claro, bordô, cabeças ao centro com uma palavra manuscrita; a página inicial tem a capa
   com três fotografias, o índice numerado das categorias, uma peça em destaque, as celebrações, os
   passos e o fecho. Uma fotografia aparece uma só vez em cada página (escolha automática).
6. **Domínio**: ainda nenhum. A pré-visualização é no GitHub Pages (`/becreative`), noindex; o domínio e
   a Cloudflare (Worker do `worker/www.js`) ficam para quando os donos aceitarem.

## 1. O que falta pedir aos donos (só o que a lei pede e só eles sabem)

- O nome (ou a firma) e o NIF de quem vende.
- A morada do atelier, com o código postal.
- A conta no Livro de Reclamações Eletrónico.

Com isto, `--producao` constrói (sem isto, pára: as regras exigem o nome e o NIF no domínio aberto).

## 2. Para pôr no ar

1. Repositório `renatovalente5/becreative` (público, como os outros) com o GitHub Pages por Actions
   (`pre-visualizacao.yml`) → https://renatovalente5.github.io/becreative/
2. O painel (`~/Websites/becreative-painel`): GitHub App, email de entrada, segredo, Worker — quando
   houver domínio (backoffice.<domínio>).
3. No dia do domínio: zona na Cloudflare, Worker do site com os dois Custom Domains, `--producao`, Search
   Console e Bing (enviar o sitemap e pedir a indexação da página inicial, das criações e das celebrações).

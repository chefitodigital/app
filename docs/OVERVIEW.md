# Chefito — Documentação Completa de Funcionalidades

> Plataforma digital de gestão de pedidos e cardápio para restaurantes. Tudo o que o seu negócio precisa, do cardápio ao pagamento.

---

## Sumário

- [O que é o Chefito](#o-que-é-o-chefito)
- [Diferenciais da Plataforma](#diferenciais-da-plataforma)
- [Para o Cliente](#para-o-cliente)
  - [Cardápio Digital](#cardápio-digital)
  - [Carrinho e Pedido](#carrinho-e-pedido)
  - [Tipos de Pedido](#tipos-de-pedido)
  - [Formas de Pagamento](#formas-de-pagamento)
  - [Cupons de Desconto](#cupons-de-desconto)
  - [Perfil e Histórico](#perfil-e-histórico)
- [Para o Restaurante](#para-o-restaurante)
  - [Gestão de Pedidos em Tempo Real](#gestão-de-pedidos-em-tempo-real)
  - [Arquivo e Histórico de Pedidos](#arquivo-e-histórico-de-pedidos)
  - [Gestão do Cardápio](#gestão-do-cardápio)
  - [Gestão de Clientes](#gestão-de-clientes)
  - [Gestão de Funcionários](#gestão-de-funcionários)
  - [Configurações do Restaurante](#configurações-do-restaurante)
  - [Analytics e Estatísticas](#analytics-e-estatísticas)
- [Fluxos Completos](#fluxos-completos)
  - [Fluxo do Cliente — Do Cardápio ao Pedido](#fluxo-do-cliente--do-cardápio-ao-pedido)
  - [Fluxo de Entrega com Cálculo de Taxa](#fluxo-de-entrega-com-cálculo-de-taxa)
  - [Fluxo de Pagamento em Dinheiro](#fluxo-de-pagamento-em-dinheiro)
  - [Fluxo de Pagamento MB Way](#fluxo-de-pagamento-mb-way)
  - [Fluxo de Cupom de Desconto](#fluxo-de-cupom-de-desconto)
  - [Fluxo do Administrador — Gestão Diária](#fluxo-do-administrador--gestão-diária)
  - [Fluxo de Mesclagem de Clientes Duplicados](#fluxo-de-mesclagem-de-clientes-duplicados)
- [Integrações](#integrações)
- [FAQ — Perguntas Frequentes](#faq--perguntas-frequentes)

---

## O que é o Chefito

O Chefito é uma plataforma completa de gestão de pedidos e cardápio digital para restaurantes. Funciona como um aplicativo web progressivo (PWA), o que significa que pode ser instalado diretamente no telemóvel ou computador do cliente — sem necessidade de loja de aplicações.

Cada restaurante tem o seu próprio ambiente independente, com base de dados, configurações, identidade visual e cardápio personalizados. A plataforma é totalmente em português e pensada para o contexto português e brasileiro.

**Para o cliente**, o Chefito é a forma mais simples de consultar o cardápio, escolher produtos, personalizar o pedido e finalizar a compra — seja para entrega em casa, retirada ou consumo na mesa.

**Para o restaurante**, o Chefito é o centro de comando: receber pedidos em tempo real, gerir o cardápio, conhecer os clientes, controlar a equipa e analisar o desempenho.

---

## Diferenciais da Plataforma

| Diferencial | Descrição |
|---|---|
| PWA instalável | O cliente instala como app, sem loja de aplicações |
| Identidade visual própria | Cores, fontes, logótipo e ícone personalizáveis por restaurante |
| Pedidos em tempo real | O restaurante recebe notificações sonoras, visuais e no browser |
| Integração WhatsApp | Envio automático do pedido via WhatsApp para o restaurante |
| MB Way nativo | Suporte a pagamento por MB Way com referência automática |
| Histórico de clientes | Perfil completo com endereços, total gasto e histórico de pedidos |
| Cupons flexíveis | Desconto percentual, valor fixo ou produto grátis |
| Taxa de entrega dinâmica | Cálculo automático por distância com mapa integrado |
| Stories promocionais | Imagens em destaque estilo stories do Instagram |
| Multi-restaurante | Cada restaurante é independente com os seus dados isolados |

---

## Para o Cliente

### Cardápio Digital

O cardápio é a porta de entrada da experiência. O cliente acede ao link do restaurante e encontra:

- **Categorias organizadas**: os produtos são agrupados em categorias definidas pelo restaurante, com navegação por âncoras
- **Produtos com imagem**: cada produto pode ter foto, nome, descrição e preço
- **Extras e personalizações**: o cliente pode selecionar adicionais para cada produto (ex: molhos, tamanhos, ingredientes extras) com preços discriminados
- **Tags visuais**: cada produto pode ter etiquetas como "Novo", "Destaque", "Picante", "Vegetariano", entre outras configuradas pelo restaurante
- **Stories promocionais**: se ativado pelo restaurante, uma sequência de até 3 imagens promocionais é exibida ao abrir o cardápio — semelhante aos stories do Instagram
- **Modal de produto**: ao clicar num produto, abre um painel com todos os detalhes, foto ampliada e seleção de extras

### Carrinho e Pedido

- Adicionar e remover produtos com controlo de quantidade
- Cada item pode ter extras associados individualmente
- O carrinho persiste entre sessões — o cliente não perde o que escolheu ao fechar o browser
- Resumo com subtotal, descontos aplicados, taxa de entrega e total final
- Campo para notas de pedido (ex: alergias, preferências)

### Tipos de Pedido

O Chefito suporta três modalidades de pedido, configuráveis pelo restaurante:

**1. Entrega em Casa**
- O cliente insere o endereço de entrega
- Pode utilizar o mapa integrado para confirmar a localização com precisão
- A taxa de entrega é calculada automaticamente com base na distância até ao restaurante
- Endereços anteriores ficam guardados para uso futuro

**2. Retirada / Takeaway**
- O cliente indica o horário pretendido para retirar o pedido
- Sem taxa de entrega
- Ideal para quem passa pelo restaurante

**3. Serviço na Mesa**
- O cliente indica o número da mesa
- O pedido chega diretamente ao restaurante associado à mesa
- Sem necessidade de endereço ou deslocação

### Formas de Pagamento

**Dinheiro**
- Pagamento presencial no momento da entrega ou retirada
- O administrador marca manualmente o pagamento como recebido

**MB Way**
- Disponível quando ativado pelo restaurante
- Uma referência única é gerada automaticamente para o pedido (ex: `REST-00001`)
- O cliente efetua o pagamento com a referência indicada
- O administrador confirma e marca o pagamento como pago

### Cupons de Desconto

O sistema de cupons oferece três tipos de benefícios:

| Tipo | Descrição | Exemplo |
|---|---|---|
| Percentagem | Desconto em % sobre o total | "20% de desconto" |
| Valor fixo | Desconto de valor exato | "5€ de desconto" |
| Produto grátis | Um produto específico sem custo | "Sobremesa grátis" |

Funcionalidades do sistema de cupons:
- O cliente introduz o código no carrinho e o desconto é aplicado imediatamente
- O sistema valida se o cupom está ativo, se o limite de utilizações não foi atingido e se o valor mínimo de encomenda foi cumprido
- O valor do desconto é discriminado no resumo do pedido
- Cada cupom pode ter um número máximo de utilizações e um valor mínimo de pedido

### Perfil e Histórico

Os clientes podem criar conta para aceder a:

- **Histórico completo de pedidos**: todos os pedidos realizados no restaurante
- **Endereços guardados**: múltiplos endereços com localização no mapa
- **Gestão de perfil**: nome, telemóvel, email, data de nascimento
- **Total gasto**: valor acumulado de todas as encomendas no restaurante
- **Pré-preenchimento automático**: nos próximos pedidos, os dados do cliente são preenchidos automaticamente

---

## Para o Restaurante

### Gestão de Pedidos em Tempo Real

O painel de pedidos é o coração operacional do Chefito. Assim que um novo pedido chega:

**Sistema de notificações multicamada:**
- Alerta sonoro (com controlo de volume e botão de teste)
- Notificação visual na barra do browser (título da aba pisca)
- Notificação push no browser (mesmo com o ecrã bloqueado)
- Vibração no dispositivo móvel
- Ícone animado com contagem de pedidos por ver
- Lista de pedidos não vistos no sino de notificações

**Gestão de cada pedido:**
- Ver todos os detalhes: cliente, produtos, extras, tipo de pedido, endereço ou mesa
- Aceitar o pedido (muda de "Pendente" para "Aceite")
- Marcar como entregue/concluído
- Cancelar o pedido
- Marcar pagamento como recebido
- Identificar se é o primeiro pedido do cliente (distintivo "Primeiro Pedido")
- Contactar o cliente via WhatsApp diretamente do pedido

**Informações por pedido:**
- Número sequencial do pedido
- Nome, telemóvel e email do cliente
- Tipo (entrega, mesa, takeaway)
- Endereço com coordenadas ou número de mesa
- Produtos com extras e quantidades
- Subtotal, desconto de cupom, taxa de entrega e total
- Forma de pagamento e estado (pendente/pago)
- Referência MB Way (quando aplicável)
- Horário de criação, aceitação e entrega

### Arquivo e Histórico de Pedidos

- Acesso ao historial completo de pedidos concluídos e cancelados
- Filtros por data
- Cálculo do tempo decorrido entre aceitação e entrega
- Todos os detalhes do pedido preservados

### Gestão do Cardápio

**Produtos:**
- Criar, editar e eliminar produtos
- Carregar imagem do produto
- Definir nome, descrição e preço
- Ativar ou desativar produtos sem os eliminar
- Reordenar produtos por arrastar e soltar (drag-and-drop)
- Associar a uma categoria
- Selecionar quais os extras disponíveis para o produto
- Aplicar tags (etiquetas visuais)

**Categorias:**
- Criar, editar e eliminar categorias
- Reordenar categorias por arrastar e soltar
- Ver quantos produtos existem em cada categoria

**Extras:**
- Criar extras com nome e preço (ex: "Molho extra — 0,50€")
- Associar extras a múltiplos produtos
- Gerir preços individualmente

**Tags:**
- Tags pré-definidas com ícones (Novo, Picante, Vegetariano, Destaque, etc.)
- Personalizáveis por restaurante
- Texto personalizado por produto

### Gestão de Clientes

**Base de clientes centralizada:**
- Lista de todos os clientes com ordenação por nome ou total gasto
- Perfil completo: nome, telemóvel, email, data de nascimento
- Todos os endereços de entrega utilizados
- Total gasto no restaurante
- Nomes alternativos (variações de nome usadas em pedidos diferentes)

**Deteção e eliminação de duplicados:**
- O sistema identifica automaticamente possíveis clientes duplicados (por telemóvel ou email)
- Interface de mesclagem manual: o administrador escolhe qual perfil manter
- Consolidação de endereços, nomes alternativos e histórico de pedidos
- Marcação de registos suspeitos para revisão

### Gestão de Funcionários

**Fichas de funcionário:**
- Nome, telemóvel, email e função
- Fotografia
- Data de início
- Valor hora
- Estado ativo/inativo
- Notas internas

**Escalas semanais:**
- Definir o horário de cada dia da semana (hora de entrada e saída)
- Marcar dias de folga
- Cálculo automático de horas semanais
- Destaque do horário de hoje no cartão do funcionário
- Filtrar por funcionários ativos, inativos ou todos

### Configurações do Restaurante

**Secção Geral:**
- Nome do restaurante
- Descrição e localização
- Texto e imagem "Sobre nós"
- Horário de funcionamento
- Moeda (EUR ou BRL)

**Secção de Aparência:**
- Cor de destaque (accent color) personalizada
- Seleção de tipos de letra para títulos, corpo e botões
- Ícone do restaurante
- Logótipo
- Favicon

**Secção de Entrega:**
- Ativar/desativar entrega ao domicílio
- Taxa base de entrega
- Valor por quilómetro
- Coordenadas do restaurante para cálculo de distância

**Secção de Pagamentos:**
- Ativar/desativar MB Way
- Número de telemóvel MB Way
- Prefixo das referências (ex: "REST")

**Secção de Cupons:**
- Criar e editar cupons
- Ver estatísticas de utilização por cupom
- Definir tipo, valor, limite de usos e valor mínimo de pedido

**Secção de Mensagens:**
- Personalizar a mensagem de confirmação de pedido exibida ao cliente
- Ativar/desativar envio automático via WhatsApp

**Secção de Stories:**
- Ativar/desativar stories promocionais
- Escolher se abrem automaticamente ao entrar no cardápio
- Carregar até 3 imagens
- Selecionar formato (vertical, retrato ou quadrado)

**Secção de Contacto:**
- Número WhatsApp do restaurante
- Redes sociais

### Analytics e Estatísticas

**Estatísticas de Produtos:**
- Ranking dos produtos mais pedidos
- Quantidade total de unidades vendidas por produto
- Barra de progresso visual mostrando a popularidade relativa
- Top 3 destacado com cor de destaque
- Filtro por período de datas

**Estatísticas de Cupons:**
- Número total de utilizações por cupom
- Utilizações restantes até ao limite
- Percentagem de utilização do cupom

**Estatísticas de Stories:**
- Total de visualizações das imagens promocionais
- Visualizações únicas (por sessão)
- Evolução por data
- Dados dos últimos 7 e 30 dias

**Estatísticas de Produtos em Modal:**
- Quais os produtos mais vistos pelos clientes
- Total de aberturas do modal de detalhe
- Dados por data e período

---

## Fluxos Completos

### Fluxo do Cliente — Do Cardápio ao Pedido

```
1. Cliente acede ao link do restaurante no browser ou app instalada
2. Vê as stories promocionais (se ativas pelo restaurante)
3. Navega pelas categorias do cardápio
4. Clica num produto → abre o modal de detalhe
5. Seleciona os extras pretendidos
6. Adiciona ao carrinho
7. Repete para outros produtos
8. Abre o carrinho
9. Introduz um cupom de desconto (opcional)
10. Seleciona o tipo de pedido:
    → Entrega: insere endereço (pode usar mapa) e vê a taxa calculada
    → Mesa: insere o número da mesa
    → Takeaway: insere o horário de retirada
11. Preenche os dados pessoais (ou são pré-preenchidos se cliente recorrente)
12. Adiciona notas ao pedido (opcional)
13. Seleciona a forma de pagamento (Dinheiro ou MB Way)
14. Revê o resumo final: produtos, descontos, taxa de entrega, total
15. Confirma o pedido
16. Vê a mensagem de confirmação personalizada pelo restaurante
17. Opção de enviar o pedido ao restaurante via WhatsApp
```

### Fluxo de Entrega com Cálculo de Taxa

```
1. Cliente seleciona "Entrega em Casa"
2. Insere o endereço de entrega (ou seleciona dos endereços guardados)
3. Opcional: confirma a localização no mapa integrado (OpenStreetMap)
4. O sistema obtém as coordenadas do endereço inserido
5. Calcula a distância em linha reta até ao restaurante (fórmula de Haversine)
6. Aplica: Taxa Base + (Distância em km × Valor por km)
7. Taxa de entrega exibida no resumo do carrinho
8. Taxa incluída no total do pedido
```

### Fluxo de Pagamento em Dinheiro

```
1. Cliente seleciona "Dinheiro" na forma de pagamento
2. Pedido é guardado com payment_method = 'cash' e payment_status = 'pending'
3. O restaurante recebe o pedido
4. No momento da entrega, o pagamento é efetuado em mãos
5. O administrador abre o pedido no painel e altera o estado para "Pago"
6. Registo atualizado na base de dados
```

### Fluxo de Pagamento MB Way

```
1. Administrador ativa o MB Way nas Configurações e define:
   → Número de telemóvel MB Way do restaurante
   → Prefixo das referências (ex: "REST")
2. Cliente seleciona "MB Way" na forma de pagamento
3. O sistema gera automaticamente uma referência única:
   → Formato: {Prefixo}-{Número sequencial com 5 dígitos}
   → Exemplo: REST-00042
4. Pedido guardado com payment_method = 'mbway', payment_status = 'pending'
5. A referência MB Way é exibida no detalhe do pedido no painel do admin
6. Cliente efetua o pagamento via MB Way com a referência indicada
7. Administrador confirma a receção do pagamento
8. Altera o estado do pagamento para "Pago" no pedido
```

### Fluxo de Cupom de Desconto

**Criação pelo restaurante:**
```
1. Administrador acede a Configurações → Cupons
2. Cria novo cupom com:
   → Código único (ex: "VERÃO20")
   → Tipo: percentagem, valor fixo ou produto grátis
   → Valor do desconto
   → Limite máximo de utilizações (opcional)
   → Valor mínimo de encomenda (opcional)
3. Cupom fica ativo e disponível para os clientes
```

**Utilização pelo cliente:**
```
1. Cliente adiciona produtos ao carrinho
2. Insere o código do cupom no campo dedicado
3. O sistema valida:
   → Código existe e está ativo
   → Limite de utilizações não foi atingido
   → Valor mínimo de encomenda foi cumprido (se definido)
4. Se válido: desconto aplicado e exibido no resumo
5. O código do cupom fica associado ao pedido
6. O contador de utilizações do cupom é incrementado
```

### Fluxo do Administrador — Gestão Diária

```
1. Administrador faz login com email e password
2. Acede ao painel de pedidos (/orders)
3. Recebe notificação sonora e visual de novos pedidos
4. Para cada novo pedido:
   → Revê os detalhes (produtos, cliente, endereço, pagamento)
   → Aceita o pedido → estado muda para "Aceite"
   → Prepara e entrega o pedido
   → Marca como "Entregue"
   → Confirma pagamento se recebido em dinheiro
5. Pedidos concluídos movem-se para o arquivo
6. Durante o dia, pode aceder a:
   → Produtos: ajustar o cardápio, preços, disponibilidade
   → Clientes: ver novos clientes, consultar histórico
   → Funcionários: verificar escalas do dia
   → Configurações: atualizar informações ou promoções
   → Estatísticas: ver o desempenho dos produtos
```

### Fluxo de Mesclagem de Clientes Duplicados

```
1. O sistema deteta automaticamente possíveis duplicados
   (mesmo telemóvel ou email em registos diferentes)
2. Administrador acede a Clientes
3. Identifica os registos marcados para revisão
4. Abre a interface de mesclagem lado a lado
5. Escolhe qual o registo principal a manter
6. O sistema consolida:
   → Todos os endereços de entrega de ambos os registos
   → Nomes alternativos utilizados
   → Histórico de pedidos de ambos os perfis
7. Registo duplicado é eliminado
8. Histórico e dados ficam unificados no perfil principal
```

---

## Integrações

**WhatsApp**
- Envio automático do resumo do pedido para o restaurante via link `wa.me`
- Botão de contacto direto com o cliente a partir do painel de pedidos
- Mensagem formatada com todos os detalhes do pedido

**OpenStreetMap / Nominatim**
- Geocodificação inversa: converte coordenadas em endereço legível
- Mapa interativo para o cliente confirmar a localização de entrega
- Visualização do pin no mapa

**Supabase Realtime**
- Canal dedicado para novos pedidos (`orders-notifications`)
- Atualizações instantâneas sem necessidade de atualizar a página
- Suporte a inserção e atualização de registos em tempo real

**Vercel Analytics**
- Métricas de desempenho e velocidade da plataforma
- Integrado de forma transparente na aplicação

---

## FAQ — Perguntas Frequentes

### Para Clientes

**1. Preciso de criar uma conta para fazer um pedido?**
Não. É possível fazer pedidos como convidado, preenchendo apenas os dados necessários para a entrega (nome, telemóvel, email e endereço). No entanto, criar uma conta traz vantagens: os seus dados ficam guardados, pode ver o histórico de pedidos e os endereços de entrega são automaticamente preenchidos nas próximas compras.

---

**2. Como funciona o cálculo da taxa de entrega?**
A taxa de entrega é calculada automaticamente com base na distância entre o restaurante e o seu endereço. O restaurante define uma taxa base e um valor por quilómetro. Ao inserir o seu endereço, o sistema calcula a distância em linha reta e apresenta o valor final antes de confirmar o pedido. Não há surpresas na hora de pagar.

---

**3. Como posso pagar com MB Way?**
Se o restaurante tiver o MB Way ativado, a opção aparece automaticamente no checkout. Ao selecionar MB Way, é gerada uma referência única para o seu pedido. Após confirmar o pedido, efetua o pagamento com essa referência através da sua aplicação MB Way. O restaurante confirma a receção e o seu pedido avança.

---

**4. Os meus cupons de desconto têm prazo de validade?**
Os cupons são geridos pelo restaurante, que pode definir um número máximo de utilizações total. Quando esse limite é atingido, o cupom deixa de ser aceite. Alguns cupons também podem exigir um valor mínimo de encomenda. Ao inserir um código inválido ou expirado, é informado imediatamente.

---

**5. Posso guardar vários endereços de entrega?**
Sim. Com uma conta criada, pode guardar múltiplos endereços de entrega, como casa, escritório ou qualquer outro local. Pode confirmá-los no mapa integrado para garantir a precisão. Nos pedidos seguintes, basta selecionar o endereço pretendido sem ter de o voltar a escrever.

---

**6. O Chefito funciona como uma aplicação no meu telemóvel?**
Sim. O Chefito é um PWA (Progressive Web App), o que significa que pode instalar o cardápio do restaurante diretamente no ecrã inicial do seu telemóvel, tal como uma aplicação normal — sem precisar de ir à App Store ou Google Play. A instalação é sugerida automaticamente pelo browser.

---

### Para Restaurantes

**7. Como recebo notificações de novos pedidos?**
Assim que um pedido é feito, recebe uma notificação em várias camadas simultâneas: alerta sonoro, notificação push no browser (mesmo que o computador esteja em segundo plano), animação visual no painel e a aba do browser pisca para chamar a atenção. No telemóvel, o dispositivo também vibra. Pode personalizar o som e testar as notificações a qualquer momento.

---

**8. Posso personalizar a aparência do cardápio com a minha marca?**
Totalmente. Nas configurações, pode definir a cor de destaque, os tipos de letra para títulos, textos e botões, o logótipo, o ícone e o favicon. O cardápio digital fica com a identidade visual do seu restaurante, criando uma experiência consistente para os seus clientes.

---

**9. Como funciona o sistema de cupons no Chefito?**
Cria os cupons nas configurações, definindo o código, o tipo de desconto (percentagem, valor fixo ou produto grátis), o valor, o limite de utilizações e, se necessário, um valor mínimo de encomenda. Os clientes inserem o código no carrinho e o desconto é aplicado automaticamente. Pode acompanhar quantas vezes cada cupom foi utilizado no painel de estatísticas.

---

**10. Como o Chefito ajuda a conhecer melhor os meus clientes?**
O Chefito mantém um perfil completo de cada cliente: todos os pedidos realizados, total gasto, endereços utilizados, data de nascimento e contactos. Consegue identificar os seus clientes mais fiéis pelo total gasto, reconhecer clientes novos com um distintivo especial no pedido e contactá-los diretamente via WhatsApp. O sistema também deteta automaticamente registos duplicados e permite mesclá-los para manter a base de dados limpa.

---

**11. Posso gerir os turnos e horários da minha equipa no Chefito?**
Sim. Na secção de Funcionários, cria as fichas de cada membro da equipa com foto, função, contacto e valor hora. Para cada funcionário, define a escala semanal com os horários de entrada e saída para cada dia, ou marca dias de folga. O sistema calcula automaticamente as horas semanais de cada elemento e destaca o horário do dia atual em cada ficha.

---

**12. O Chefito funciona para restaurantes em Portugal e no Brasil?**
Sim. A plataforma suporta as duas moedas (Euro e Real Brasileiro), inclui integração com MB Way para o mercado português e está totalmente localizada em português. O sistema de pagamento e as funcionalidades de entrega adaptam-se às configurações definidas por cada restaurante. Cada restaurante tem o seu ambiente completamente independente e isolado.

---

*Chefito — A plataforma digital que coloca o restaurante no bolso dos seus clientes.*

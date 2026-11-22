# Chefito — Documentação e Guia de Uso

> Versão do documento: Maio 2026

---

## Índice

1. [O que é o Chefito?](#1-o-que-é-o-chefito)
2. [Para quem é o Chefito?](#2-para-quem-é-o-chefito)
3. [Como funciona?](#3-como-funciona)
4. [Guia do Cliente](#4-guia-do-cliente)
   - 4.1 [Navegar no Cardápio](#41-navegar-no-cardápio)
   - 4.2 [Ver um Produto em Detalhe](#42-ver-um-produto-em-detalhe)
   - 4.3 [Adicionar ao Carrinho](#43-adicionar-ao-carrinho)
   - 4.4 [Aplicar um Cupão de Desconto](#44-aplicar-um-cupão-de-desconto)
   - 4.5 [Fazer um Pedido](#45-fazer-um-pedido)
   - 4.6 [Métodos de Pagamento](#46-métodos-de-pagamento)
   - 4.7 [Criar Conta e Perfil](#47-criar-conta-e-perfil)
   - 4.8 [Histórico de Pedidos](#48-histórico-de-pedidos)
   - 4.9 [Stories Promocionais](#49-stories-promocionais)
   - 4.10 [Instalar como App (PWA)](#410-instalar-como-app-pwa)
5. [Guia do Administrador](#5-guia-do-administrador)
   - 5.1 [Painel de Pedidos](#51-painel-de-pedidos)
   - 5.2 [Gerir o Cardápio](#52-gerir-o-cardápio)
   - 5.3 [Gerir Clientes](#53-gerir-clientes)
   - 5.4 [Gerir Funcionários](#54-gerir-funcionários)
   - 5.5 [Configurações do Restaurante](#55-configurações-do-restaurante)
   - 5.6 [Estatísticas](#56-estatísticas)
   - 5.7 [Arquivo de Pedidos](#57-arquivo-de-pedidos)
6. [Configuração Inicial](#6-configuração-inicial)
7. [Perguntas Frequentes (FAQ)](#7-perguntas-frequentes-faq)
8. [Glossário](#8-glossário)

---

## 1. O que é o Chefito?

O **Chefito** é uma plataforma completa de cardápio digital e gestão de pedidos para restaurantes. Num único sistema, permite que os clientes consultem o menu, personalizem os seus pedidos e os enviem directamente para a cozinha — sem aplicações adicionais, sem chamadas telefónicas, sem papéis.

Do lado do restaurante, o Chefito substitui o registo manual de pedidos por um painel digital em tempo real: assim que um cliente submete o pedido, o administrador recebe uma notificação instantânea com todos os detalhes, pronto para aceitar e preparar.

### O que o Chefito inclui

| Funcionalidade | Descrição |
|---|---|
| Cardápio digital | Menu navegável por categorias, com fotos, descrições e extras |
| Gestão de pedidos | Painel em tempo real com notificações sonoras e push |
| Tipos de pedido | Entrega ao domicílio, retirada (takeaway) e serviço de mesa |
| Pagamentos | Dinheiro e MB Way com referências geradas automaticamente |
| Cupões de desconto | Percentagem, valor fixo ou produto grátis |
| Gestão de clientes | Base de dados completa com histórico e detecção de duplicados |
| Gestão de funcionários | Fichas pessoais e escalas semanais |
| Stories promocionais | Imagens promocionais com rastreamento de visualizações |
| Estatísticas | Produtos mais vendidos, uso de cupões, visualizações |
| Identidade visual | Cores, fontes, logótipo e favicon personalizáveis |
| PWA | Instalável como app no telemóvel sem passar pela App Store |

---

## 2. Para quem é o Chefito?

O Chefito foi desenhado para estabelecimentos de restauração que querem modernizar a experiência do cliente e simplificar a operação interna. Funciona bem para:

**Restaurantes de pequena e média dimensão** que recebem pedidos por telefone ou WhatsApp e querem substituir esse processo por algo mais organizado e menos propenso a erros.

**Cafés e pastelarias** que servem ao balcão mas querem oferecer um QR code na mesa para que o cliente possa consultar o menu e fazer o pedido sem esperar por um empregado.

**Pizzarias e restaurantes de entrega** que precisam de calcular automaticamente a taxa de entrega com base na distância, gerir referências de pagamento MB Way e acompanhar o estado de cada pedido.

**Food trucks e pop-ups** que precisam de um menu digital simples, sem infraestrutura fixa, acessível por link ou QR code.

**Restaurantes com serviço de mesa** que querem que os clientes peçam directamente do telemóvel, indicando o número da mesa.

### O que o Chefito não é

O Chefito não é um marketplace (como Uber Eats ou Glovo) — é um sistema próprio do restaurante. Cada restaurante tem o seu próprio cardápio, os seus próprios clientes e o seu próprio painel de gestão. Não há comissões por pedido nem dependência de plataformas externas.

---

## 3. Como funciona?

O fluxo principal do Chefito tem três participantes: o **cliente**, o **restaurante** e o **sistema**.

### Do lado do cliente

```
1. Cliente acede ao link do cardápio (ou lê QR code)
2. Navega por categorias e produtos
3. Selecciona extras e adiciona ao carrinho
4. Aplica cupão de desconto (se tiver)
5. Preenche dados e escolhe tipo de pedido
6. Selecciona método de pagamento
7. Confirma o pedido
8. Recebe mensagem de confirmação
```

### Do lado do restaurante

```
1. Notificação instantânea chega ao painel (som + visual + push)
2. Administrador revê os detalhes do pedido
3. Clica "Aceitar Pedido" — cronómetro inicia
4. Prepara o pedido
5. Clica "Marcar como Enviado" quando estiver pronto
6. Pode contactar o cliente via WhatsApp a qualquer momento
```

### Tipos de pedido suportados

| Tipo | Como funciona |
|---|---|
| **Entrega** | Cliente indica morada e confirma localização no mapa; sistema calcula taxa de entrega |
| **Takeaway** | Cliente indica hora de retirada; sem taxa de entrega |
| **Mesa** | Cliente indica número de mesa; sem taxa de entrega |

---

## 4. Guia do Cliente

### 4.1 Navegar no Cardápio

Ao aceder ao cardápio, o cliente vê uma lista de categorias no topo (por exemplo: Entradas, Pratos Principais, Sobremesas, Bebidas). Ao clicar numa categoria, a página faz scroll automático até aos produtos dessa categoria.

Cada categoria mostra a quantidade de produtos activos que contém. Os produtos aparecem em cartões com:

- Fotografia do produto (se existir)
- Nome e descrição (resumida a duas linhas)
- Preço
- Etiquetas (ex: "Novo", "Picante", "Vegetariano", "Destaque")

O layout adapta-se automaticamente ao tamanho do ecrã — num telemóvel, os produtos aparecem em coluna única ou dupla; num computador, podem aparecer em três colunas.

### 4.2 Ver um Produto em Detalhe

Ao clicar num produto, abre-se um modal com:

- Imagem ampliada
- Nome e descrição completa (com parágrafos)
- Tags do produto
- Lista de extras disponíveis com preço individual
- Controlos de quantidade para cada extra (+ e -)
- Preço total actualizado em tempo real
- Botão "Partilhar" (copia o link directo do produto)

**Exemplo de extras:** num prato de hambúrguer, os extras podem ser "Queijo Extra (+0,50€)", "Bacon (+1,00€)", "Molho Especial (+0,30€)". O cliente selecciona os que quer e o sistema calcula o total automaticamente.

### 4.3 Adicionar ao Carrinho

Após configurar o produto (com ou sem extras), o cliente clica em "Adicionar ao Cesto". Um botão flutuante aparece no canto do ecrã a mostrar a contagem de itens e o total acumulado.

O conteúdo do carrinho é guardado automaticamente no navegador — se o cliente fechar o ecrã e voltar mais tarde, os produtos continuam no cesto.

Para rever o carrinho, clica no botão flutuante. No carrinho pode:

- Ver todos os itens com quantidade e preço
- Alterar quantidades ou remover itens
- Ver o resumo: subtotal, desconto, taxa de entrega e total final
- Aplicar ou remover um cupão de desconto

### 4.4 Aplicar um Cupão de Desconto

No carrinho, existe um campo para introduzir um código de cupão. Depois de escrever o código e clicar em "Aplicar":

- Se o código for válido: o desconto é aplicado imediatamente e o total é actualizado
- Se o código estiver inválido, expirado ou abaixo do valor mínimo: aparece uma mensagem de erro explicativa

**Tipos de desconto possíveis:**

| Tipo | Exemplo |
|---|---|
| Percentagem | "BEMVINDO" → 20% de desconto |
| Valor fixo | "FIDELIDADE5" → 5€ de desconto |
| Produto grátis | "BRINDE" → adiciona um produto sem custo |

Para remover um cupão já aplicado, clica no botão "X" ao lado do código.

### 4.5 Fazer um Pedido

Depois de confirmar o carrinho, o cliente clica em "Prosseguir para Checkout". O processo tem três passos:

**Passo 1 — Dados pessoais**

| Campo | Obrigatório |
|---|---|
| Nome | Sim |
| Telefone | Sim |
| Email | Sim |
| Data de nascimento | Não |

Se o cliente já tiver conta, estes dados são preenchidos automaticamente.

**Passo 2 — Tipo de pedido**

Dependendo das opções activadas pelo restaurante, o cliente escolhe entre:

**Entrega ao domicílio:**
1. Escreve o endereço ou selecciona um endereço guardado
2. Um mapa abre-se para confirmar a localização exacta
3. Arrasta o pino para o local correcto (útil para apartamentos ou entradas secundárias)
4. O sistema calcula a taxa de entrega automaticamente com base na distância

**Retirada (Takeaway):**
1. Indica a hora a que vai buscar o pedido
2. Sem taxa de entrega

**Serviço de mesa:**
1. Indica o número da mesa
2. Sem taxa de entrega

**Passo 3 — Notas e confirmação**

O cliente pode adicionar notas ao pedido (ex: "Sem cebola", "Alergia a amendoins", "Toque a campainha 2 vezes"). Depois confirma o pedido.

Após confirmação, aparece uma mensagem personalizada pelo restaurante. É também apresentada a opção de enviar o resumo do pedido via WhatsApp.

### 4.6 Métodos de Pagamento

**Dinheiro**

O cliente paga na entrega ou no momento de levantar o pedido. Sempre disponível.

**MB Way**

Se o restaurante tiver o MB Way activado, o cliente pode escolher esta opção. Após submeter o pedido, é gerada automaticamente uma referência única no formato `{Prefixo}-{Número}`, por exemplo `REST-00042`.

O cliente usa essa referência na aplicação MB Way para efectuar o pagamento. O restaurante confirma a recepção e marca o pagamento como recebido no painel.

### 4.7 Criar Conta e Perfil

O Chefito suporta contas de cliente opcionais. Com uma conta, o cliente beneficia de:

- Dados pessoais preenchidos automaticamente no checkout
- Múltiplos endereços de entrega guardados (com localização GPS)
- Histórico completo de todos os pedidos
- Acesso ao perfil a partir de qualquer dispositivo

**Para criar conta:** no momento do checkout, se for o primeiro pedido, é apresentada a opção de criar conta com email e password.

**Para fazer login:** no cardápio existe um botão de acesso à conta. Após login, todos os dados ficam disponíveis.

No perfil, o cliente pode:

- Editar nome, telefone e data de nascimento
- Adicionar ou remover endereços de entrega (com mapa para confirmar coordenadas)
- Consultar o histórico de pedidos com todos os detalhes

### 4.8 Histórico de Pedidos

Na página de perfil, o cliente vê todos os seus pedidos anteriores e actuais. Para cada pedido são mostrados:

- Data e hora
- Estado actual (Pendente, Em Preparação, Entregue)
- Lista de produtos pedidos
- Desconto aplicado (se houver)
- Total pago

Os estados do pedido actualizam-se em tempo real — quando o restaurante aceita ou entrega o pedido, o cliente vê isso imediatamente sem precisar de recarregar a página.

### 4.9 Stories Promocionais

O restaurante pode activar Stories — imagens promocionais que aparecem ao visitar o cardápio. Funcionam de forma semelhante aos stories das redes sociais.

Se as Stories estiverem configuradas para abrir automaticamente, aparecem assim que o cliente entra no cardápio (apenas uma vez por sessão). Em visitas seguintes, pode aceder manualmente clicando no ícone de megafone.

As Stories suportam até 3 imagens em sequência, em formato vertical, portrait ou square.

### 4.10 Instalar como App (PWA)

O Chefito é uma Progressive Web App (PWA), o que significa que pode ser instalado directamente no telemóvel como se fosse uma aplicação nativa — sem passar pela App Store ou Google Play.

**Como instalar:**

1. Abra o cardápio no browser do telemóvel
2. Aparece automaticamente uma sugestão para instalar
3. Confirme a instalação
4. O ícone do restaurante aparece no ecrã inicial do telemóvel

Após instalação, o Chefito abre sem barra de endereços e com experiência de app completa.

---

## 5. Guia do Administrador

O painel de administração está acessível através do login com as credenciais de super administrador. Após autenticação, o painel apresenta a navegação principal: **Pedidos, Produtos, Clientes, Funcionários, Configurações e Arquivo**.

### 5.1 Painel de Pedidos

O painel de pedidos é o centro de operações do restaurante. Divide-se em duas secções:

- **Pendentes**: pedidos que ainda não foram aceites
- **Em Preparação**: pedidos aceites, em produção

#### Notificações em Tempo Real

Quando um novo pedido chega, o sistema activa simultaneamente:

- Alerta sonoro (com botão de teste e controlo de volume)
- Notificação push no browser (funciona mesmo com o ecrã bloqueado)
- Vibração no dispositivo móvel
- Animação visual no ícone do sino (shake)
- Badge com contagem de pedidos não visualizados

O sino de notificações no topo da página mostra um dropdown com a lista de pedidos recentes não visualizados.

#### Informações de Cada Pedido

Para cada pedido, o painel mostra:

- Número sequencial do pedido (ex: #42)
- Tipo de pedido com ícone (entrega, mesa, takeaway)
- Nome, telefone e email do cliente
- Distintivo "Primeiro Pedido" se for a primeira vez que este cliente encomenda
- Endereço de entrega / número de mesa / hora de retirada
- Lista completa de produtos com extras e quantidades
- Subtotal, desconto (com código do cupão), taxa de entrega e total
- Método de pagamento e estado (Pendente / Pago)
- Referência MB Way (se aplicável)
- Notas do cliente
- Tempo decorrido desde a aceitação (cronómetro em tempo real)

#### Acções sobre Pedidos

**Pedidos pendentes:**
- **Aceitar Pedido**: muda o estado para "Em Preparação" e inicia o cronómetro
- **Cancelar**: cancela o pedido

**Pedidos em preparação:**
- **Marcar como Enviado**: conclui o pedido e move-o para o arquivo
- **Cancelar**: cancela o pedido mesmo após aceitação

**Em qualquer estado:**
- **Marcar Pagamento**: alterna o estado de pagamento entre "Pendente" e "Pago" (especialmente útil para MB Way)
- **Contactar via WhatsApp**: abre uma conversa WhatsApp com o cliente, com o resumo do pedido pré-formatado

### 5.2 Gerir o Cardápio

A gestão do cardápio está dividida em quatro secções: Categorias, Produtos, Extras e Tags.

#### Categorias

As categorias organizam os produtos no cardápio. Cada categoria tem apenas um campo: o nome.

**Operações disponíveis:**
- Criar nova categoria
- Editar o nome de uma categoria existente
- Eliminar categoria (apenas se não tiver produtos associados)
- **Reordenar por drag-and-drop**: arraste a categoria para a posição desejada; a ordem é guardada automaticamente

A contagem de produtos activos aparece junto a cada categoria.

#### Produtos

Cada produto pertence a uma categoria e pode ter extras e tags associados.

**Campos de um produto:**

| Campo | Descrição |
|---|---|
| Nome | Nome que aparece no cardápio |
| Descrição | Texto completo (pode ter parágrafos) |
| Preço | Valor base sem extras |
| Imagem | Upload de foto ou URL externa |
| Categoria | Categoria a que pertence |
| Extras | Quais extras estão disponíveis para este produto |
| Tags | Etiquetas visuais (Novo, Picante, Vegetariano, etc.) |
| Tag personalizada | Texto livre para uma etiqueta única (ex: "Chef recomenda") |
| Activo/Inactivo | Toggle para ocultar temporariamente sem eliminar |

**Reordenação:** dentro de cada categoria, os produtos podem ser reordenados por drag-and-drop. A ordem definida aqui é a que o cliente vê no cardápio.

**Imagens:** o upload é feito directamente na plataforma. As imagens novas ficam guardadas no Cloudflare R2 através da edge function `r2-sign-upload`; o Supabase Storage legacy `chefito` deve ficar apenas para leitura de imagens antigas.

#### Extras

Os extras são opções adicionais que o cliente pode seleccionar ao adicionar um produto ao carrinho. Um extra tem apenas nome e preço.

**Exemplo:**
```
Extra: Queijo Extra    Preço: 0,50€
Extra: Bacon           Preço: 1,00€
Extra: Molho Picante   Preço: 0,00€
```

Um extra pode estar associado a múltiplos produtos. A associação faz-se na ficha de cada produto.

#### Tags

As tags são etiquetas visuais que aparecem nos cartões e no modal dos produtos. Servem para chamar a atenção do cliente para características especiais.

**Tags pré-definidas disponíveis:**
- Novo
- Picante
- Vegetariano
- Destaque
- (e outras configuradas pelo sistema)

Além das pré-definidas, cada produto pode ter uma **tag personalizada** com texto livre, configurada directamente na ficha do produto.

### 5.3 Gerir Clientes

O Chefito mantém uma base de dados de clientes que cresce automaticamente cada vez que um novo pedido é feito. Os clientes podem também ser criados manualmente pelo administrador.

#### Base de Dados de Clientes

Para cada cliente são guardados:

- Nome, telefone e email
- Data de nascimento (opcional)
- Todos os endereços utilizados
- Total acumulado gasto no restaurante
- Nomes alternativos detectados
- Notas internas (visíveis apenas para o admin)
- Data de criação do registo

**Pesquisa e ordenação:**
- Pesquisa por nome, telefone, email ou morada
- Ordenação alfabética ou por total gasto (clientes mais valiosos primeiro)

#### Detecção e Mesclagem de Duplicados

O Chefito detecta automaticamente quando o mesmo cliente pode ter registos duplicados — por exemplo, quando usa o mesmo telefone ou email com nomes ligeiramente diferentes.

Quando detecta um possível duplicado, marca o registo com "Necessita revisão". O administrador pode então:

1. Abrir a interface de mesclagem
2. Ver os dois registos lado a lado para comparação
3. Escolher qual o registo principal a manter
4. Confirmar a mesclagem

**O que acontece na mesclagem:**
- Todos os endereços de ambos os registos são consolidados
- Os nomes alternativos são preservados
- Todo o histórico de pedidos é transferido para o registo principal
- O registo secundário é eliminado

Esta funcionalidade é especialmente útil para restaurantes que recebem pedidos por vários canais (telefone, WhatsApp, online) e acumulam registos duplicados ao longo do tempo.

#### Nomes Alternativos

O sistema regista automaticamente quando um cliente usa nomes diferentes em pedidos distintos (ex: "João Silva", "J. Silva", "João"). O administrador pode resolver estas variações escolhendo o nome correcto a manter, sem perder o histórico associado a cada variação.

### 5.4 Gerir Funcionários

#### Ficha de Funcionário

Cada funcionário tem uma ficha com:

| Campo | Descrição |
|---|---|
| Nome | Nome completo |
| Cargo | Função (ex: Cozinheiro, Empregado de Mesa) |
| Telefone | Contacto directo |
| Email | Email profissional (opcional) |
| Fotografia | Upload de foto |
| Data de início | Data de contratação |
| Valor hora | Taxa horária para cálculo de custos |
| Activo/Inactivo | Estado actual |
| Notas | Informações internas |

**Filtros disponíveis:** ver todos, apenas activos, ou apenas inactivos. Pesquisa por nome, cargo ou telefone.

#### Escalas Semanais

Para cada funcionário, é possível definir o horário de trabalho por dia da semana. Para cada dia:

- Hora de início
- Hora de fim
- Marcar como dia de folga (checkbox)

O sistema calcula automaticamente o total de horas semanais. O horário do dia actual é destacado visualmente na ficha do funcionário.

**Exemplo de escala:**
```
Segunda:  09:00 — 17:00
Terça:    09:00 — 17:00
Quarta:   FOLGA
Quinta:   12:00 — 20:00
Sexta:    12:00 — 20:00
Sábado:   10:00 — 18:00
Domingo:  FOLGA
Total: 40 horas/semana
```

### 5.5 Configurações do Restaurante

As configurações estão organizadas em secções. Todas as alterações são guardadas imediatamente e aplicadas em tempo real no cardápio.

#### Secção Geral

- **Nome do restaurante**: aparece no cabeçalho e título da página
- **Sobre nós**: texto de apresentação (suporta parágrafos)
- **Imagem Sobre Nós**: fotografia para acompanhar o texto
- **Localização**: endereço físico do restaurante
- **Moeda**: EUR (Euro) ou BRL (Real Brasileiro)

#### Secção de Entrega

- **Activar entregas**: permite ou impede pedidos do tipo entrega
- **Taxa base**: valor fixo cobrado em todas as entregas (ex: 1,50€)
- **Valor por quilómetro**: valor adicional por cada km de distância (ex: 0,30€/km)
- **Coordenadas do restaurante**: latitude e longitude usadas para calcular a distância até ao cliente

**Fórmula de cálculo:**
```
Taxa de entrega = Taxa Base + (Distância em km × Valor por km)

Exemplo:
  Taxa Base: 1,50€
  Valor/km: 0,30€
  Distância: 3,5 km
  Taxa = 1,50 + (3,5 × 0,30) = 1,50 + 1,05 = 2,55€
```

A distância é calculada em linha recta usando a fórmula de Haversine, com base nas coordenadas do restaurante e na localização confirmada pelo cliente no mapa.

#### Secção de Pagamentos

**MB Way:**

| Campo | Descrição |
|---|---|
| Activar MB Way | Mostra a opção MB Way no checkout |
| Número de telefone | Número associado à conta MB Way do restaurante |
| Prefixo das referências | Código curto que identifica o restaurante (ex: "REST", "PIZZA") |

Com prefixo "REST", as referências geradas serão: REST-00001, REST-00002, REST-00003, etc.

#### Secção de Cupões de Desconto

Aqui o administrador pode criar e gerir todos os cupões. Para cada cupão:

| Campo | Descrição |
|---|---|
| Código | Código que o cliente introduz (ex: "BEMVINDO20") |
| Tipo | Percentagem, valor fixo ou produto grátis |
| Valor | Percentagem ou valor monetário do desconto |
| Produto grátis | Se tipo "produto grátis", qual o produto |
| Limite de usos | Número máximo de utilizações (deixar em branco para ilimitado) |
| Valor mínimo | Valor mínimo do pedido para o cupão ser válido |
| Activo/Inactivo | Toggle para activar ou desactivar o cupão |

As estatísticas de cada cupão (quantas vezes foi usado, usos restantes) estão visíveis directamente na lista.

#### Secção de Mensagens

**Mensagem de confirmação de pedido:** texto que aparece ao cliente após submeter um pedido. Personalize com informações relevantes (tempo estimado de entrega, contacto em caso de dúvida, etc.).

**Exemplo:**
```
Obrigado pelo seu pedido!

Recebemos o seu pedido e estamos a prepará-lo com todo o cuidado.
O tempo estimado de entrega é de 30 a 45 minutos.

Em caso de dúvida, contacte-nos pelo 912 345 678.
```

**WhatsApp automático:** se activado, ao submeter um pedido é automaticamente aberta uma janela WhatsApp com o resumo do pedido formatado, pronto para enviar para o número do restaurante.

#### Secção de Stories

As Stories são imagens promocionais que aparecem quando o cliente acede ao cardápio.

| Configuração | Descrição |
|---|---|
| Activar Stories | Liga/desliga a funcionalidade |
| Auto-abrir | Abre automaticamente ao entrar no cardápio (apenas 1 vez por sessão) |
| Formato | Vertical, Portrait ou Square |
| Imagens | Upload de até 3 imagens (ordenáveis por drag-and-drop) |

**Formatos disponíveis:**

| Formato | Proporção | Uso típico |
|---|---|---|
| Vertical | 9:16 | Stories do Instagram, imagens de telemóvel |
| Portrait | 3:4 | Fotografias em formato retrato |
| Square | 1:1 | Publicações quadradas, estilo Instagram feed |

#### Secção de Aparência

Toda a identidade visual do restaurante é configurável aqui:

**Cor de destaque (accent color):**
Cor principal usada em botões, links, etiquetas e elementos de destaque. Escolha através de um colour picker. Esta cor define a personalidade visual do cardápio.

**Tipografia:**
| Campo | Onde é usado |
|---|---|
| Fonte de títulos | Nomes de categorias e títulos de secções |
| Fonte de corpo | Descrições de produtos e textos gerais |
| Fonte de botões | Texto em todos os botões |

As fontes são carregadas do Google Fonts — qualquer fonte disponível no Google Fonts pode ser configurada.

**Imagens de marca:**
| Campo | Dimensão recomendada | Onde aparece |
|---|---|---|
| Logótipo | 400×200 px | Cabeçalho do cardápio |
| Ícone | 512×512 px | Ícone PWA, favicon alternativo |
| Favicon | 32×32 ou 64×64 px | Separador do browser |

**Ícone do restaurante:**
Ícone vectorial (Font Awesome) que aparece no cabeçalho quando não há logótipo configurado. Escolha entre centenas de ícones disponíveis (garfo, restaurante, pizza, café, etc.).

#### Secção de Contacto e Redes Sociais

Configure os links para as redes sociais do restaurante. Estes aparecem no rodapé do cardápio:

- WhatsApp (número de telefone — o link `wa.me` é gerado automaticamente)
- Instagram
- Facebook
- TikTok
- YouTube
- Telegram
- LinkedIn

#### Tipos de Pedido Activos

Pode activar ou desactivar cada tipo de pedido independentemente:

| Tipo | Toggle | Efeito |
|---|---|---|
| Entrega | Activar/Desactivar | Mostra/oculta a opção "Entrega" no checkout |
| Takeaway | Activar/Desactivar | Mostra/oculta a opção "Retirada" no checkout |
| Mesa | Activar/Desactivar | Mostra/oculta a opção "Mesa" no checkout |

Se apenas um tipo estiver activo, o checkout salta directamente para esse tipo sem apresentar escolha ao cliente.

### 5.6 Estatísticas

#### Produtos Mais Vendidos

Ranking dos produtos ordenados por quantidade total de unidades vendidas. Os três primeiros são destacados com a cor de destaque do restaurante. Para cada produto é mostrado:

- Posição no ranking
- Nome do produto
- Número total de unidades vendidas
- Barra de progresso visual (proporção face ao mais vendido)

#### Visualizações de Stories

Rastreamento de quantas vezes cada imagem das Stories foi visualizada:

- Total de visualizações
- Visualizações únicas (uma por sessão de utilizador)
- Dados dos últimos 7 dias ou 30 dias

#### Produtos Mais Visualizados

Rastreamento de quais produtos os clientes abrem em modal com mais frequência (mesmo sem chegar a comprar). Útil para perceber o interesse do cliente e identificar produtos que podem estar a falhar na conversão.

#### Estatísticas de Cupões

Na lista de cupões, cada cupão mostra:
- Número de utilizações totais
- Usos restantes (se tiver limite)
- Percentagem de utilização face ao limite

### 5.7 Arquivo de Pedidos

O arquivo contém todos os pedidos com estado "Entregue" ou "Cancelado". Funciona como histórico completo da operação.

**Funcionalidades:**
- Pesquisa por nome, telefone, email, morada ou notas
- Paginação (10 pedidos por página)
- Visualização completa de cada pedido com todos os detalhes
- Indicação do tempo total de entrega (desde aceitação até marcado como entregue)

---

## 6. Configuração Inicial

Esta secção é para quem está a configurar o Chefito de raiz num novo restaurante.

### Pré-requisitos

- Conta no [Supabase](https://supabase.com) (plano gratuito é suficiente para começar)
- Conta no [Vercel](https://vercel.com) (plano gratuito é suficiente)
- Acesso ao repositório do código Chefito

### Passo 1 — Criar o Projecto Supabase

1. Aceda a [supabase.com](https://supabase.com) e crie um novo projecto
2. Anote o **URL do projecto** e a **chave anon** (em Settings → API)
3. No painel do Supabase, vá ao **SQL Editor**
4. Cole e execute o conteúdo do ficheiro `supabase-complete-schema.sql` que está na raiz do repositório
5. O script cria todas as tabelas, políticas de segurança e dados iniciais automaticamente

### Passo 2 — Configurar as Variáveis de Ambiente

Crie um ficheiro `.env` na raiz do projecto com:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Opcionalmente, se usar o CDN Gumlet para optimização de imagens:

```env
VITE_GUMLET_DOMAIN=seurestaurante.gumlet.io
```

### Passo 3 — Criar o Utilizador Administrador

1. No painel do Supabase, vá a **Authentication → Users**
2. Clique em "Invite user" e introduza o email do administrador
3. O utilizador receberá um email para definir a password
4. Após o primeiro login, execute o seguinte SQL no Supabase SQL Editor para dar permissões de super admin:

```sql
UPDATE public.users
SET role = 'super_admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'email-do-admin@exemplo.com'
);
```

### Passo 4 — Deploy no Vercel

1. Faça fork ou importe o repositório no Vercel
2. Em **Settings → Environment Variables**, adicione as mesmas variáveis do `.env`
3. Faça deploy — o Vercel trata do resto automaticamente

Cada actualização ao repositório faz deploy automático.

### Passo 5 — Configurar o Restaurante

Após o primeiro login no painel de administração:

1. Vá a **Configurações → Geral** e defina o nome do restaurante
2. Configure as fontes e cor de destaque em **Aparência**
3. Adicione o logótipo e favicon
4. Configure os tipos de pedido activos
5. Se usar entregas, defina as coordenadas do restaurante e as taxas
6. Se usar MB Way, configure o número e o prefixo
7. Comece a adicionar categorias e produtos em **Produtos**

### Multi-tenant (Vários Restaurantes)

O Chefito suporta múltiplos restaurantes no mesmo repositório de código. Cada restaurante tem o seu próprio projecto Supabase com dados completamente isolados. No Vercel, cria-se um projecto separado por restaurante com as respectivas variáveis de ambiente.

---

## 7. Perguntas Frequentes (FAQ)

**O Chefito funciona no telemóvel?**

Sim. O Chefito é totalmente responsivo e está optimizado para telemóvel. Além disso, pode ser instalado como aplicação nativa (PWA) directamente do browser, sem passar pela App Store ou Google Play.

---

**Os clientes precisam de criar conta para fazer pedidos?**

Não. A conta é opcional. Os clientes podem fazer pedidos como convidados, introduzindo os dados no momento do checkout. A criação de conta oferece benefícios como endereços guardados e histórico de pedidos, mas não é obrigatória.

---

**Como é calculada a taxa de entrega?**

A taxa é calculada automaticamente com base na distância em linha recta entre o restaurante e o endereço do cliente. A fórmula é: **Taxa Base + (Distância em km × Valor por km)**. Ambos os valores são configurados pelo administrador em Configurações → Entrega.

---

**O que acontece se um cliente submeter um pedido fora do horário de funcionamento?**

O Chefito não bloqueia automaticamente pedidos fora de horário — essa gestão fica a cargo do administrador. Os pedidos ficam em estado "Pendente" até serem aceites ou cancelados. Uma solução comum é configurar o WhatsApp automático para que os clientes recebam uma resposta imediata.

---

**Posso ter o cardápio em mais de um idioma?**

De momento, o Chefito não tem suporte nativo para múltiplos idiomas no mesmo cardápio. O conteúdo (nomes de produtos, descrições, mensagens) é introduzido manualmente pelo administrador no idioma desejado.

---

**Como funciona o pagamento MB Way?**

Quando o cliente escolhe MB Way, o sistema gera uma referência única (ex: REST-00042). O cliente usa essa referência na app MB Way para efectuar o pagamento. O administrador recebe o pedido no painel, confirma a recepção do pagamento e clica "Marcar como Pago".

---

**Posso desactivar um produto sem o eliminar?**

Sim. Na ficha de cada produto existe um toggle "Activo/Inactivo". Um produto inactivo não aparece no cardápio para os clientes, mas mantém todos os dados (nome, preço, imagem, histórico de vendas) intactos para quando quiser reactivá-lo.

---

**Os dados de clientes estão seguros?**

Sim. O Chefito usa Row Level Security (RLS) do Supabase, que garante que cada utilizador só consegue aceder aos seus próprios dados. Os administradores acedem apenas aos dados do seu restaurante. As credenciais nunca são expostas publicamente.

---

**Posso usar o Chefito para mais de um restaurante?**

Sim. Cada restaurante tem o seu próprio projecto Supabase com dados completamente isolados. No Vercel, cria-se um projecto separado por restaurante com as respectivas variáveis de ambiente. O código base é partilhado, mas os dados são totalmente independentes.

---

**O que são as Stories e como as configuro?**

As Stories são imagens promocionais (até 3) que aparecem ao cliente quando abre o cardápio. Pode activá-las em Configurações → Stories, fazer upload das imagens e escolher se abrem automaticamente ou apenas quando o cliente clica no ícone. O sistema regista quantas vezes cada imagem foi vista.

---

**Como faço para que um cupão só funcione a partir de um valor mínimo de pedido?**

Na criação ou edição do cupão, preencha o campo "Valor mínimo de pedido". Por exemplo, com valor mínimo de 15€, o cupão só é válido para pedidos iguais ou superiores a esse valor. O cliente vê uma mensagem explicativa se tentar aplicar o cupão com um pedido abaixo do mínimo.

---

**Posso limitar o número de vezes que um cupão é usado?**

Sim. No campo "Limite de utilizações", defina o número máximo. Por exemplo, "50" significa que o cupão pode ser usado 50 vezes no total. Após atingir o limite, fica automaticamente inválido. Deixar este campo em branco significa utilizações ilimitadas.

---

**Como funcionam as notificações de novos pedidos?**

Quando um novo pedido chega, o painel de pedidos activa: alerta sonoro, notificação push (se o browser tiver permissão), vibração no dispositivo e animação visual no ícone do sino. Para receber notificações push mesmo com o browser em segundo plano, é necessário aceitar a permissão de notificações quando o browser a solicitar.

---

**Posso reordenar as categorias e produtos do cardápio?**

Sim. Tanto as categorias como os produtos dentro de cada categoria podem ser reordenados por drag-and-drop. Basta arrastar o item para a posição desejada — a ordem é guardada automaticamente e reflecte-se imediatamente no cardápio para os clientes.

---

**O que acontece ao histórico quando mesclo dois clientes duplicados?**

Todo o histórico de pedidos do registo secundário é transferido para o registo principal. Os endereços de ambos os registos são consolidados numa lista única. O total acumulado é a soma dos dois registos. O registo secundário é eliminado sem perda de informação.

---

## 8. Glossário

**Accent Color (Cor de Destaque)**
Cor principal do restaurante usada em botões, etiquetas e elementos de destaque no cardápio. Configurável em Configurações → Aparência.

**Arquivo**
Secção do painel de administração que contém todos os pedidos com estado "Entregue" ou "Cancelado". Funciona como histórico permanente da operação.

**Carrinho**
Lista temporária de produtos que o cliente vai acumulando antes de submeter o pedido. O conteúdo é guardado no browser mesmo que o cliente feche a página.

**Checkout**
Processo de finalização do pedido, onde o cliente preenche os dados pessoais, escolhe o tipo de pedido e o método de pagamento.

**Cupão**
Código promocional que o cliente pode introduzir no carrinho para obter desconto. Pode ser uma percentagem, um valor fixo ou um produto grátis.

**Drag-and-drop**
Funcionalidade que permite reordenar itens (categorias, produtos, imagens de stories) arrastando-os com o rato ou o dedo para a posição desejada.

**Extra**
Opção adicional que o cliente pode seleccionar ao personalizar um produto (ex: ingrediente extra, molho, tamanho). Cada extra tem um preço próprio que é somado ao total.

**Fórmula de Haversine**
Método matemático usado para calcular a distância entre dois pontos geográficos (latitude/longitude) na superfície da Terra. O Chefito usa-a para calcular a distância entre o restaurante e o endereço de entrega do cliente.

**MB Way**
Sistema de pagamentos móvel português que permite pagar através da aplicação MB Way usando uma referência numérica. O Chefito gera automaticamente referências únicas por pedido.

**Multi-tenant**
Arquitectura onde o mesmo sistema serve múltiplos clientes (restaurantes) de forma isolada. No Chefito, cada restaurante tem a sua própria base de dados Supabase com dados completamente separados.

**Notificação Push**
Notificação enviada pelo browser ao dispositivo do utilizador, mesmo que a página não esteja aberta em primeiro plano. Útil para o administrador receber alertas de novos pedidos com o telemóvel em stand-by.

**Order Sequence (Número Sequencial)**
Número crescente atribuído a cada pedido (1, 2, 3...) para facilitar a identificação. Diferente do ID interno do sistema, que é um código longo. O número sequencial é usado como referência MB Way (ex: REST-00042).

**PWA (Progressive Web App)**
Tecnologia que permite instalar um site como aplicação nativa no telemóvel, com ícone no ecrã inicial e experiência sem barra de endereços, sem necessitar de App Store ou Google Play.

**RLS (Row Level Security)**
Sistema de segurança da base de dados que garante que cada utilizador só consegue aceder aos dados a que tem permissão. No Chefito, impede que clientes acedam a dados de outros clientes ou do restaurante.

**Story**
Imagem promocional que aparece ao cliente quando abre o cardápio. Semelhante aos stories das redes sociais. O Chefito suporta até 3 imagens por restaurante, com rastreamento de visualizações por sessão.

**Supabase**
Plataforma de base de dados open-source usada pelo Chefito para armazenar todos os dados (produtos, pedidos, clientes, etc.), autenticação de utilizadores, armazenamento de imagens e comunicação em tempo real.

**Tag**
Etiqueta visual que aparece no cartão de um produto para chamar a atenção para características especiais: "Novo", "Picante", "Vegetariano", "Destaque", ou uma tag personalizada definida pelo restaurante.

**Taxa de Entrega**
Valor cobrado ao cliente por entregas ao domicílio, calculado automaticamente com base na distância. Composta por uma taxa base fixa mais um valor variável por quilómetro.

**Tipo de Pedido**
Modalidade de um pedido: **Entrega** (ao domicílio), **Takeaway** (retirada pelo cliente) ou **Mesa** (consumo no restaurante). O restaurante pode activar ou desactivar cada tipo nas configurações.

**Vercel**
Plataforma de deploy onde o Chefito é publicado. Trata automaticamente do alojamento, certificado SSL e actualizações sempre que o código é actualizado no repositório.

# Chefito multilocatário — desenho da migração

## Objetivo

Transformar o Chefito em uma plataforma para negócios de alimentação. `chefi.to/` apresenta o produto e oferece cadastro e login. Cada conta proprietária cria exatamente um negócio, publicado em `chefi.to/{slug}`. A página atual de menu e as ferramentas de gestão passam a pertencer ao negócio. Toda a interface fica em português brasileiro. Imagens novas são armazenadas exclusivamente no bucket R2 `app` da Cloudflare.

## Estado verificado em 15/11/2026

- O frontend usa Vite, React Router, Zustand e Supabase JS. `/` renderiza atualmente `Menu`; as rotas de gestão são globais.
- O banco Supabase `neosqsvyktmxslskucgh` contém as tabelas operacionais, mas zero usuários de autenticação, produtos, pedidos e clientes. Há um registro inicial em `restaurant_settings`.
- O Cloudflare da conta Chefito possui os buckets `app`, `chefito` e `landingpage`.
- O upload já usa uma Edge Function de assinatura para R2, mas o fallback atual de `R2_BUCKET` é `chefito`.
- Há tradução dinâmica de PT-PT para PT-BR e seleção de país/idioma; o resultado desejado é pt-BR fixo.

## Rotas e identidade do negócio

- Reservar rotas da plataforma como `/`, `/entrar`, `/cadastro`, `/criar-negocio` e `/conta`; rejeitar esses valores como slug.
- `/{slug}` exibe a página pública do negócio. As subrotas públicas, incluindo produto e acompanhamento de pedido, permanecem sob esse prefixo.
- `/{slug}/gestao/...` reúne produtos, pedidos, clientes, equipe, reservas, finanças e ajustes. Redirecionar visitantes sem sessão para `/entrar?destino=...`.
- O slug é único, minúsculo, normalizado e imutável após a publicação inicial. Uma rota desconhecida mostra uma página 404, nunca dados de outro negócio.
- O documento, favicon, tema e configurações são carregados para o negócio da URL. A landing page usa a marca da plataforma, sem consultar configurações de um negócio.

## Cadastro e autorização

- Cadastro com email e senha via Supabase Auth. Após sessão válida, o usuário informa nome e slug do negócio. A publicação ocorre imediatamente, sem aprovação manual.
- Um índice único em `businesses.owner_user_id` impede que uma conta proprietária crie dois negócios; um índice único em `businesses.slug` impede colisões.
- Usuários clientes podem ter conta para histórico de pedidos, mas essa conta não se torna proprietária. Colaboradores cadastrados dentro da gestão permanecem associados a um único negócio; se receberem login no futuro, a associação deverá ser explícita no banco.
- Toda autorização de escrita e leitura privada é conferida por RLS no Postgres, baseada em `auth.uid()` e na associação ao negócio. A UI não é fronteira de segurança.
- O público pode ler somente perfil, configurações e catálogo publicados do negócio selecionado. Pedidos, clientes, equipe e dados financeiros não ficam disponíveis por consulta pública genérica. Fluxos públicos de pedido usam operações específicas que recebem e validam o negócio.

## Modelo de dados e migração

- Criar `businesses(id, owner_user_id, slug, name, status, created_at)` e adicionar `business_id` às tabelas operacionais, com índices e chaves estrangeiras.
- Atualizar chaves únicas e funções que hoje pressupõem uma loja global, incluindo slug de produto, código de cupom e sequência de pedido, para serem únicas por negócio.
- Criar o registro de configurações de cada negócio no onboarding; retirar o registro inicial órfão apenas após confirmar que não contém dados reais. A inspeção atual aponta ausência de dados operacionais.
- Alterar todas as leituras, escritas, assinaturas Realtime, cache e estado persistido do frontend para carregar `business_id` do negócio selecionado. Trocar de slug ou sair limpa carrinho, tema, dados em cache e assinaturas do negócio anterior.
- Criar políticas RLS por tabela para proprietário e, quando aplicável, cliente. Revisar funções SQL e Edge Functions que hoje usam privilégio elevado ou parâmetros globais.
- Migrar por etapas verificáveis: estrutura e políticas, rotas e onboarding, serviços e estado, fluxos públicos, uploads, identidade visual e tradução, depois testes entre negócios.

## Imagens no R2

- Configurar `R2_BUCKET=app` na Edge Function de upload e em qualquer função de exclusão correspondente; remover o fallback `chefito` para evitar gravação acidental no bucket antigo.
- Organizar objetos por `businesses/{business_id}/{tipo}/{uuid}`. O cliente não define livremente o `business_id` do caminho: a função confere sessão e propriedade antes de assinar upload ou exclusão.
- Usar URL pública vinculada ao bucket `app` para leitura. Validar CORS e domínio público. Nenhuma chave de acesso R2 vai para o navegador.
- Como não há produtos cadastrados, não há imagens de catálogo a mover no banco observado. Antes de apagar qualquer objeto legado, inventariar referências restantes em configurações e outras tabelas.

## Interface e conteúdo

- Landing page com descrição breve, proposta de valor, prévia visual do menu e formulário de entrar/cadastrar. Após login, redirecionar o proprietário para a gestão do seu negócio ou para criação do negócio.
- Usar Material Design 3 como sistema: escala de espaçamento de 4 px, tokens de cantos, hierarquia tipográfica, superfícies, elevação discreta, estados de foco/hover/erro e componentes consistentes. O tema do negócio pode ajustar a cor primária sem quebrar contraste.
- Aplicar tokens compartilhados ao menu e à gestão existentes, padronizando gaps e radius ao longo das telas. Evitar uma landing page visualmente desconectada do produto.
- Fixar `lang="pt-BR"`, formatação monetária BRL e textos em português brasileiro. Remover seletor de idioma, lógica de tradução em tempo de execução e opções de Portugal/EUR da interface.
- Garantir navegação por teclado, rótulos dos formulários, mensagens de erro, estados vazios e layout móvel.

## Verificação

- Testar cadastro, login, criação de negócio, colisão de slug, redirecionamento e 404.
- Testar dois negócios com contas distintas: catálogo público correto, gestão isolada e negação de leituras/escritas cruzadas diretamente pela API Supabase.
- Testar criação de produto, pedido, reserva, cupom, cliente e upload/exclusão de imagem no bucket `app`.
- Conferir build, lint, testes existentes e navegação no localhost em desktop e móvel. Antes de publicar, verificar as configurações e segredos de produção, executar a migração no Supabase e testar o domínio `chefi.to`.

## Fontes de orientação

- [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance): consultar guias específicos antes de implementar formulários, CSS e comportamento do navegador.
- Documentação oficial do Material Design 3 e do Supabase para tokens, componentes, Auth e RLS.

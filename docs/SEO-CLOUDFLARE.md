# SEO para subdomínios `*.chefi.to`

O ficheiro `functions/[[path]].ts` é uma Cloudflare Pages Function. Em cada
projeto/deploy de restaurante, defina as variáveis de ambiente:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Depois associe o domínio do restaurante, por exemplo `nome.chefi.to`, ao deploy
correspondente. A função gera no servidor:

- Open Graph e Twitter Card para a página inicial;
- Open Graph do prato em `/produto/<slug>`, usando `products.image_url`;
- `robots.txt` com `Sitemap` do subdomínio atual;
- `sitemap.xml` com a ementa e todos os pratos ativos.

As rotas de produto devem ser encaminhadas para o `index.html` (fallback de SPA,
comportamento padrão de Cloudflare Pages). Não use URLs com `#`: fragmentos não
são enviados a redes sociais nem a motores de busca.

# Atenção antes e depois do lançamento

- Implementar recuperação de senha para proprietários usando Resend, incluindo configuração de domínio, fluxo de redefinição e testes de entrega. Funcionalidade pendente.
- Antes de lançar, testar com dois negócios e sessões independentes: isolamento de dados, cadastro, pedido anônimo, frete, Pix, cupons, WhatsApp, imagens e notificações.
- O endpoint público de pedidos precisa de proteção contra abuso e monitoramento. A correspondência por nome, telefone e email organiza pedidos, mas não comprova identidade.
- Medir o carregamento real em celular e revisar os arquivos grandes de mapa e stories e as políticas permissivas sinalizadas pelo Supabase.

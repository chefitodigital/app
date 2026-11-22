/*
  # Corrigir ícone padrão da tabela tags

  1. Alterações
    - Alterar o valor DEFAULT do campo `icon` na tabela `tags` de emoji '🏷️' para o nome do ícone Font Awesome 'tag'
    - Isso garante consistência com o resto da aplicação que usa Font Awesome icons
  
  2. Notas Importantes
    - Esta migração apenas altera o DEFAULT para novos registros
    - Tags existentes mantêm seus valores atuais
    - O sistema usa Font Awesome com o padrão `fas fa-${icon}`, então o valor deve ser o nome do ícone (ex: 'tag', 'utensils', 'fire')
*/

-- Alterar o default do campo icon na tabela tags
ALTER TABLE tags 
ALTER COLUMN icon SET DEFAULT 'tag';
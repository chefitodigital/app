/*
  # Restringir escrita em restaurant_settings ao super_admin

  ## Problema
  A política existente "Authenticated users can manage restaurant_settings" usava
  `USING (true)` e `WITH CHECK (true)`, permitindo qualquer utilizador autenticado
  (incluindo clientes) alterar as configurações globais do restaurante.

  ## Alterações
  1. Remove a política permissiva de ALL para utilizadores autenticados
  2. Cria políticas separadas e restritivas:
     - SELECT: leitura pública mantida (necessária para exibir o site a todos)
     - INSERT: apenas super_admin
     - UPDATE: apenas super_admin
     - DELETE: apenas super_admin

  ## Segurança
  A verificação é feita consultando a tabela public.users para confirmar
  que o utilizador autenticado tem role = 'super_admin'.
*/

-- Remove a política permissiva existente
DROP POLICY IF EXISTS "Authenticated users can manage restaurant_settings" ON restaurant_settings;

-- INSERT: apenas super_admin
CREATE POLICY "Only super_admin can insert restaurant_settings"
  ON restaurant_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- UPDATE: apenas super_admin
CREATE POLICY "Only super_admin can update restaurant_settings"
  ON restaurant_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- DELETE: apenas super_admin
CREATE POLICY "Only super_admin can delete restaurant_settings"
  ON restaurant_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

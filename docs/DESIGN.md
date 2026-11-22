# Paleta de Cores Oficial*

Este documento define a paleta de cores aprovada para a aplicação. **NUNCA** utilize cores fora desta paleta.

## Cores Aprovadas

### Escala de Cinza (Gray Scale)

Esta é a ÚNICA escala de tons neutros permitida na aplicação:

```
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#6c757d',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
          950: '#121417',
```

### Cor de Destaque (Accent)

A cor de destaque é configurável através das definições do restaurante.
Esta cor é aplicada automaticamente via CSS custom properties:
- `--color-accent`
- `--color-accent-hover`

Use as classes Tailwind:
- `bg-accent`
- `text-accent`
- `border-accent`
- `hover:bg-accent-hover`

## Cores PROIBIDAS

As seguintes cores NÃO devem ser utilizadas em NENHUMA circunstância:

### Proibido: Branco e Preto Puros
❌ `#ffffff` / `white` / `bg-white` / `text-white`
❌ `#000000` / `black` / `bg-black` / `text-black`

**Substituir por:**
- ✅ `bg-gray-50` ou `text-gray-50` (mais claro)
- ✅ `bg-gray-950` ou `text-gray-950` (mais escuro)

### Proibido: Cores Específicas
❌ `red` / `bg-red-*` / `text-red-*`
❌ `blue` / `bg-blue-*` / `text-blue-*`
❌ `green` / `bg-green-*` / `text-green-*`
❌ `yellow` / `bg-yellow-*` / `text-yellow-*`
❌ `purple` / `bg-purple-*` / `text-purple-*`
❌ `indigo` / `bg-indigo-*` / `text-indigo-*`
❌ `violet` / `bg-violet-*` / `text-violet-*`
❌ `pink` / `bg-pink-*` / `text-pink-*`
❌ `orange` / `bg-orange-*` / `text-orange-*`

## Tabela de Substituições Comuns

| ❌ Errado | ✅ Correto | Uso |
|----------|----------|-----|
| `bg-white` | `bg-gray-50` | Fundos claros |
| `text-white` | `text-gray-50` | Texto sobre fundos escuros |
| `bg-black` | `bg-gray-950` | Fundos muito escuros |
| `text-black` | `text-gray-950` | Texto sobre fundos claros |
| `bg-red-600` | `bg-accent` | Botões de ação |
| `text-red-600` | `text-accent` | Texto destacado |
| `border-red-600` | `border-accent` | Bordas destacadas |

## Exemplos de Uso Correto

### Botão Primário
```tsx
<button className="bg-accent text-gray-50 hover:bg-accent-hover">
  Confirmar
</button>
```

### Botão Secundário
```tsx
<button className="border border-gray-300 text-gray-700 hover:bg-gray-100">
  Cancelar
</button>
```

### Card com Fundo Claro
```tsx
<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
  <h3 className="text-gray-900">Título</h3>
  <p className="text-gray-600">Descrição</p>
</div>
```

### Texto sobre Fundo Escuro
```tsx
<div className="bg-gray-800">
  <p className="text-gray-50">Texto claro sobre fundo escuro</p>
</div>
```

## Notas Importantes

1. **Sempre use a escala gray:** Para tons neutros, SEMPRE use a escala gray (50-950)
2. **Cor de destaque configurável:** Use `accent` para elementos destacados
3. **Sem cores fixas:** Nunca use cores fixas como red, blue, green, etc.
4. **Consistência visual:** Esta paleta garante consistência em toda a aplicação
5. **Acessibilidade:** Os tons escolhidos garantem contraste adequado

## Referência no Código

Este documento deve ser consultado sempre que:
- Criar novos componentes
- Modificar estilos existentes
- Revisar código
- Adicionar novas funcionalidades

**Referência técnica:** Ver `tailwind.config.js` para configuração das cores no Tailwind.

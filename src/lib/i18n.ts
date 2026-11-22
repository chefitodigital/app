/**
 * Sistema de terminologia por país.
 *
 * A **base é sempre PT-PT** (a string que aparece no código-fonte).
 * Só se define override quando o termo diverge em PT-BR.
 * Se amanhã mudarmos uma string em PT-PT sem override, a versão BR
 * acompanha automaticamente — não é preciso alterar o dicionário.
 */

export type Country = 'PT' | 'BR';

export const COUNTRIES: { code: Country; label: string; currency: 'EUR' | 'BRL' }[] = [
  { code: 'PT', label: 'Portugal', currency: 'EUR' },
  { code: 'BR', label: 'Brasil', currency: 'BRL' },
];

// Dicionário de overrides PT-PT → PT-BR.
// Chave = string PT-PT tal como aparece no código-fonte.
const OVERRIDES: Record<string, Partial<Record<Country, string>>> = {
  // Contactos / morada
  'Contacto': { BR: 'Contato' },
  'Contactos': { BR: 'Contatos' },
  'Contactar': { BR: 'Contatar' },
  'Morada': { BR: 'Endereço' },
  'Morada completa': { BR: 'Endereço completo' },
  'Selecione uma morada': { BR: 'Selecione um endereço' },
  'Usar outra morada': { BR: 'Usar outro endereço' },
  'Usar morada guardada': { BR: 'Usar endereço salvo' },
  'Telemóvel': { BR: 'Celular' },
  'Telemóvel *': { BR: 'Celular *' },
  'Código Postal': { BR: 'CEP' },

  // Equipa / staff
  'Equipa': { BR: 'Equipe' },
  'Gerir equipa': { BR: 'Gerenciar equipe' },
  'Membro da equipa': { BR: 'Membro da equipe' },
  'Membros da equipa': { BR: 'Membros da equipe' },

  // Autenticação
  'Palavra-passe': { BR: 'Senha' },
  'Iniciar sessão': { BR: 'Entrar' },
  'Terminar sessão': { BR: 'Sair' },
  'Registar': { BR: 'Cadastrar' },
  'Registar-se': { BR: 'Cadastrar-se' },
  'Utilizador': { BR: 'Usuário' },

  // Pedidos
  'Encomenda': { BR: 'Pedido' },
  'Encomendas': { BR: 'Pedidos' },
  'Talão': { BR: 'Comprovante' },
  'Ecrã': { BR: 'Tela' },

  // Cupões
  'Cupão': { BR: 'Cupom' },
  'Cupões': { BR: 'Cupons' },

  // Ações
  'Guardar': { BR: 'Salvar' },
  'Guardar Configurações': { BR: 'Salvar Configurações' },
  'A guardar...': { BR: 'Salvando...' },
  'guardada': { BR: 'salva' },
  'guardado': { BR: 'salvo' },

  // Pagamento
  'Método de Pagamento': { BR: 'Forma de Pagamento' },
  'Dinheiro': { BR: 'Dinheiro' },

  // Outros termos comuns PT-PT → PT-BR
  'Encomendar': { BR: 'Pedir' },
  'A encomendar...': { BR: 'Enviando pedido...' },
  'Fazer encomenda': { BR: 'Fazer pedido' },
  'A minha encomenda': { BR: 'Meu pedido' },
  'As minhas encomendas': { BR: 'Meus pedidos' },
  'Facturação': { BR: 'Faturamento' },
  'Factura': { BR: 'Nota fiscal' },
  'Facturas': { BR: 'Notas fiscais' },
  'Talões': { BR: 'Comprovantes' },
  'Palavra-passe actual': { BR: 'Senha atual' },
  'Nova palavra-passe': { BR: 'Nova senha' },
  'Confirmar palavra-passe': { BR: 'Confirmar senha' },
  'Definições': { BR: 'Configurações' },
  'Autocarro': { BR: 'Ônibus' },
  'Frigorífico': { BR: 'Geladeira' },
  'Ficheiro': { BR: 'Arquivo' },
  'Ficheiros': { BR: 'Arquivos' },
  'Sumo': { BR: 'Suco' },
  'Ementa': { BR: 'Cardápio' },
  'Pequeno-almoço': { BR: 'Café da manhã' },
  'Casa de banho': { BR: 'Banheiro' },
};

export function t(key: string, country: Country | null | undefined): string {
  const c = country ?? 'BR';
  return OVERRIDES[key]?.[c] ?? key;
}

/** Map indexado para lookups O(1) usados pelo tradutor DOM. */
export const OVERRIDES_MAP: Map<string, Partial<Record<Country, string>>> = new Map(
  Object.entries(OVERRIDES),
);

/**
 * Preset aplicado quando o admin muda o país.
 * Devolve os campos que devem ser sobrepostos no formulário.
 */
export function countryPreset(country: Country) {
  if (country === 'BR') {
    return {
      currency: 'BRL' as const,
      // Pagamento local do Brasil: Pix. MB WAY não aplicável.
      mbway_enabled: false,
    };
  }
  return {
    currency: 'EUR' as const,
    pix_enabled: false,
  };
}

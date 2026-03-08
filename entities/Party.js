/**
 * Entidade Party — festa/aniversário
 * @typedef {Object} Party
 * @property {string} child_name - Nome da aniversariante
 * @property {string} party_date - Data da festa (formato date)
 * @property {string} [party_time] - Horário da festa
 * @property {string} [party_location] - Local da festa
 * @property {string} [party_theme] - Tema da festa
 * @property {number} [child_age] - Idade que vai fazer
 * @property {string[]} [photos] - Fotos da aniversariante
 * @property {string} [message] - Mensagem personalizada para os convidados
 */

/** Valores padrão para uma Party */
export const PARTY_DEFAULTS = {
  photos: [],
}

/**
 * Cria um objeto Party com defaults aplicados (campos obrigatórios devem ser passados).
 * @param {Partial<Party> & Pick<Party, 'child_name'|'party_date'>} data
 * @returns {Party}
 */
export function createParty(data) {
  return {
    ...PARTY_DEFAULTS,
    ...data,
  }
}

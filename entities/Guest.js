/**
 * Entidade Guest — convidado da festa
 * @typedef {Object} Guest
 * @property {string} name - Nome do convidado
 * @property {'adult'|'child'} [type='adult'] - Tipo de convidado
 * @property {number} [age] - Idade (especialmente para crianças)
 * @property {string} [group_name] - Nome do grupo/família
 * @property {string} party_id - ID da festa
 * @property {string} confirmation_token - Token único para confirmação do grupo
 * @property {'pending'|'confirmed'|'declined'|'partial'} [status='pending'] - Status geral da confirmação
 * @property {'pending'|'confirmed'|'declined'} [confirmed_status='pending'] - Status individual de confirmação
 * @property {string} [response_date] - Data da resposta (ISO date-time)
 * @property {string} [message] - Mensagem do convidado
 */

/** @type {Readonly<Guest['type'][]>} */
export const GUEST_TYPES = ['adult', 'child']

/** @type {Readonly<Guest['status'][]>} */
export const GUEST_STATUSES = ['pending', 'confirmed', 'declined', 'partial']

/** @type {Readonly<Guest['confirmed_status'][]>} */
export const GUEST_CONFIRMED_STATUSES = ['pending', 'confirmed', 'declined']

/** Valores padrão para um Guest */
export const GUEST_DEFAULTS = {
  type: 'adult',
  status: 'pending',
  confirmed_status: 'pending',
}

/**
 * Cria um objeto Guest com defaults aplicados (campos obrigatórios devem ser passados).
 * @param {Partial<Guest> & Pick<Guest, 'name'|'party_id'|'confirmation_token'>} data
 * @returns {Guest}
 */
export function createGuest(data) {
  return {
    ...GUEST_DEFAULTS,
    ...data,
  }
}

/**
 * Operator identity for the site's legal notice — one fact, one home.
 *
 * Consumed by both /impressum and /de/impressum so name/address/email are
 * entered exactly once and can never drift between the English and German
 * legal-notice pages.
 *
 * ⚠ COMPLETE BEFORE RELYING ON THIS LEGALLY:
 *   Fill `address` and `email` below with real values. A German Impressum
 *   legally requires a reachable postal address + contact. We deliberately
 *   ship these EMPTY (never invent an address; never publish a private email
 *   without the operator's say-so). While empty, both pages render a visible
 *   draft notice.
 */

export const OPERATOR = {
  name: 'Nayoung Ahn',
  // Postal address required for a German Impressum. Leave '' until you add a real one.
  address: '',
  // Contact email. Leave '' until you add one (a role/dedicated address is wise).
  email: '',
}

export const OPERATOR_INCOMPLETE = !OPERATOR.address || !OPERATOR.email

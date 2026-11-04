import type { CreateTransferRequest } from '../api/types'
import { NEW_RECIPIENT, type TransferFormValues } from './transferSchema'

/** Converts validated form values into what the API expects. */
export function toTransferRequest(
  values: TransferFormValues,
): CreateTransferRequest {
  const shared = {
    fromAccountId: values.fromAccountId,
    amount: Number(values.amount),
    note: values.note || undefined,
  }

  // The API accepts either a saved payee or a new recipient, never both.
  return values.payeeId === NEW_RECIPIENT
    ? { ...shared, recipient: values.recipient }
    : { ...shared, payeeId: values.payeeId }
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FormProvider, useForm, type FieldPath } from 'react-hook-form'
import { ApiError } from '../api/client'
import type { Account, Customer, Payee } from '../api/types'
import type { useCreateTransfer } from '../api/useCreateTransfer'
import { Button } from '../components/Button'
import { getDepositAccounts, getRemainingDailyLimit } from '../lib/banking'
import { Stepper } from './Stepper'
import { SuccessPanel } from './SuccessPanel'
import { AmountStep } from './steps/amount/AmountStep'
import { RecipientStep } from './steps/recipient/RecipientStep'
import { ReviewStep } from './steps/review/ReviewStep'
import { toTransferRequest } from './toTransferRequest'
import {
  createTransferSchema,
  type TransferFormValues,
} from './transferSchema'
import styles from './transfer.module.css'

const SEND_ERROR =
  "Something went wrong. Your money hasn't left your account. Try again."

const STEPS: {
  title: string
  fields: FieldPath<TransferFormValues>[]
}[] = [
  {
    title: 'Who are you sending to?',
    fields: [
      'payeeId',
      'recipient.name',
      'recipient.accountNumber',
      'recipient.bank',
    ],
  },
  {
    title: 'How much?',
    fields: ['fromAccountId', 'amount', 'note'],
  },
  { title: 'Check the details', fields: [] },
]
const REVIEW_STEP = STEPS.length - 1

interface TransferFormProps {
  accounts: Account[]
  customer: Customer
  payees: Payee[]
  createTransfer: ReturnType<typeof useCreateTransfer>
  onClose: () => void
}

export function TransferForm({
  accounts,
  customer,
  payees,
  createTransfer,
  onClose,
}: TransferFormProps) {
  const [step, setStep] = useState(0)
  const [sendError, setSendError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  // The Confirm button only disables after a render, once validation has run. A
  // ref changes straight away, so a fast double-click can't send a second time.
  const isSubmittingRef = useRef(false)
  const remainingLimit = getRemainingDailyLimit(customer)
  const isSending = createTransfer.isPending

  // One form across all the steps, so Back keeps everything entered. The schema
  // is rebuilt on each render, so its rules always use the latest balance.
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(createTransferSchema({ accounts, remainingLimit })),
    mode: 'onTouched',
    defaultValues: {
      payeeId: '',
      recipient: { name: '', accountNumber: '', bank: '' },
      fromAccountId: getDepositAccounts(accounts)[0]?.id ?? '',
      amount: '',
      note: '',
    },
  })

  // Tells keyboard and screen reader users that the step has changed.
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function send(values: TransferFormValues) {
    setSendError(null)
    createTransfer.mutate(toTransferRequest(values), {
      onError: (error) => {
        // Saved payee errors mean a bug in the request, which users can't fix.
        const fieldErrors =
          error instanceof ApiError && error.fields
            ? Object.entries(error.fields).filter(([key]) => key !== 'payeeId')
            : []

        // Also set under the field, for when the user presses Back to fix it.
        for (const [field, message] of fieldErrors) {
          form.setError(field as FieldPath<TransferFormValues>, { message })
        }
        setSendError(fieldErrors[0]?.[1] ?? SEND_ERROR)
      },
      onSettled: () => {
        isSubmittingRef.current = false
      },
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (step === REVIEW_STEP) {
      if (isSubmittingRef.current) return
      isSubmittingRef.current = true

      // The rules run once more, in case the balance or limit has changed.
      void form.handleSubmit(send, (errors) => {
        isSubmittingRef.current = false
        const firstError = Object.values(errors)[0]
        setSendError(firstError?.message ?? SEND_ERROR)
      })(event)
      return
    }

    void form
      .trigger(STEPS[step].fields, { shouldFocus: true })
      .then((isValid) => {
        if (isValid) setStep(step + 1)
      })
  }

  function handleBack() {
    setSendError(null)
    setStep(step - 1)
  }

  return (
    <FormProvider {...form}>
      {/* Mounted empty before success, so screen readers announce what appears. */}
      <div aria-live="polite" className={styles.live}>
        {createTransfer.data && (
          <SuccessPanel
            onDone={onClose}
            transfer={createTransfer.data.transfer}
          />
        )}
      </div>

      {!createTransfer.data && (
        <>
          <Stepper currentStep={step} />
          <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <div className={styles.body}>
              <h3 className={styles.stepTitle} ref={headingRef} tabIndex={-1}>
                {STEPS[step].title}
              </h3>
              {step === 0 && <RecipientStep payees={payees} />}
              {step === 1 && (
                <AmountStep
                  accounts={accounts}
                  remainingLimit={remainingLimit}
                />
              )}
              {step === REVIEW_STEP && (
                <ReviewStep
                  accounts={accounts}
                  payees={payees}
                  sendError={sendError}
                />
              )}
            </div>

            <footer className={styles.footer}>
              {step === 0 ? (
                <Button onClick={onClose} variant="secondary">
                  Cancel
                </Button>
              ) : (
                <Button
                  disabled={isSending}
                  onClick={handleBack}
                  variant="secondary"
                >
                  Back
                </Button>
              )}
              <Button disabled={isSending} type="submit">
                {step !== REVIEW_STEP && 'Continue'}
                {step === REVIEW_STEP &&
                  (isSending ? 'Sending…' : 'Confirm transfer')}
              </Button>
            </footer>
          </form>
        </>
      )}
    </FormProvider>
  )
}

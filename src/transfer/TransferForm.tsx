import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FormProvider, useForm, type FieldPath } from 'react-hook-form'
import type { Account, Customer, Payee } from '../api/types'
import { Button } from '../components/Button'
import { getDepositAccounts, getRemainingDailyLimit } from '../lib/banking'
import { Stepper } from './Stepper'
import { AmountStep } from './steps/amount/AmountStep'
import { RecipientStep } from './steps/recipient/RecipientStep'
import {
  createTransferSchema,
  type TransferFormValues,
} from './transferSchema'
import styles from './transfer.module.css'

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

interface TransferFormProps {
  accounts: Account[]
  customer: Customer
  payees: Payee[]
  onCancel: () => void
}

export function TransferForm({
  accounts,
  customer,
  payees,
  onCancel,
}: TransferFormProps) {
  const [step, setStep] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const remainingLimit = getRemainingDailyLimit(customer)

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

  const isLastStep = step === STEPS.length - 1

  async function handleContinue(event: FormEvent) {
    event.preventDefault()
    const isValid = await form.trigger(STEPS[step].fields, {
      shouldFocus: true,
    })
    if (isValid) setStep(step + 1)
  }

  return (
    <FormProvider {...form}>
      <Stepper currentStep={step} />
      <form className={styles.form} noValidate onSubmit={handleContinue}>
        <div className={styles.body}>
          <h3 className={styles.stepTitle} ref={headingRef} tabIndex={-1}>
            {STEPS[step].title}
          </h3>
          {step === 0 && <RecipientStep payees={payees} />}
          {step === 1 && (
            <AmountStep accounts={accounts} remainingLimit={remainingLimit} />
          )}
          {/* Placeholder: the review step arrives in the next stage. */}
        </div>

        <footer className={styles.footer}>
          {step === 0 ? (
            <Button onClick={onCancel} variant="secondary">
              Cancel
            </Button>
          ) : (
            <Button onClick={() => setStep(step - 1)} variant="secondary">
              Back
            </Button>
          )}
          {!isLastStep && <Button type="submit">Continue</Button>}
        </footer>
      </form>
    </FormProvider>
  )
}

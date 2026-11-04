import { useState } from 'react'
import { Button } from '../components/Button'
import { Stepper } from './Stepper'
import styles from './transfer.module.css'

const STEP_TITLES = [
  'Who are you sending to?',
  'How much?',
  'Check the details',
]

interface TransferFormProps {
  onCancel: () => void
}

export function TransferForm({ onCancel }: TransferFormProps) {
  const [step, setStep] = useState(0)
  const isFirstStep = step === 0
  const isLastStep = step === STEP_TITLES.length - 1

  return (
    <>
      <Stepper currentStep={step} />

      {/* Placeholder: the step contents arrive in the next stages. */}
      <div className={styles.body}>
        <h3 className={styles.stepTitle}>{STEP_TITLES[step]}</h3>
      </div>

      <footer className={styles.footer}>
        {isFirstStep ? (
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        ) : (
          <Button onClick={() => setStep(step - 1)} variant="secondary">
            Back
          </Button>
        )}
        {!isLastStep && (
          <Button onClick={() => setStep(step + 1)}>Continue</Button>
        )}
      </footer>
    </>
  )
}

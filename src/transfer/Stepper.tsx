import styles from './transfer.module.css'

const STEPS = ['Recipient', 'Amount', 'Review']

interface StepperProps {
  currentStep: number
}

export function Stepper({ currentStep }: StepperProps) {
  return (
    <ol className={styles.stepper}>
      {STEPS.map((label, index) => (
        <li
          aria-current={index === currentStep ? 'step' : undefined}
          className={styles.stepperItem}
          key={label}
        >
          {label}
        </li>
      ))}
    </ol>
  )
}

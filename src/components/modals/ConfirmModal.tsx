import { createPortal } from 'react-dom'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'

interface ConfirmModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmText: string
  cancelText: string
}

export function ConfirmModal({ 
  isOpen, 
  onConfirm, 
  onCancel,
  title,
  message,
  confirmText,
  cancelText
}: ConfirmModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-8 w-full" style={{ maxWidth: '28rem' }}>
        <h3 className="text-xl font-bold text-azul-profundo pb-4">
          {title}
        </h3>
        <p className="text-azul-profundo/70 pb-8">
          {message}
        </p>
        <div className="flex gap-4">
          <SecondaryButton onClick={onCancel} className="flex-1">
            {cancelText}
          </SecondaryButton>
          <PrimaryButton onClick={onConfirm} className="flex-1">
            {confirmText}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body
  )
}
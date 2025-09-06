import { useState, useEffect, useCallback } from 'react'

interface UseSecretSequenceOptions {
  sequence: string[]
  resetTimeout?: number
  onSequenceComplete?: () => void
}

export function useSecretSequence({
  sequence,
  resetTimeout = 3000,
  onSequenceComplete
}: UseSecretSequenceOptions) {
  const [currentInput, setCurrentInput] = useState<string[]>([])
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const resetSequence = useCallback(() => {
    setCurrentInput([])
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
  }, [timeoutId])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase()
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    setCurrentInput(prev => {
      const newInput = [...prev, key]
      
      // Check if current input matches the beginning of the sequence
      const isValidSoFar = sequence.slice(0, newInput.length).every(
        (seqKey, index) => seqKey.toLowerCase() === newInput[index]
      )

      if (!isValidSoFar) {
        // Wrong key, reset
        return []
      }

      // Check if sequence is complete
      if (newInput.length === sequence.length) {
        setIsUnlocked(true)
        onSequenceComplete?.()
        return []
      }

      // Set timeout to reset if user stops typing
      const newTimeoutId = setTimeout(() => {
        setCurrentInput([])
      }, resetTimeout)
      setTimeoutId(newTimeoutId)

      return newInput
    })
  }, [sequence, resetTimeout, timeoutId, onSequenceComplete])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [handleKeyPress, timeoutId])

  const lock = useCallback(() => {
    setIsUnlocked(false)
    resetSequence()
  }, [resetSequence])

  return {
    isUnlocked,
    progress: currentInput.length,
    totalSteps: sequence.length,
    lock,
    resetSequence
  }
}
"use client"

import { useEffect } from "react"

type AnimationFunction = () => void | (() => void)

interface UseGSAPAnimationsProps {
  animations: AnimationFunction[]
  delay?: number
  dependencies?: any[]
}

export const useGSAPAnimations = ({
  animations,
  delay = 100,
  dependencies = [],
}: UseGSAPAnimationsProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      animations.forEach((animationFn) => {
        try {
          animationFn()
        } catch (error) {
          console.error("Animation failed:", error)
        }
      })
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [delay, ...dependencies])
}
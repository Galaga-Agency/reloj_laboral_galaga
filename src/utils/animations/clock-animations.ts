"use client"

import { gsap } from "@/lib/gsap-config"

export const initClockAnimations = () => {
  if (typeof window === "undefined") return () => {}

  const clockElement = document.querySelector(".clock-container")
  const buttonsElement = document.querySelector(".buttons-container")

  if (clockElement) {
    gsap.fromTo(clockElement,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
    )
  }

  if (buttonsElement) {
    gsap.fromTo(buttonsElement,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: "power2.out" }
    )
  }

  return () => {
    gsap.killTweensOf([clockElement, buttonsElement])
  }
}
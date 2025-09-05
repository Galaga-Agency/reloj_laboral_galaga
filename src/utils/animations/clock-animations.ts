"use client"

import { gsap } from "@/lib/gsap-config"

export const initLoginAnimations = () => {
  if (typeof window === "undefined") return () => {}

  const logoElement = document.querySelector(".login-logo")
  const formElement = document.querySelector(".login-form")

  if (logoElement) {
    gsap.fromTo(logoElement, 
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    )
  }

  if (formElement) {
    gsap.fromTo(formElement,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: "power2.out" }
    )
  }

  return () => {
    gsap.killTweensOf([logoElement, formElement])
  }
}

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

export const initDashboardAnimations = () => {
  if (typeof window === "undefined") return () => {}

  const headerElement = document.querySelector(".dashboard-header")
  const navElement = document.querySelector(".dashboard-nav")
  const mainElement = document.querySelector(".dashboard-main")

  if (headerElement) {
    gsap.fromTo(headerElement,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    )
  }

  if (navElement) {
    gsap.fromTo(navElement,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "power2.out" }
    )
  }

  if (mainElement) {
    gsap.fromTo(mainElement,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: "power2.out" }
    )
  }

  return () => {
    gsap.killTweensOf([headerElement, navElement, mainElement])
  }
}
"use client"

import { gsap } from "@/lib/gsap-config"

export const initLoginAnimations = () => {
  if (typeof window === "undefined") return () => {}

  // Desktop animations
  const logoElement = document.querySelector(".login-logo")
  const titleElement = document.querySelector(".login-title")
  const subtitleElement = document.querySelector(".login-subtitle")
  const formElement = document.querySelector(".login-form")
  const credentialsElement = document.querySelector(".login-credentials")

  // Mobile animations
  const mobileLogoElement = document.querySelector(".mobile-login-logo")
  const mobileTitleElement = document.querySelector(".mobile-login-title")
  const mobileSubtitleElement = document.querySelector(".mobile-login-subtitle")
  const mobileFormElement = document.querySelector(".mobile-login-form")
  const mobileCredentialsElement = document.querySelector(".mobile-login-credentials")

  // Desktop Layout Animations
  if (logoElement) {
    gsap.fromTo(logoElement,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
    )
  }

  if (titleElement) {
    gsap.fromTo(titleElement,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 0.3, ease: "power2.out" }
    )
  }

  if (subtitleElement) {
    gsap.fromTo(subtitleElement,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: "power2.out" }
    )
  }

  if (formElement) {
    gsap.fromTo(formElement,
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, delay: 0.4, ease: "power2.out" }
    )
  }

  if (credentialsElement) {
    gsap.fromTo(credentialsElement,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.8, ease: "power2.out" }
    )
  }

  // Mobile Layout Animations
  if (mobileLogoElement) {
    gsap.fromTo(mobileLogoElement,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.7)" }
    )
  }

  if (mobileTitleElement) {
    gsap.fromTo(mobileTitleElement,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: "power2.out" }
    )
  }

  if (mobileSubtitleElement) {
    gsap.fromTo(mobileSubtitleElement,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.5, ease: "power2.out" }
    )
  }

  if (mobileFormElement) {
    gsap.fromTo(mobileFormElement,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.6, ease: "power2.out" }
    )
  }

  if (mobileCredentialsElement) {
    gsap.fromTo(mobileCredentialsElement,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.9, ease: "power2.out" }
    )
  }

  return () => {
    gsap.killTweensOf([
      logoElement, 
      titleElement, 
      subtitleElement, 
      formElement, 
      credentialsElement,
      mobileLogoElement,
      mobileTitleElement,
      mobileSubtitleElement,
      mobileFormElement,
      mobileCredentialsElement
    ])
  }
}
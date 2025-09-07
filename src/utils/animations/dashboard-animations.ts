"use client"

import { gsap } from "@/lib/gsap-config"

export const initDashboardAnimations = () => {
  if (typeof window === "undefined") return () => {}

  const headerElement = document.querySelector(".dashboard-header")
  const tabsElement = document.querySelector(".dashboard-tabs")
  const contentElement = document.querySelector("main")

  if (headerElement) {
    gsap.fromTo(headerElement,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    )
  }

  if (tabsElement) {
    gsap.fromTo(tabsElement,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
    )
  }

  if (contentElement) {
    gsap.fromTo(contentElement,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.4, ease: "power2.out" }
    )
  }

  return () => {
    gsap.killTweensOf([headerElement, tabsElement, contentElement])
  }
}
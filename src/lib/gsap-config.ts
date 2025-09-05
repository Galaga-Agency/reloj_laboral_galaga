"use client"

import { gsap as _gsap } from "gsap"

type GSAPBundle = {
  gsap: typeof _gsap
}

function init(): GSAPBundle {
  _gsap.ticker.lagSmoothing(500, 33)
  
  return {
    gsap: _gsap
  }
}

const GSAP = ((globalThis as any).__GSAP_CONFIG__ ??= init()) as GSAPBundle

export const gsap = GSAP.gsap
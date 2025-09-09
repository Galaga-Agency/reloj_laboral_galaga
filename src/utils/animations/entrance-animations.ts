"use client";

import { gsap } from "@/lib/gsap-config";

/**
 * This will automatically animate any element that has a class like:
 *   fade-up, fade-down, fade-left, fade-right, fade-zoom
 *
 * Example usage:
 *   <div className="fade-up">Hello</div>
 *
 * In the component:
 *   useGSAPAnimations({ animations: [initEntranceAnimation], delay: 100 })
 */
export const initEntranceAnimation = () => {
  if (typeof window === "undefined") return () => {};

  const elements = document.querySelectorAll<HTMLElement>(
    ".fade-up, .fade-down, .fade-left, .fade-right, .fade-zoom"
  );

  const tweens: gsap.core.Tween[] = [];

  elements.forEach((el) => {
    let from: gsap.TweenVars = { opacity: 0 };
    let to: gsap.TweenVars = { opacity: 1, duration: 0.7, ease: "power2.out" };

    if (el.classList.contains("fade-up")) {
      from = { ...from, y: 30 };
      to = { ...to, y: 0 };
    } else if (el.classList.contains("fade-down")) {
      from = { ...from, y: -30 };
      to = { ...to, y: 0 };
    } else if (el.classList.contains("fade-left")) {
      from = { ...from, x: -30 };
      to = { ...to, x: 0 };
    } else if (el.classList.contains("fade-right")) {
      from = { ...from, x: 30 };
      to = { ...to, x: 0 };
    } else if (el.classList.contains("fade-zoom")) {
      from = { ...from, scale: 0.9 };
      to = { ...to, scale: 1 };
    }

    tweens.push(gsap.fromTo(el, from, to));
  });

  return () => {
    tweens.forEach((t) => t.kill());
  };
};

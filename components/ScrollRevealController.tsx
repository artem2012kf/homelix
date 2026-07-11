"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const revealSelector = [
  "main > section",
  ".section-heading",
  ".filter-panel",
  ".catalog-filter-panel",
  ".apartment-card",
  ".furniture-card",
  ".chat-card",
  ".available-list-card",
  ".account-card",
  ".account-list-section",
  ".workflow-panel article",
  ".contacts-grid article",
  ".advantages-card",
  ".plan-card",
  ".room-info-card",
  ".purchase-card",
  ".hall-cart-summary"
].join(",");

export function ScrollRevealController() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lastScrollY = window.scrollY;
    let direction: "up" | "down" = "down";
    let frameId = 0;

    const updateDirection = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        const next = window.scrollY;
        if (Math.abs(next - lastScrollY) > 2) direction = next > lastScrollY ? "down" : "up";
        lastScrollY = next;
        document.documentElement.dataset.scrollDirection = direction;
        frameId = 0;
      });
    };

    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector))
      .filter((element) => !element.closest(".site-header") && !element.closest("[role='dialog']"));

    elements.forEach((element, index) => {
      element.classList.add("hall-scroll-reveal");
      element.style.setProperty("--hall-reveal-delay", `${Math.min(index % 4, 3) * 55}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const rect = entry.boundingClientRect;

          if (entry.isIntersecting) {
            element.classList.add("is-revealed");
            element.classList.remove("is-hiding-below");
            return;
          }

          if (direction === "up" && rect.top > window.innerHeight * 0.62) {
            element.classList.remove("is-revealed");
            element.classList.add("is-hiding-below");
          } else if (direction === "down" && rect.top > window.innerHeight) {
            element.classList.remove("is-revealed");
            element.classList.remove("is-hiding-below");
          }
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: [0, 0.08, 0.22]
      }
    );

    elements.forEach((element) => observer.observe(element));
    window.addEventListener("scroll", updateDirection, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateDirection);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [pathname]);

  return null;
}

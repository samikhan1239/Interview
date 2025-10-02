"use client"

import { useEffect, useRef } from "react"

// Generic useInView hook with type-safe return
export function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.18 }
) {
  const ref = useRef<T>(null) // strictly typed

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onObserve = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          el.classList.add("in-view")
        } else {
          el.classList.remove("in-view")
        }
      })
    }

    const io = new IntersectionObserver(onObserve, options)
    io.observe(el)

    return () => {
      io.disconnect()
    }
  }, [options])

  return ref
}

'use client'

import { useEffect, useRef } from 'react'

export function useOnMount(task: () => void | Promise<void>) {
  const taskRef = useRef(task)

  useEffect(() => {
    taskRef.current = task
  })

  useEffect(() => {
    queueMicrotask(() => {
      void taskRef.current()
    })
  }, [])
}

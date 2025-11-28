import { useEffect, useRef } from 'react'

/**
 * Hook to run a callback at an interval
 * @param {function} callback - Function to call
 * @param {number|null} delay - Delay in ms (null to pause)
 */
export function useInterval(callback, delay) {
  const savedCallback = useRef()

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval
  useEffect(() => {
    function tick() {
      savedCallback.current()
    }

    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

export default useInterval

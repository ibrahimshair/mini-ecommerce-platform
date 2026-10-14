import { useEffect } from "react";

let activeModalCount = 0;
let previousHtmlOverflow = "";
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";

/**
 * useScrollLock
 * Locks background scrolling on both <html> and <body> when a modal or dialog is open.
 * Prevents:
 * 1. Horizontal layout shift caused by scrollbar disappearing.
 * 2. Vertical background page scrolling / jumping when scrolling inside or over a modal.
 * 3. Gracefully supports nested modals with reference counting.
 *
 * @param {boolean} isLocked Whether the scroll should currently be locked.
 */
export function useScrollLock(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    if (activeModalCount === 0) {
      // 1. Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // 2. Save previous styles
      previousHtmlOverflow = document.documentElement.style.overflow;
      previousBodyOverflow = document.body.style.overflow;
      previousBodyPaddingRight = document.body.style.paddingRight;

      // 3. Add modal-open class
      document.documentElement.classList.add("modal-open");
      document.body.classList.add("modal-open");

      // 4. Lock overflow on both html and body
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      // 5. Compensate scrollbar width to prevent horizontal shifting
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    activeModalCount++;

    return () => {
      activeModalCount--;
      if (activeModalCount <= 0) {
        activeModalCount = 0;
        document.documentElement.classList.remove("modal-open");
        document.body.classList.remove("modal-open");
        document.documentElement.style.overflow = previousHtmlOverflow;
        document.body.style.overflow = previousBodyOverflow;
        document.body.style.paddingRight = previousBodyPaddingRight;
      }
    };
  }, [isLocked]);
}

export default useScrollLock;

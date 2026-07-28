import { useEffect, useRef } from 'react';

interface UseUsbBarcodeScannerOptions {
  excludeIds?: string[];
}

/**
 * Custom hook to detect scans from USB barcode readers (which emulate keyboards).
 * Accumulates rapid keystrokes and fires callback when Enter/Tab or sequence end occurs.
 */
export function useUsbBarcodeScanner(
  onScan: (barcode: string) => void,
  options?: UseUsbBarcodeScannerOptions
) {
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const excludeIds = options?.excludeIds || [];
  
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key combinations with Control, Alt, or Command
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const isEnter = e.key === 'Enter' || e.key === 'NumpadEnter' || e.key === 'Tab';

      if (isEnter) {
        const barcode = bufferRef.current.trim().replace(/[\r\n]/g, '');
        
        if (barcode.length >= 2) {
          e.preventDefault();
          e.stopPropagation();

          bufferRef.current = '';
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          cleanActiveElement(barcode);
          onScanRef.current(barcode);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // Buffer printable characters (length of 1)
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Reset buffer if no key arrives within 250ms (differentiates fast human typing vs barcode stream)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 250);
      }
    };

    const cleanActiveElement = (barcode: string) => {
      const activeEl = document.activeElement;
      if (!activeEl) return;

      if (excludeIds.includes(activeEl.id)) {
        return;
      }

      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
        const val = activeEl.value;
        if (val.endsWith(barcode)) {
          const newVal = val.slice(0, -barcode.length);
          
          const prototype = activeEl instanceof HTMLInputElement 
            ? HTMLInputElement.prototype 
            : HTMLTextAreaElement.prototype;
          
          const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (nativeValueSetter) {
            nativeValueSetter.call(activeEl, newVal);
            const event = new Event('input', { bubbles: true });
            activeEl.dispatchEvent(event);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [excludeIds]);
}

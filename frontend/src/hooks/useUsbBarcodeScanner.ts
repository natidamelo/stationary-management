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
  const lastKeyTimeRef = useRef<number>(0);
  const firstKeyTimeRef = useRef<number>(0);
  const excludeIds = options?.excludeIds || [];
  
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
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

    const processScan = (rawBarcode: string) => {
      const barcode = rawBarcode.trim().replace(/[\r\n]/g, '');
      if (barcode.length >= 2) {
        cleanActiveElement(barcode);
        onScanRef.current(barcode);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key combinations with Control, Alt, or Command
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const now = Date.now();
      const isEnter = e.key === 'Enter' || e.key === 'NumpadEnter' || e.key === 'Tab';

      if (isEnter) {
        if (bufferRef.current.length >= 2) {
          e.preventDefault();
          e.stopPropagation();

          const barcode = bufferRef.current;
          bufferRef.current = '';
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          processScan(barcode);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // Buffer printable characters (length of 1)
      if (e.key.length === 1) {
        if (bufferRef.current.length === 0) {
          firstKeyTimeRef.current = now;
        }
        bufferRef.current += e.key;
        lastKeyTimeRef.current = now;

        // Reset buffer if typing pauses
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          const buffer = bufferRef.current;
          const charCount = buffer.length;
          const totalDuration = lastKeyTimeRef.current - firstKeyTimeRef.current;
          const avgPerChar = charCount > 1 ? totalDuration / (charCount - 1) : 999;

          // If scanned rapidly (e.g. 4+ chars scanned with avg < 90ms per keypress),
          // commit barcode scan automatically even if scanner lacks Enter suffix
          if (charCount >= 4 && (avgPerChar < 90 || totalDuration < 150)) {
            processScan(buffer);
          }
          bufferRef.current = '';
        }, 180);
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


import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';

export interface ParsedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selected: boolean;
}

interface UseReceiptOCRResult {
  scanning: boolean;
  progress: number;
  rawText: string;
  detectedTotal: number | null;
  parsedItems: ParsedItem[];
  performOCR: (imageDataUrl: string) => Promise<void>;
  setDetectedTotal: React.Dispatch<React.SetStateAction<number | null>>;
  setParsedItems: React.Dispatch<React.SetStateAction<ParsedItem[]>>;
  resetOCR: () => void;
}

// Preprocess image for better OCR
const preprocessImage = (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Convert to grayscale and boost contrast
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        // Contrast enhancement
        const contrast = 1.4;
        const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
        const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        data[i] = newGray;
        data[i + 1] = newGray;
        data[i + 2] = newGray;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = imageDataUrl;
  });
};

// Parse individual items from receipt text
const parseItems = (text: string): ParsedItem[] => {
  const lines = text.split('\n');
  const items: ParsedItem[] = [];
  
  // Skip keywords that indicate totals/non-items
  const skipKeywords = [
    'TOTALT', 'TOTAL', 'SUMMA', 'SUM', 'ATT BETALA', 'MOMS', 'VAT', 
    'KONTANT', 'KORT', 'CARD', 'CASH', 'RABATT', 'DISCOUNT', 'CHANGE',
    'VÄXEL', 'KVITTO', 'RECEIPT', 'TACK', 'THANK', 'VÄLKOMMEN', 'WELCOME',
    'ORG', 'NR', 'TEL', 'DATUM', 'DATE', 'TID', 'TIME', 'KASSA', 'BUTIK'
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 3) continue;

    // Skip lines with keywords
    const upperLine = trimmedLine.toUpperCase();
    if (skipKeywords.some(kw => upperLine.includes(kw))) continue;

    let itemName = '';
    let price = 0;
    let quantity = 1;

    // Try to extract quantity prefix like "2 x " or "2x " or "2 st "
    const qtyPrefixMatch = trimmedLine.match(/^(\d+)\s*[xX×*]\s*(.+)/);
    const qtySuffixMatch = trimmedLine.match(/(.+?)\s+(\d+)\s*(st|pcs|pc)\s+/i);

    let lineToProcess = trimmedLine;

    if (qtyPrefixMatch) {
      quantity = parseInt(qtyPrefixMatch[1]);
      lineToProcess = qtyPrefixMatch[2];
    } else if (qtySuffixMatch) {
      quantity = parseInt(qtySuffixMatch[2]);
      lineToProcess = qtySuffixMatch[1] + ' ' + lineToProcess.slice(qtySuffixMatch[0].length);
    }

    // Extract price from end of line
    const priceMatch = lineToProcess.match(/(-?\d{1,5})[,.](\d{2})\s*(kr|sek)?\s*$/i);
    
    if (priceMatch) {
      const priceValue = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`);
      
      // Skip negative values (discounts) and unreasonable prices
      if (priceValue <= 0 || priceValue > 10000) continue;

      price = priceValue;
      itemName = lineToProcess.slice(0, priceMatch.index).trim();

      // Clean up item name
      itemName = itemName
        .replace(/[\.\-_]+$/, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Skip if name is too short or looks like a code
      if (itemName.length < 2) continue;
      if (/^\d+$/.test(itemName)) continue;
      if (/^[A-Z0-9]{10,}$/.test(itemName)) continue;

      items.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: itemName,
        price,
        quantity,
        selected: true,
      });
    }
  }

  return items;
};

// Parse total from receipt
const parseTotal = (text: string): number | null => {
  const lines = text.toUpperCase().split('\n');
  const totalKeywords = ['TOTALT', 'ATT BETALA', 'SUMMA', 'TOTAL', 'SUM'];
  
  for (const line of lines) {
    const hasKeyword = totalKeywords.some(keyword => line.includes(keyword));
    if (hasKeyword) {
      const numberMatch = line.match(/(\d{1,}[\s,.]?\d{2})\s*(KR|SEK)?$/i) 
                      || line.match(/(\d+[\s,.]?\d{2})/);
      if (numberMatch) {
        const numStr = numberMatch[1].replace(/\s/g, '').replace(',', '.');
        const amount = parseFloat(numStr);
        if (!isNaN(amount) && amount > 0) {
          return amount;
        }
      }
    }
  }

  let maxAmount = 0;
  const pricePattern = /(\d{2,})[,.](\d{2})/g;
  let match;
  while ((match = pricePattern.exec(text)) !== null) {
    const amount = parseFloat(`${match[1]}.${match[2]}`);
    if (amount > maxAmount && amount < 50000) {
      maxAmount = amount;
    }
  }

  return maxAmount > 0 ? maxAmount : null;
};

export function useReceiptOCR(): UseReceiptOCRResult {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState('');
  const [detectedTotal, setDetectedTotal] = useState<number | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);

  const performOCR = useCallback(async (imageDataUrl: string) => {
    setScanning(true);
    setProgress(0);

    try {
      // Preprocess image for better OCR (but don't change the displayed image)
      const processedImage = await preprocessImage(imageDataUrl);
      
      const worker = await createWorker('swe+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Apply additional options for better receipt scanning
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789.,:-/() ',
        tessedit_pageseg_mode: 6 as any, // Assume uniform block of text
      });

      // Use preprocessed image for better OCR accuracy
      const { data: { text } } = await worker.recognize(processedImage);
      await worker.terminate();

      setRawText(text);
      
      const total = parseTotal(text);
      setDetectedTotal(total);

      const items = parseItems(text);
      setParsedItems(items);
    } catch (error) {
      console.error('OCR failed:', error);
      setRawText('OCR failed - please enter items manually');
    } finally {
      setScanning(false);
    }
  }, []);

  const resetOCR = useCallback(() => {
    setRawText('');
    setDetectedTotal(null);
    setParsedItems([]);
    setProgress(0);
  }, []);

  return {
    scanning,
    progress,
    rawText,
    detectedTotal,
    parsedItems,
    performOCR,
    setDetectedTotal,
    setParsedItems,
    resetOCR,
  };
}

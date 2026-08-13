import React, { createContext, useContext, useState } from "react";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import BarcodeResultModal from "../components/BarcodeResultModal";
import { fetchAllDraws, DrawResult } from "../api/lotteryApi";

interface ScannerContextType {
  openScanner: (targetLotteryCode?: string) => void;
  closeScanner: () => void;
}

const ScannerContext = createContext<ScannerContextType>({
  openScanner: () => {},
  closeScanner: () => {},
});

export const useScanner = () => useContext(ScannerContext);

export const ScannerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isBarcodeResultOpen, setIsBarcodeResultOpen] = useState(false);
  const [targetCode, setTargetCode] = useState<string | undefined>(undefined);
  const [allDraws, setAllDraws] = useState<DrawResult[]>([]);

  const openScanner = (targetLotteryCode?: string) => {
    setTargetCode(targetLotteryCode);
    fetchAllDraws()
      .then(setAllDraws)
      .catch(() => setAllDraws([]));
    setIsScannerOpen(true);
  };

  const closeScanner = () => {
    setIsScannerOpen(false);
  };

  const handleBarcodeScanned = (scannedValue: string) => {
    setIsScannerOpen(false);
    setScannedBarcode(scannedValue);
    setIsBarcodeResultOpen(true);
  };

  return (
    <ScannerContext.Provider value={{ openScanner, closeScanner }}>
      {children}
      <BarcodeScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <BarcodeResultModal
        visible={isBarcodeResultOpen}
        scannedBarcode={scannedBarcode}
        availableDraws={allDraws}
        targetLotteryCode={targetCode}
        onClose={() => setIsBarcodeResultOpen(false)}
        onRescan={() => {
          setIsBarcodeResultOpen(false);
          setIsScannerOpen(true);
        }}
      />
    </ScannerContext.Provider>
  );
};

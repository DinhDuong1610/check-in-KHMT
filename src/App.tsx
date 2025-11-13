import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './App.css';

interface ApiResponse {
  status: 'success' | 'warning' | 'error';
  message: string;
}

const SCANNING_STATE = "SCANNING";
const PAUSED_STATE = "PAUSED";

function App() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const GOOGLE_SCRIPT_API_URL = import.meta.env.VITE_API_URL;

  const onScanSuccess = (decodedText: string) => {
    if (decodedText !== scanResult && !isLoading) {
      setIsLoading(true);
      setScanResult(decodedText);

      try {
        if (scannerRef.current && scannerRef.current.getState().toString() === SCANNING_STATE) {
          scannerRef.current.pause();
        }
      } catch (e) {
        console.warn("Lỗi khi tạm dừng máy quét:", e);
      }

      fetch(`${GOOGLE_SCRIPT_API_URL}?id=${decodedText}`)
        .then(response => response.json())
        .then((data: ApiResponse) => {
          setApiResponse(data);
          setIsLoading(false);
          setTimeout(() => setApiResponse(null), 5000);
        })
        .catch(error => {
          console.error('Error fetching API:', error);
          setApiResponse({ status: "error", message: "Lỗi kết nối tới API." });
          setIsLoading(false);
          setTimeout(() => setApiResponse(null), 1000);
        })
        .finally(() => {
          try {
            if (scannerRef.current && scannerRef.current.getState().toString() === PAUSED_STATE) {
              scannerRef.current.resume();
            }
          } catch (e) {
            console.warn("Lỗi khi chạy lại máy quét:", e);
          }
        });
    }
  };

  const onScanFailure = () => {
  };

  useEffect(() => {
    if (!scannerRef.current) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = html5QrcodeScanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode-scanner.", error);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  const getResponseClass = () => {
    if (!apiResponse) return 'hidden';
    return `response-message ${apiResponse.status}`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hệ thống Check-in Đại hội LCĐ KHMT</h1>

        <div id="qr-reader"></div>

        <div className="result-container">
          {isLoading && <div className="loading-spinner">Đang xử lý...</div>}

          {apiResponse && (
            <div className={getResponseClass()}>
              <p>{apiResponse.message}</p>
            </div>
          )}

          {/* {scanResult && !apiResponse && !isLoading && (
            <p>Đã quét mã: {scanResult}</p>
          )} */}
        </div>
      </header>
    </div>
  );
}

export default App;
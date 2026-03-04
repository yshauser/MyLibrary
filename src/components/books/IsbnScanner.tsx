import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CameraAlt as CameraIcon } from '@mui/icons-material';

interface IsbnScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (isbn: string) => void;
}

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

function extractIsbn(text: string): string | null {
  // First try: find hyphenated ISBN patterns like 978-965-526-123-4 or 0-00-000000-0
  const hyphenated = text.match(/\b(\d[\d-]{10,17}\d)\b/g);
  if (hyphenated) {
    for (const candidate of hyphenated) {
      const digits = candidate.replace(/-/g, '');
      if (digits.length === 13 || digits.length === 10) {
        return digits;
      }
    }
  }
  // Second try: find 13 or 10 consecutive digits
  const match = text.match(/\b(\d{13}|\d{10})\b/);
  if (match) return match[1];
  // Third try: remove all non-digits from ISBN-labelled line
  const isbnLine = text.split('\n').find(l => /isbn/i.test(l));
  if (isbnLine) {
    const digits = isbnLine.replace(/[^0-9]/g, '');
    if (digits.length === 13 || digits.length === 10) return digits;
  }
  return null;
}

export default function IsbnScanner({ open, onClose, onScan }: IsbnScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [retryMsg, setRetryMsg] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const startCamera = async () => {
    setError('');
    setRetryMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      setError('לא ניתן לגשת למצלמה. אנא אשר הרשאת מצלמה ונסה שוב.');
    }
  };

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setError('');
      setRetryMsg('');
      setScanning(false);
    }
    return () => stopCamera();
  }, [open]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);
    setRetryMsg('');
    setError('');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];

    const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      setError('מפתח Vision API חסר בהגדרות הסביבה.');
      setScanning(false);
      return;
    }

    try {
      const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error('Vision API error body:', errBody);
        throw new Error(`Vision API error: ${response.status} — ${errBody}`);
      }

      const data = await response.json();
      const fullText: string =
        data.responses?.[0]?.fullTextAnnotation?.text ?? '';
      console.log('OCR raw text:', fullText);

      const isbn = extractIsbn(fullText);
      if (isbn) {
        onScan(isbn);
        onClose();
      } else {
        setRetryMsg('לא זוהה מספר ISBN — נסה שוב, וודא שהמספרים נראים בבירור');
      }
    } catch (e) {
      console.error(e);
      setError('שגיאה בתקשורת עם שירות ה-OCR. נסה שוב.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>סריקת ISBN מהמצלמה</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          {error ? (
            <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
          ) : (
            <>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  bgcolor: 'black',
                  borderRadius: 1,
                  overflow: 'hidden',
                  minHeight: 240,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', display: 'block' }}
                />
                {!cameraReady && (
                  <Box sx={{ position: 'absolute' }}>
                    <CircularProgress color="inherit" sx={{ color: 'white' }} />
                  </Box>
                )}
              </Box>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {retryMsg && (
                <Typography color="warning.main" variant="body2" textAlign="center">
                  {retryMsg}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" textAlign="center">
                כוון את המצלמה לאזור ה-ISBN ולחץ "צלם"
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">ביטול</Button>
        {!error && (
          <Button
            onClick={handleCapture}
            variant="contained"
            startIcon={scanning ? <CircularProgress size={16} color="inherit" /> : <CameraIcon />}
            disabled={scanning || !cameraReady}
          >
            {scanning ? 'מעבד...' : 'צלם'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

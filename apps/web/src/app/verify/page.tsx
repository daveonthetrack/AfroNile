'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  History, 
  ArrowRight, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Keyboard
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface VerificationResult {
  approved: boolean;
  error?: 'INVALID_FORMAT' | 'STRUCTURAL_AUTHENTICITY_FAILED' | 'TICKET_NOT_FOUND' | 'ALREADY_SCANNED' | 'CONCURRENT_SCAN_CONFLICT' | 'INTERNAL_SERVER_ERROR';
  message?: string;
  ticketId?: string;
  scannedAt?: string;
  event?: {
    title: string;
    venueName: string;
    eventDate: string;
    artistName: string;
  };
  holder?: {
    email: string;
  };
  holderEmail?: string; // from error responses
  eventTitle?: string;  // from error responses
}

interface ScanLog {
  hash: string;
  timestamp: Date;
  status: 'APPROVED' | 'DENIED' | 'ERROR';
  message: string;
  holder?: string;
}

export default function TicketVerificationPage() {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [qrHash, setQrHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanLog[]>([]);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);

  const handleVerify = async (hashToVerify: string) => {
    const targetHash = hashToVerify.trim();
    if (!targetHash) return;

    setVerifying(true);
    setResult(null);

    try {
      const response = await fetch('/api/tickets/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCodeHash: targetHash }),
      });

      const data: VerificationResult = await response.json();
      setResult(data);

      // Log to history
      const logStatus = data.approved ? 'APPROVED' : 'DENIED';
      const logMessage = data.approved 
        ? `Access Granted: ${data.event?.title}` 
        : `Access Denied: ${data.message || data.error}`;
      const holderInfo = data.holder?.email || data.holderEmail || '';

      setScanHistory(prev => [
        {
          hash: targetHash,
          timestamp: new Date(),
          status: logStatus,
          message: logMessage,
          holder: holderInfo,
        },
        ...prev
      ]);

      // If approved, optionally play confirmation sound/vibe here

    } catch (err: any) {
      setResult({
        approved: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Network error or server failed to respond.'
      });
      setScanHistory(prev => [
        {
          hash: targetHash,
          timestamp: new Date(),
          status: 'ERROR',
          message: 'Network verification failed.',
        },
        ...prev
      ]);
    } finally {
      setVerifying(false);
    }
  };

  // Start html5-qrcode scanner
  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;
      setScannerActive(true);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Stop scanner after successful read to prevent duplicate triggers
          stopScanner();
          handleVerify(decodedText);
        },
        () => {
          // Silent noise handler
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setScannerActive(false);
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    } else {
      setScannerActive(false);
    }
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err: any) => console.error('Cleanup stop failed', err));
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-8 select-none text-left pt-24">
      {/* Header Info */}
      <div className="space-y-2 border-b border-white/5 pb-6">
        <h1 className="text-3xl md:text-4xl font-serif font-black text-white tracking-wide flex items-center gap-3">
          <QrCode className="h-8 w-8 text-primary" />
          <span>TICKET VALIDATOR</span>
        </h1>
        <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">
          Concert Gate Access Control • Cryptographic SHA-256 Signatures
        </p>
      </div>

      {/* Main Grid: Scanner Input and Results */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        
        {/* Left Column: Scanner Inputs */}
        <div className="md:col-span-3 space-y-6">
          <div className="glass-card rounded-[2rem] p-6 space-y-6 shadow-2xl relative overflow-hidden border border-white/5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Verification Gate
              </h2>
              {/* Tabs */}
              <div className="flex rounded-full bg-zinc-950 p-1 border border-white/5">
                <button
                  onClick={() => { setActiveTab('camera'); stopScanner(); }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5",
                    activeTab === 'camera' ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                  )}
                >
                  <Camera className="h-3 w-3" />
                  <span>Camera</span>
                </button>
                <button
                  onClick={() => { setActiveTab('manual'); stopScanner(); }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5",
                    activeTab === 'manual' ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                  )}
                >
                  <Keyboard className="h-3 w-3" />
                  <span>Manual</span>
                </button>
              </div>
            </div>

            {activeTab === 'camera' ? (
              <div className="space-y-4">
                <div 
                  id="qr-reader" 
                  className={cn(
                    "w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden border border-dashed flex flex-col items-center justify-center relative bg-zinc-950/60 transition-colors duration-300",
                    scannerActive ? "border-primary/40" : "border-white/5"
                  )}
                >
                  {!scannerActive && (
                    <div className="text-center space-y-4 p-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse">
                        <Camera className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-white uppercase font-mono">Camera Scanner Inactive</h3>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider max-w-[200px] mx-auto">
                          Grant camera access to verify tickets in real-time
                        </p>
                      </div>
                      <button
                        onClick={startScanner}
                        className="h-10 px-6 rounded-full bg-primary hover:bg-primary/95 text-white font-bold text-[10px] uppercase tracking-wider transition active:scale-95 shadow-md shadow-primary/20"
                      >
                        Activate Camera
                      </button>
                    </div>
                  )}
                </div>

                {scannerActive && (
                  <button
                    onClick={stopScanner}
                    className="w-full h-11 border border-red-500/20 hover:bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-xl transition"
                  >
                    Deactivate Camera
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="ticket-hash" className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest font-mono block">
                    TICKET SIGNATURE HASH (SHA-256)
                  </label>
                  <div className="relative">
                    <input
                      id="ticket-hash"
                      type="text"
                      placeholder="PASTE 64-CHARACTER SIGNATURE HASH..."
                      value={qrHash}
                      onChange={(e) => setQrHash(e.target.value)}
                      className="w-full h-12 bg-zinc-950 border border-white/5 rounded-xl px-4 pr-12 text-xs font-mono text-white focus:outline-none focus:border-primary placeholder-zinc-700 transition"
                    />
                    <button
                      onClick={() => handleVerify(qrHash)}
                      disabled={verifying || !qrHash}
                      className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed transition"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerify(qrHash)}
                    disabled={verifying || !qrHash}
                    className="flex-1 h-11 bg-primary hover:bg-primary/95 text-[10px] font-bold uppercase tracking-wider text-white rounded-full flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 transition active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'Verifying...' : 'Submit Hash'}
                  </button>
                  <button
                    onClick={() => { setQrHash(''); setResult(null); }}
                    className="px-6 h-11 border border-white/5 hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 rounded-full transition"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Scan Result Alert View */}
        <div className="md:col-span-2 space-y-6 h-full">
          <div className="glass-card rounded-[2rem] p-6 border border-white/5 min-h-[340px] flex flex-col justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
              <span>Result Panel</span>
            </h2>

            <div className="flex-1 flex flex-col items-center justify-center py-6">
              {!result ? (
                <div className="text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-full border border-dashed border-zinc-800 flex items-center justify-center text-zinc-700 animate-pulse">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] text-zinc-550 uppercase tracking-wider font-mono">Awaiting verification scan...</p>
                </div>
              ) : result.approved ? (
                // Approved View
                <div className="w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-bounce">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-emerald-500 tracking-widest uppercase font-mono">Access Granted</span>
                    <h3 className="text-md font-serif font-bold text-white truncate">{result.event?.artistName} — {result.event?.title}</h3>
                    <p className="text-[10px] text-zinc-550 uppercase font-mono tracking-wider truncate">{result.event?.venueName}</p>
                  </div>
                  <div className="bg-zinc-950/80 p-4 rounded-2xl border border-emerald-500/10 text-left text-[10px] space-y-2 font-mono uppercase">
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-zinc-650">Ticket Holder</span>
                      <span className="font-bold text-white truncate max-w-[150px]">{result.holder?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-650">Scanned At</span>
                      <span className="font-bold text-zinc-400 tabular-nums">
                        {result.scannedAt ? new Date(result.scannedAt).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Denied View
                <div className="w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                    {result.error === 'ALREADY_SCANNED' ? (
                      <AlertTriangle className="h-8 w-8 animate-pulse" />
                    ) : (
                      <XCircle className="h-8 w-8" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-red-500 tracking-widest uppercase font-mono">Access Denied</span>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{result.message || 'Verification Failed'}</h3>
                    <p className="text-[8px] text-zinc-600 font-mono">Code: {result.error}</p>
                  </div>

                  {result.error === 'ALREADY_SCANNED' && (
                    <div className="bg-zinc-950/80 p-4 rounded-2xl border border-red-500/10 text-left text-[10px] space-y-2 font-mono uppercase">
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="text-zinc-650">First Scanned</span>
                        <span className="font-bold text-red-400 tabular-nums">
                          {result.scannedAt ? new Date(result.scannedAt).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-650">Ticket Holder</span>
                        <span className="font-bold text-zinc-400 truncate max-w-[150px]">{result.holderEmail}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-[8px] text-zinc-700 text-center border-t border-white/5 pt-3 font-mono uppercase tracking-widest">
              Enforced via Atomic Gate Database Locks
            </div>
          </div>
        </div>
      </div>

      {/* History Log Section */}
      <div className="glass-card border border-white/5 rounded-[2rem] p-6 space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <span>Local Session Log</span>
        </h2>
        
        {scanHistory.length === 0 ? (
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-mono py-4 text-center">No scans recorded in this browser session.</p>
        ) : (
          <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-zinc-950 max-h-[250px] overflow-y-auto">
            {scanHistory.map((log, index) => (
              <div key={index} className="p-3.5 flex items-center justify-between text-[11px] hover:bg-zinc-900/40 transition">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    log.status === 'APPROVED' && 'bg-emerald-500 shadow-lg shadow-emerald-500/50',
                    log.status === 'DENIED' && 'bg-red-500 shadow-lg shadow-red-500/50',
                    log.status === 'ERROR' && 'bg-amber-500'
                  )} />
                  <div className="min-w-0">
                    <p className="font-bold text-white uppercase truncate max-w-[300px] md:max-w-xl">{log.message}</p>
                    <p className="text-[9px] text-zinc-600 font-mono truncate max-w-[200px] mt-0.5">Hash: {log.hash}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <p className="text-[9px] text-zinc-400 font-semibold tabular-nums">{log.timestamp.toLocaleTimeString()}</p>
                  {log.holder && <p className="text-[8px] text-zinc-650 truncate max-w-[100px] mt-0.5">{log.holder}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

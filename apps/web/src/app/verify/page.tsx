'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  History, 
  ArrowRight, 
  Search, 
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle
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
  const [qrHash, setQrHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanLog[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // List of mock ticket hashes from the database seed to help testing
  const testHashes = [
    { label: "Valid Ticket A (Unscanned)", hash: "e29e92823812234f9a0c8b671aef290e29e92823812234f9a0c8b671aef290a1" },
    { label: "Valid Ticket B (Unscanned)", hash: "b51aef290e29e92823812234f9a0c8b67e29e92823812234f9a0c8b671aef290b2" },
    { label: "Valid Ticket C (Unscanned)", hash: "c6aef290a29e92823812234f9a0c8b671aef290e29e92823812234f9a0c8b67c3" },
    { label: "Invalid Format Hash", hash: "invalid-hash-12345" },
    { label: "Non-Existent Valid Format Hash", hash: "0000000000000000000000000000000000000000000000000000000000000000" }
  ];

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

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setQrHash(text);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Header Info */}
      <div className="text-center md:text-left space-y-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center md:justify-start gap-2.5">
          <QrCode className="h-8 w-8 text-primary" />
          <span>Ticket Scanner Dashboard</span>
        </h1>
        <p className="text-sm md:text-base text-zinc-400 font-light">
          Staff Console: cryptographically verify ticket validity and prevent double-entry at gate checks.
        </p>
      </div>

      {/* Main Grid: Scanner Input and Results */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Left Column: Scanner Inputs */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CompassIcon className="h-5 w-5 text-zinc-400" />
              <span>Simulate Scan</span>
            </h2>
            
            <div className="space-y-3">
              <label htmlFor="ticket-hash" className="text-xs text-zinc-500 font-semibold block">TICKET SIGNATURE HASH (SHA-256)</label>
              <div className="relative">
                <input
                  id="ticket-hash"
                  type="text"
                  placeholder="Paste 64-character hexadecimal hash..."
                  value={qrHash}
                  onChange={(e) => setQrHash(e.target.value)}
                  className="w-full h-12 bg-zinc-950 border border-white/10 rounded-lg px-4 pr-10 text-sm font-mono text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-zinc-600 transition"
                />
                <button
                  onClick={() => handleVerify(qrHash)}
                  disabled={verifying || !qrHash}
                  className="absolute right-2 top-2 h-8 w-8 rounded bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed transition"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleVerify(qrHash)}
                disabled={verifying || !qrHash}
                className="flex-1 h-11 bg-primary hover:bg-primary/95 text-sm font-semibold text-white rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 transition active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Submit Verification'}
              </button>
              <button
                onClick={() => { setQrHash(''); setResult(null); }}
                className="px-4 h-11 border border-white/5 hover:bg-white/5 text-sm font-medium text-zinc-400 rounded-lg transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Test Hashes Helper Box */}
          <div className="bg-zinc-950 border border-white/5 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Test Signatures (Seed DB)</h3>
              <span className="text-[10px] text-zinc-600">Click to load & verify</span>
            </div>
            <div className="space-y-2">
              {testHashes.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => copyToClipboard(item.hash, idx)}
                  className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-white/5 hover:border-zinc-700/50 hover:bg-zinc-900 cursor-pointer transition text-xs font-mono group"
                >
                  <div className="truncate pr-4 space-y-0.5">
                    <span className="text-zinc-400 font-semibold block text-[10px]">{item.label}</span>
                    <span className="text-zinc-500 block truncate max-w-[280px]">{item.hash}</span>
                  </div>
                  <button className="h-6 w-6 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center border border-white/5 shrink-0 group-hover:bg-primary group-hover:text-white transition">
                    {copiedIndex === idx ? (
                      <ClipboardCheck className="h-3.5 w-3.5" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result Alert View */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-zinc-900/30 border border-white/5 p-6 rounded-2xl h-full flex flex-col justify-between min-h-[300px]">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-zinc-400" />
              <span>Result Panel</span>
            </h2>

            <div className="flex-1 flex flex-col items-center justify-center py-6">
              {!result ? (
                <div className="text-center space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-zinc-500 font-light">Awaiting ticket scan input...</p>
                </div>
              ) : result.approved ? (
                // Approved View
                <div className="w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-bounce">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-500 tracking-widest uppercase">Access Granted</span>
                    <h3 className="text-lg font-bold text-white truncate">{result.event?.artistName} - {result.event?.title}</h3>
                    <p className="text-xs text-zinc-400 truncate">{result.event?.venueName}</p>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-emerald-500/10 text-left text-xs space-y-2">
                    <div className="flex justify-between border-b border-white/5 pb-1.5">
                      <span className="text-zinc-500">Ticket Holder</span>
                      <span className="font-semibold text-white truncate max-w-[150px]">{result.holder?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Scanned At</span>
                      <span className="font-semibold text-zinc-400 tabular-nums">
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
                      <AlertTriangle className="h-8 w-8" />
                    ) : (
                      <XCircle className="h-8 w-8" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-red-500 tracking-widest uppercase">Access Denied</span>
                    <h3 className="text-base font-bold text-white">{result.message || 'Verification Failed'}</h3>
                    <p className="text-xs text-zinc-500 font-mono">Code: {result.error}</p>
                  </div>

                  {result.error === 'ALREADY_SCANNED' && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-red-500/10 text-left text-xs space-y-2">
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="text-zinc-500">First Scanned</span>
                        <span className="font-semibold text-red-400 tabular-nums">
                          {result.scannedAt ? new Date(result.scannedAt).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Ticket Holder</span>
                        <span className="font-semibold text-zinc-400 truncate max-w-[150px]">{result.holderEmail}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-[10px] text-zinc-600 text-center border-t border-white/5 pt-3">
              Prisma atomic updates enforce single-scan verification.
            </div>
          </div>
        </div>
      </div>

      {/* History Log Section */}
      <div className="bg-zinc-900/10 border border-white/5 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="h-5 w-5 text-zinc-400" />
          <span>Local Session Log</span>
        </h2>
        
        {scanHistory.length === 0 ? (
          <p className="text-xs text-zinc-600 italic py-4 text-center">No scans recorded in this browser session.</p>
        ) : (
          <div className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/5 bg-zinc-950 max-h-[250px] overflow-y-auto">
            {scanHistory.map((log, index) => (
              <div key={index} className="p-3 flex items-center justify-between text-xs hover:bg-zinc-900/40 transition">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    log.status === 'APPROVED' && 'bg-emerald-500 shadow-lg shadow-emerald-500/50',
                    log.status === 'DENIED' && 'bg-red-500 shadow-lg shadow-red-500/50',
                    log.status === 'ERROR' && 'bg-amber-500'
                  )} />
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate max-w-[300px] md:max-w-xl">{log.message}</p>
                    <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px] mt-0.5">Hash: {log.hash}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-zinc-400 font-semibold tabular-nums">{log.timestamp.toLocaleTimeString()}</p>
                  {log.holder && <p className="text-[9px] text-zinc-500 truncate max-w-[100px] mt-0.5">{log.holder}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple internal icon to avoid imports
function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

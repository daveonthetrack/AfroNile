'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  HeartHandshake, 
  Users, 
  Ticket, 
  RefreshCw, 
  Search, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Download,
  Calendar,
  X,
  FileCode,
  Tag,
  Clock,
  CheckCircle2,
  Wrench,
  Maximize2,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Metrics {
  totalOrders: number;
  paidOrders: number;
  totalRevenueCents: number;
  totalDonationsCount: number;
  totalDonationsCents: number;
  totalUsers: number;
  totalTickets: number;
  scannedTickets: number;
}

interface OrderItem {
  id: string;
  productTitle: string;
  sku: string;
  quantity: number;
  priceCents: number;
}

interface RecentOrder {
  id: string;
  email: string;
  amountCents: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'SHIPPED' | 'REFUNDED';
  createdAt: string;
  items: OrderItem[];
}

interface RecentDonation {
  id: string;
  email: string;
  amountCents: number;
  comment: string;
  eventTitle: string;
  createdAt: string;
}

interface InventoryProduct {
  id: string;
  title: string;
  sku: string;
  type: 'MERCHANDISE' | 'TICKET_DIGITAL' | 'VIP_EXPERIENCE';
  stockQuantity: number;
  priceCents: number;
}

interface ChartDataPoint {
  date: string;
  sales: number;
  donations: number;
}

interface TicketRecord {
  id: string;
  qrCodeHash: string;
  isScanned: boolean;
  scannedAt: string | null;
  eventTitle: string;
  email: string;
}

export default function AdminDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [timeSeries, setTimeSeries] = useState<ChartDataPoint[]>([]);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'donations' | 'inventory' | 'tickets' | 'events' | 'news'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Tour Events & News States
  const [events, setEvents] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  // Product Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    sku: '',
    priceCents: 0,
    stockQuantity: 0,
    type: 'MERCHANDISE',
    imageUrl: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Event Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    venueName: '',
    venueAddress: '',
    eventDate: ''
  });

  // News Modals
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [editingNews, setEditingNews] = useState<any | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    slug: '',
    bodyHtml: '',
    type: 'NEWS',
    publishedAt: ''
  });
  
  // Advanced filters
  const [dateRange, setDateRange] = useState<'all' | '30' | '7'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'FAILED'>('ALL');
  
  // Pagination State
  const [ordersPage, setOrdersPage] = useState(1);
  const [donationsPage, setDonationsPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Drawer state
  const [selectedRecord, setSelectedRecord] = useState<{
    type: 'order' | 'donation';
    data: any;
  } | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Quick Action notification mock
  const [quickActionMsg, setQuickActionMsg] = useState<string | null>(null);

  const triggerQuickAction = (msg: string) => {
    setQuickActionMsg(msg);
    setTimeout(() => setQuickActionMsg(null), 3500);
  };

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch dashboard data.');
      }
      
      const data = await response.json();
      setMetrics(data.metrics);
      setRecentOrders(data.recentOrders);
      setRecentDonations(data.recentDonations);
      setInventory(data.inventory);
      setTickets(data.tickets || []);
      setEvents(data.events || []);
      setNews(data.news || []);
      setTimeSeries(data.timeSeries || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Simulator actions handlers
  const handleSimulateOrder = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/simulate/order', { method: 'POST' });
      if (res.ok) {
        triggerQuickAction("Developer Utility: Mock PAID store transaction generated!");
        await fetchStats(true);
      } else {
        const data = await res.json();
        triggerQuickAction(`Simulation error: ${data.error || 'Request failed'}`);
      }
    } catch (e) {
      console.error(e);
      triggerQuickAction("Network error trying to simulate transaction.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSimulateDonation = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/simulate/donation', { method: 'POST' });
      if (res.ok) {
        triggerQuickAction("Developer Utility: Mock Support Contribution created!");
        await fetchStats(true);
      } else {
        const data = await res.json();
        triggerQuickAction(`Simulation error: ${data.error || 'Request failed'}`);
      }
    } catch (e) {
      console.error(e);
      triggerQuickAction("Network error trying to simulate contribution.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetScans = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/tickets/reset-scans', { method: 'POST' });
      if (res.ok) {
        triggerQuickAction("Auditing Utility: All database ticket scans reset to Unverified!");
        await fetchStats(true);
      } else {
        triggerQuickAction("Failed to clear ticket scan logs.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStripeSync = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/stripe-sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        triggerQuickAction(data.message || "Stripe catalog sync successful!");
        await fetchStats(true);
      } else {
        triggerQuickAction(`Sync error: ${data.error || 'Request failed'}`);
      }
    } catch (e) {
      console.error(e);
      triggerQuickAction("Network error trying to sync Stripe catalog.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleTicketScan = async (ticketId: string, currentScanned: boolean) => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/tickets/toggle-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, isScanned: !currentScanned })
      });
      if (res.ok) {
        triggerQuickAction(!currentScanned ? "Override check-in: Access verified!" : "Override checkout: check-in log cleared.");
        await fetchStats(true);
      } else {
        triggerQuickAction("Override request failed.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCents = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(cents / 100);
  };

  const getStatusBadge = (status: RecentOrder['status']) => {
    const statusConfig = {
      PAID: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      PENDING: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      FAILED: 'bg-red-500/10 border-red-500/20 text-red-400',
      SHIPPED: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      REFUNDED: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
    };
    return (
      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border", statusConfig[status] || statusConfig.PENDING)}>
        {status}
      </span>
    );
  };

  const getProductTypeLabel = (type: InventoryProduct['type']) => {
    const labels = {
      MERCHANDISE: 'Merch',
      TICKET_DIGITAL: 'Digital Ticket',
      VIP_EXPERIENCE: 'VIP Access',
    };
    return labels[type] || type;
  };

  // Date threshold helper
  const isWithinDateRange = (dateStr: string) => {
    if (dateRange === 'all') return true;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= parseInt(dateRange);
  };

  // Filter lists
  const filteredOrders = recentOrders.filter(o => {
    const matchesSearch = o.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    const matchesDate = isWithinDateRange(o.createdAt);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredDonations = recentDonations.filter(d => {
    const matchesSearch = d.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.eventTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = isWithinDateRange(d.createdAt);
    return matchesSearch && matchesDate;
  });

  const filteredInventory = inventory.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTickets = tickets.filter(t => 
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.qrCodeHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venueAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.bodyHtml.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scan Rate Calculations
  const scanRate = metrics && metrics.totalTickets > 0 
    ? Math.round((metrics.scannedTickets / metrics.totalTickets) * 100) 
    : 0;

  // JSON Export Handler
  const handleExport = () => {
    const activeData = {
      exportedAt: new Date().toISOString(),
      metrics,
      orders: filteredOrders,
      donations: filteredDonations,
      inventory: filteredInventory,
      tickets: filteredTickets
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `afronile_audit_export_${activeTab}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerQuickAction("Successfully exported active ledger records to JSON.");
  };

  // SVG Chart path calculators
  const buildSvgPath = (points: ChartDataPoint[], type: 'sales' | 'donations', width: number, height: number) => {
    if (points.length === 0) return { linePath: '', coords: [], maxVal: 0 };
    const maxVal = Math.max(...points.map(p => type === 'sales' ? p.sales : p.donations), 1000);
    const coords = points.map((p, idx) => {
      const val = type === 'sales' ? p.sales : p.donations;
      const x = (idx / (points.length - 1)) * width;
      const y = height - (val / maxVal) * (height - 20) - 10;
      return { x, y };
    });
    
    // Build path line
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      d += ` L ${coords[i].x} ${coords[i].y}`;
    }
    return { linePath: d, coords, maxVal };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-9 w-9 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 animate-pulse font-medium uppercase tracking-wider">Assembling administrative system ledger...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-16 bg-red-500/5 border border-red-500/10 rounded-3xl p-8 text-center space-y-5 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white tracking-tight">Security / Loading Failure</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">{error}</p>
        </div>
        <button
          onClick={() => fetchStats()}
          className="h-11 w-full bg-zinc-900 border border-white/5 text-xs font-semibold text-white rounded-xl hover:bg-zinc-800 transition active:scale-98"
        >
          Re-Authenticate & Retry
        </button>
      </div>
    );
  }

  // Product handlers
  const handleOpenProductModal = (product: any | null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        title: product.title,
        sku: product.sku,
        priceCents: product.priceCents,
        stockQuantity: product.stockQuantity,
        type: product.type,
        imageUrl: product.imageUrl || '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        title: '',
        sku: `sku_${Date.now()}`,
        priceCents: 1500,
        stockQuantity: 100,
        type: 'MERCHANDISE',
        imageUrl: '',
      });
    }
    setShowProductModal(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setProductForm((prev) => ({ ...prev, imageUrl: data.url }));
      triggerQuickAction('Product image uploaded.');
    } catch (err: any) {
      alert(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = !!editingProduct;
      const url = '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { id: editingProduct.id, ...productForm } 
        : productForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed.');
      }

      triggerQuickAction(isEditing ? "Product updated successfully!" : "Product created successfully!");
      setShowProductModal(false);
      await fetchStats(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Failed to delete.');
      }
      triggerQuickAction("Product deleted successfully.");
      await fetchStats(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Event handlers
  const handleOpenEventModal = (event: any | null) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        eventDate: new Date(event.eventDate).toISOString().slice(0, 16)
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '',
        venueName: '',
        venueAddress: '',
        eventDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16)
      });
    }
    setShowEventModal(true);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = !!editingEvent;
      const url = '/api/admin/events';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { id: editingEvent.id, ...eventForm } 
        : eventForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed.');
      }

      triggerQuickAction(isEditing ? "Event updated successfully!" : "Event created successfully!");
      setShowEventModal(false);
      await fetchStats(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Failed to delete.');
      }
      triggerQuickAction("Event deleted successfully.");
      await fetchStats(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // News handlers
  const handleOpenNewsModal = (post: any | null) => {
    if (post) {
      setEditingNews(post);
      setNewsForm({
        title: post.title,
        slug: post.slug,
        bodyHtml: post.bodyHtml,
        type: post.type,
        publishedAt: new Date(post.publishedAt).toISOString().slice(0, 16)
      });
    } else {
      setEditingNews(null);
      setNewsForm({
        title: '',
        slug: '',
        bodyHtml: '',
        type: 'NEWS',
        publishedAt: new Date().toISOString().slice(0, 16)
      });
    }
    setShowNewsModal(true);
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = !!editingNews;
      const url = '/api/admin/news';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing 
        ? { id: editingNews.id, ...newsForm } 
        : newsForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed.');
      }

      triggerQuickAction(isEditing ? "News post updated successfully!" : "News post created successfully!");
      setShowNewsModal(false);
      await fetchStats(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("Are you sure you want to delete this news post?")) return;
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Failed to delete.');
      }
      triggerQuickAction("News post deleted successfully.");
      await fetchStats(true);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Chart configuration
  const chartWidth = 600;
  const chartHeight = 220;
  const salesChartInfo = buildSvgPath(timeSeries, 'sales', chartWidth, chartHeight);
  const donationsChartInfo = buildSvgPath(timeSeries, 'donations', chartWidth, chartHeight);

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4 px-4 sm:px-6 relative">
      
      {/* Toast Alert Box */}
      {quickActionMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-zinc-950 border border-primary/30 text-white text-xs font-medium shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="h-5 w-5 text-primary animate-bounce" />
          <span>{quickActionMsg}</span>
        </div>
      )}

      {/* Top Auditing Status Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">LIVE AUDIT PIPELINE ACTIVE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <span>Operational Console</span>
          </h1>
          <p className="text-xs text-zinc-500 font-light max-w-xl leading-relaxed">
            Administrative terminal for AfroNile. Review realtime customer sales logs, support contributions, and cryptographic gate scanning statuses.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="h-10 px-4 rounded-xl bg-zinc-950 border border-white/5 hover:border-white/10 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-2 active:scale-95 transition select-none cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export View</span>
          </button>
          
          <a
            href="/live/screen"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 active:scale-95 transition select-none cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
            <span>Launch Live Display</span>
          </a>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/10 text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-2 active:scale-95 transition disabled:opacity-50 select-none cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span>{refreshing ? 'Syncing...' : 'Sync Console'}</span>
          </button>
        </div>
      </div>

      {metrics && (
        <>
          {/* Main Key Metrics Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Store Revenue */}
            <div className="bg-zinc-950/60 border border-white/5 p-6 rounded-2xl hover:border-white/10 hover:bg-zinc-900/10 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Store Sales</span>
                  <h3 className="text-2xl font-bold text-white tabular-nums tracking-tight">
                    {formatCents(metrics.totalRevenueCents)}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                <span><span className="text-emerald-400 font-bold">{metrics.paidOrders}</span> transactions cleared</span>
              </div>
            </div>

            {/* Support Contributions */}
            <div className="bg-zinc-950/60 border border-white/5 p-6 rounded-2xl hover:border-white/10 hover:bg-zinc-900/10 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Contributions</span>
                  <h3 className="text-2xl font-bold text-white tabular-nums tracking-tight">
                    {formatCents(metrics.totalDonationsCents)}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                  <HeartHandshake className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                <TrendingUp className="h-3 w-3 text-violet-400" />
                <span>From <span className="text-violet-400 font-bold">{metrics.totalDonationsCount}</span> fan contributions</span>
              </div>
            </div>

            {/* Fan Database */}
            <div className="bg-zinc-950/60 border border-white/5 p-6 rounded-2xl hover:border-white/10 hover:bg-zinc-900/10 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Registered Fans</span>
                  <h3 className="text-2xl font-bold text-white tabular-nums tracking-tight">
                    {metrics.totalUsers}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Fan community database active</span>
              </div>
            </div>

            {/* Ticket scanning gauge progress */}
            <div className="bg-zinc-950/60 border border-white/5 p-6 rounded-2xl hover:border-white/10 hover:bg-zinc-900/10 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors" />
              
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Scan Check-ins</span>
                  <h3 className="text-2xl font-bold text-white tabular-nums tracking-tight">
                    {scanRate}%
                  </h3>
                  <span className="text-[9px] text-zinc-500 font-medium block">
                    {metrics.scannedTickets} / {metrics.totalTickets} tickets verified
                  </span>
                </div>

                {/* SVG circular gauge */}
                <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
                  <svg className="h-full w-full transform -rotate-90">
                    <circle 
                      cx="28" cy="28" r="23" 
                      strokeWidth="3.5" stroke="rgba(255,255,255,0.03)" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="28" cy="28" r="23" 
                      strokeWidth="3.5" stroke="url(#orangeGrad)" 
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 23}
                      strokeDashoffset={(2 * Math.PI * 23) * (1 - scanRate / 100)}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#fbbf24" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <Ticket className="absolute h-4.5 w-4.5 text-orange-400" />
                </div>
              </div>
            </div>

          </div>

          {/* Time Series Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Sales Chart */}
            <div className="bg-zinc-950/60 border border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">30-Day Sales Ledger</h3>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Paid transactions aggregated daily</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/5 rounded border border-emerald-500/10">
                  Max: {formatCents(salesChartInfo.maxVal)}
                </span>
              </div>
              
              <div className="relative h-[220px] w-full bg-zinc-900/10 border border-white/5 rounded-xl p-2 overflow-hidden flex items-center justify-center">
                {timeSeries.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No time-series data found.</p>
                ) : (
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                    <defs>
                      <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Area fill */}
                    {salesChartInfo.coords.length > 0 && (
                      <path 
                        d={`${salesChartInfo.linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                        fill="url(#salesAreaGrad)"
                      />
                    )}
                    
                    {/* Grid lines */}
                    <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                    <line x1="0" y1={chartHeight - 1} x2={chartWidth} y2={chartHeight - 1} stroke="rgba(255,255,255,0.05)" />
                    
                    {/* Graph line */}
                    <path 
                      d={salesChartInfo.linePath} 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />
                    
                    {/* Dynamic Nodes */}
                    {salesChartInfo.coords.map((c, i) => (
                      (i === 0 || i === salesChartInfo.coords.length - 1 || i % 5 === 0) && (
                        <g key={i}>
                          <circle cx={c.x} cy={c.y} r="4" fill="#000" stroke="#10b981" strokeWidth="2" />
                          <text x={c.x} y={chartHeight - 8} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
                            {timeSeries[i]?.date}
                          </text>
                        </g>
                      )
                    ))}
                  </svg>
                )}
              </div>
            </div>

            {/* Contributions Chart */}
            <div className="bg-zinc-950/60 border border-white/5 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">30-Day Support Ledger</h3>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Contributions aggregated daily</p>
                </div>
                <span className="text-[10px] font-bold text-violet-400 px-2 py-0.5 bg-violet-500/5 rounded border border-violet-500/10">
                  Max: {formatCents(donationsChartInfo.maxVal)}
                </span>
              </div>
              
              <div className="relative h-[220px] w-full bg-zinc-900/10 border border-white/5 rounded-xl p-2 overflow-hidden flex items-center justify-center">
                {timeSeries.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">No time-series data found.</p>
                ) : (
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                    <defs>
                      <linearGradient id="donationsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Area fill */}
                    {donationsChartInfo.coords.length > 0 && (
                      <path 
                        d={`${donationsChartInfo.linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                        fill="url(#donationsAreaGrad)"
                      />
                    )}
                    
                    {/* Grid lines */}
                    <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                    <line x1="0" y1={chartHeight - 1} x2={chartWidth} y2={chartHeight - 1} stroke="rgba(255,255,255,0.05)" />
                    
                    {/* Graph line */}
                    <path 
                      d={donationsChartInfo.linePath} 
                      fill="none" 
                      stroke="#8b5cf6" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />
                    
                    {/* Dynamic Nodes */}
                    {donationsChartInfo.coords.map((c, i) => (
                      (i === 0 || i === donationsChartInfo.coords.length - 1 || i % 5 === 0) && (
                        <g key={i}>
                          <circle cx={c.x} cy={c.y} r="4" fill="#000" stroke="#8b5cf6" strokeWidth="2" />
                          <text x={c.x} y={chartHeight - 8} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
                            {timeSeries[i]?.date}
                          </text>
                        </g>
                      )
                    ))}
                  </svg>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {/* Main Ledger Content & Filters Area */}
      <div className="space-y-4">
        
        {/* Navigation Tabs, Searches & Filters bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 p-3.5 border border-white/5 rounded-2xl shadow-xl">
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-1">
            {(['overview', 'orders', 'donations', 'inventory', 'tickets', 'events', 'news'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition capitalize border border-transparent",
                  activeTab === tab 
                    ? "bg-zinc-900 border-white/5 text-white" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {tab === 'news' ? 'news' : tab}
              </button>
            ))}
          </div>

          {/* Filtering selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Search */}
            <div className="relative flex-1 md:w-60 md:flex-initial">
              <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder={cn(
                  activeTab === 'overview' ? "Search everything..." : `Filter ${activeTab}...`
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition"
              />
            </div>

            {/* Date range filter */}
            {activeTab !== 'inventory' && activeTab !== 'tickets' && (
              <div className="flex items-center gap-1.5 h-10 px-3 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-zinc-400">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                <select 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="bg-transparent border-none text-zinc-300 focus:outline-none text-xs cursor-pointer select-none"
                >
                  <option value="all" className="bg-zinc-950">All Time</option>
                  <option value="30" className="bg-zinc-950">Last 30 Days</option>
                  <option value="7" className="bg-zinc-950">Last 7 Days</option>
                </select>
              </div>
            )}

            {/* Orders Status filter */}
            {activeTab === 'orders' && (
              <div className="flex items-center gap-1.5 h-10 px-3 bg-zinc-900/60 border border-white/5 rounded-xl text-xs text-zinc-400">
                <Tag className="h-3.5 w-3.5 text-zinc-500" />
                <select 
                  value={orderStatusFilter} 
                  onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                  className="bg-transparent border-none text-zinc-300 focus:outline-none text-xs cursor-pointer select-none"
                >
                  <option value="ALL" className="bg-zinc-950">All Statuses</option>
                  <option value="PAID" className="bg-zinc-950">Paid</option>
                  <option value="PENDING" className="bg-zinc-950">Pending</option>
                  <option value="FAILED" className="bg-zinc-950">Failed</option>
                </select>
              </div>
            )}

          </div>

        </div>

        {/* Dynamic Lists Tab Containers */}
        <div className="min-h-[350px]">
          
          {/* Tab 1: Overview Dashboard */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales activity block */}
                <div className="bg-zinc-900/25 border border-white/5 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="h-4.5 w-4.5 text-zinc-400" />
                      <span>Recent Sales Activity</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline"
                    >
                      <span>View Table</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic py-10 text-center">No orders matching selected filters.</p>
                  ) : (
                    <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto pr-1">
                      {filteredOrders.slice(0, 5).map((order) => (
                        <div 
                          key={order.id} 
                          onClick={() => setSelectedRecord({ type: 'order', data: order })}
                          className="py-3 flex items-center justify-between text-xs hover:bg-white/5 cursor-pointer rounded-lg px-2 transition-all"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{order.email}</p>
                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                              <span>ID: {order.id.slice(0, 8)}...</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-bold text-white tabular-nums">{formatCents(order.amountCents)}</p>
                            <div className="flex justify-end">{getStatusBadge(order.status)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Support Contributions block */}
                <div className="bg-zinc-900/25 border border-white/5 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <HeartHandshake className="h-4.5 w-4.5 text-zinc-400" />
                      <span>Support Contributions</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab('donations')}
                      className="text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline"
                    >
                      <span>View Table</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>

                  {filteredDonations.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic py-10 text-center">No contributions matching selected filters.</p>
                  ) : (
                    <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto pr-1">
                      {filteredDonations.slice(0, 5).map((donation) => (
                        <div 
                          key={donation.id} 
                          onClick={() => setSelectedRecord({ type: 'donation', data: donation })}
                          className="py-3.5 space-y-2 hover:bg-white/5 cursor-pointer rounded-lg px-2 transition-all"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{donation.email}</p>
                              <p className="text-[9px] text-zinc-500 font-semibold">{donation.eventTitle}</p>
                            </div>
                            <p className="font-bold text-violet-400 tabular-nums">{formatCents(donation.amountCents)}</p>
                          </div>
                          {donation.comment && (
                            <div className="p-2.5 rounded-lg bg-zinc-950 text-[10px] text-zinc-400 font-light border border-white/5 line-clamp-1 italic">
                              "{donation.comment}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Developer Operations Tools panel */}
              <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <Wrench className="h-5 w-5 text-zinc-400" />
                  <h3 className="text-sm font-bold text-white">System Testing & Simulation Suite</h3>
                </div>
                <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
                  Use these testing buttons to generate mock purchases, support entries, or reset database scanning logs. This assists in auditing layout responsiveness and trend calculations instantly.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  {process.env.NODE_ENV !== 'production' && (
                    <>
                  <button
                    onClick={handleSimulateOrder}
                    disabled={refreshing}
                    className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/95 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-40 select-none cursor-pointer"
                  >
                    Generate Test Order
                  </button>
                  <button
                    onClick={handleSimulateDonation}
                    disabled={refreshing}
                    className="h-10 px-4 rounded-xl bg-violet-600 hover:bg-violet-550 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-40 select-none cursor-pointer"
                  >
                    Generate Test Donation
                  </button>
                  <button
                    onClick={handleResetScans}
                    disabled={refreshing}
                    className="h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition active:scale-95 disabled:opacity-40 select-none cursor-pointer"
                  >
                    Reset Ticket Scans
                  </button>
                    </>
                  )}
                  <button
                    onClick={handleStripeSync}
                    disabled={refreshing}
                    className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-555 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-40 select-none cursor-pointer"
                  >
                    Sync Stripe Catalog
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Orders Detailed Table */}
          {activeTab === 'orders' && (
            <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden animate-in fade-in duration-200 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-zinc-950 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                      <th className="px-6 py-4">Order Identifier</th>
                      <th className="px-6 py-4">Customer Email</th>
                      <th className="px-6 py-4">Order Date</th>
                      <th className="px-6 py-4 text-right">Items</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">No matching orders found.</td>
                      </tr>
                    ) : (
                      filteredOrders.slice((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE).map((order) => (
                        <tr 
                          key={order.id} 
                          onClick={() => setSelectedRecord({ type: 'order', data: order })}
                          className="hover:bg-zinc-900/40 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 font-mono text-[10px] text-zinc-500 group-hover:text-primary transition-colors">{order.id}</td>
                          <td className="px-6 py-4 font-semibold text-white">{order.email}</td>
                          <td className="px-6 py-4 text-zinc-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right text-zinc-400">{order.items?.length || 0} items</td>
                          <td className="px-6 py-4 text-right font-bold text-white tabular-nums">{formatCents(order.amountCents)}</td>
                          <td className="px-6 py-4 text-center">{getStatusBadge(order.status)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4 border-t border-white/5 bg-zinc-950/40">
                <button
                  disabled={ordersPage === 1}
                  onClick={() => setOrdersPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 hover:text-white hover:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                >
                  Previous
                </button>
                <span className="text-[10px] font-mono text-zinc-500">
                  Page {ordersPage} of {Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE))}
                </span>
                <button
                  disabled={ordersPage >= Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)}
                  onClick={() => setOrdersPage(prev => prev + 1)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 hover:text-white hover:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Donations Detailed Table */}
          {activeTab === 'donations' && (
            <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden animate-in fade-in duration-200 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-zinc-950 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                      <th className="px-6 py-4">Contribution ID</th>
                      <th className="px-6 py-4">Fan Email</th>
                      <th className="px-6 py-4">Associated Event</th>
                      <th className="px-6 py-4">Auditing Message / Comment</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                    {filteredDonations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">No matching contributions found.</td>
                      </tr>
                    ) : (
                      filteredDonations.slice((donationsPage - 1) * ITEMS_PER_PAGE, donationsPage * ITEMS_PER_PAGE).map((donation) => (
                        <tr 
                          key={donation.id} 
                          onClick={() => setSelectedRecord({ type: 'donation', data: donation })}
                          className="hover:bg-zinc-900/40 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 font-mono text-[10px] text-zinc-500 group-hover:text-primary transition-colors">{donation.id}</td>
                          <td className="px-6 py-4 font-semibold text-white">{donation.email}</td>
                          <td className="px-6 py-4 text-zinc-400">{donation.eventTitle}</td>
                          <td className="px-6 py-4 text-zinc-400 max-w-[220px] truncate">{donation.comment || '-'}</td>
                          <td className="px-6 py-4 text-zinc-500">{new Date(donation.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right font-bold text-violet-400 tabular-nums">{formatCents(donation.amountCents)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4 border-t border-white/5 bg-zinc-950/40">
                <button
                  disabled={donationsPage === 1}
                  onClick={() => setDonationsPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 hover:text-white hover:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                >
                  Previous
                </button>
                <span className="text-[10px] font-mono text-zinc-500">
                  Page {donationsPage} of {Math.max(1, Math.ceil(filteredDonations.length / ITEMS_PER_PAGE))}
                </span>
                <button
                  disabled={donationsPage >= Math.ceil(filteredDonations.length / ITEMS_PER_PAGE)}
                  onClick={() => setDonationsPage(prev => prev + 1)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 hover:text-white hover:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Inventory Table */}
          {activeTab === 'inventory' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-1 px-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Product Catalog</h3>
                <button
                  onClick={() => handleOpenProductModal(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-[11px] font-bold text-white transition active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-zinc-950 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        <th className="px-6 py-4">SKU Identifier</th>
                        <th className="px-6 py-4">Product Title</th>
                        <th className="px-6 py-4">Inventory Type</th>
                        <th className="px-6 py-4 text-right">Price</th>
                        <th className="px-6 py-4 text-center">In-Stock Quantity</th>
                        <th className="px-6 py-4 text-center">Status Check</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 italic">No matching products found.</td>
                        </tr>
                      ) : (
                        filteredInventory.map((product) => {
                          const isLowStock = product.stockQuantity < 20;
                          return (
                            <tr key={product.id} className="hover:bg-zinc-900/40 transition-colors">
                              <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{product.sku}</td>
                              <td className="px-6 py-4 font-semibold text-white">{product.title}</td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-0.5 rounded-lg bg-zinc-800 text-[10px] text-zinc-400 font-semibold border border-white/5">
                                  {getProductTypeLabel(product.type)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-white tabular-nums">{formatCents(product.priceCents)}</td>
                              <td className="px-6 py-4 text-center font-bold text-white tabular-nums">{product.stockQuantity}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center">
                                  {isLowStock ? (
                                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-sm">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span>Low Stock</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                      In Stock
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center items-center gap-3">
                                  <button
                                    onClick={() => handleOpenProductModal(product)}
                                    className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="text-zinc-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition cursor-pointer"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Tickets Ledger & Scanning Overrides */}
          {activeTab === 'tickets' && (
            <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden animate-in fade-in duration-200 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-zinc-950 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                      <th className="px-6 py-4">Ticket ID</th>
                      <th className="px-6 py-4">Event Title</th>
                      <th className="px-6 py-4">Holder Email</th>
                      <th className="px-6 py-4">QR Signature Hash</th>
                      <th className="px-6 py-4 text-center">Scan Status</th>
                      <th className="px-6 py-4 text-center">Gate Controls Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">No tickets located in database records.</td>
                      </tr>
                    ) : (
                      filteredTickets.slice((ticketsPage - 1) * ITEMS_PER_PAGE, ticketsPage * ITEMS_PER_PAGE).map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{ticket.id.slice(0, 18)}...</td>
                          <td className="px-6 py-4 font-semibold text-white">{ticket.eventTitle}</td>
                          <td className="px-6 py-4 text-zinc-400">{ticket.email}</td>
                          <td className="px-6 py-4 font-mono text-[10px] text-zinc-500 truncate max-w-[150px]">{ticket.qrCodeHash}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {ticket.isScanned ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                  Scanned In
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                  Unscanned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <button
                                onClick={() => handleToggleTicketScan(ticket.id, ticket.isScanned)}
                                disabled={refreshing}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[10px] font-bold transition active:scale-95 disabled:opacity-40 select-none cursor-pointer",
                                  ticket.isScanned 
                                    ? "bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white"
                                    : "bg-primary text-white hover:bg-primary/95"
                                )}
                              >
                                {ticket.isScanned ? 'Reset Gate Scan' : 'Force Check-In'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4 border-t border-white/5 bg-zinc-950/40">
                <button
                  disabled={ticketsPage === 1}
                  onClick={() => setTicketsPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 hover:text-white hover:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                >
                  Previous
                </button>
                <span className="text-[10px] font-mono text-zinc-500">
                  Page {ticketsPage} of {Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE))}
                </span>
                <button
                  disabled={ticketsPage >= Math.ceil(filteredTickets.length / ITEMS_PER_PAGE)}
                  onClick={() => setTicketsPage(prev => prev + 1)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-400 hover:text-white hover:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Tab 6: Tour Events Table */}
          {activeTab === 'events' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-1 px-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tour Concert Events</h3>
                <button
                  onClick={() => handleOpenEventModal(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-[11px] font-bold text-white transition active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Event</span>
                </button>
              </div>

              <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-zinc-950 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        <th className="px-6 py-4">Event Date & Time</th>
                        <th className="px-6 py-4">Concert Title</th>
                        <th className="px-6 py-4">Venue</th>
                        <th className="px-6 py-4">Address Location</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">No tour events found.</td>
                        </tr>
                      ) : (
                        filteredEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="px-6 py-4 font-mono text-[11px] text-primary font-bold">
                              {new Date(event.eventDate).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 font-semibold text-white">{event.title}</td>
                            <td className="px-6 py-4 text-zinc-400">{event.venueName}</td>
                            <td className="px-6 py-4 text-zinc-500">{event.venueAddress}</td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center items-center gap-3">
                                <button
                                  onClick={() => handleOpenEventModal(event)}
                                  className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition cursor-pointer"
                                  title="Edit Event"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="text-zinc-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition cursor-pointer"
                                  title="Delete Event"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: News & Devlogs Table */}
          {activeTab === 'news' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-1 px-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">News & Devlogs</h3>
                <button
                  onClick={() => handleOpenNewsModal(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-[11px] font-bold text-white transition active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Post</span>
                </button>
              </div>

              <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-zinc-950 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        <th className="px-6 py-4">Published Date</th>
                        <th className="px-6 py-4">Post Title</th>
                        <th className="px-6 py-4">URL Slug</th>
                        <th className="px-6 py-4">Type Check</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                      {filteredNews.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">No news posts found.</td>
                        </tr>
                      ) : (
                        filteredNews.map((post) => (
                          <tr key={post.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="px-6 py-4 text-zinc-500">
                              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 font-semibold text-white">{post.title}</td>
                            <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">/{post.slug}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-lg text-[9px] font-bold border",
                                post.type === 'DEVLOG'
                                  ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              )}>
                                {post.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center items-center gap-3">
                                <button
                                  onClick={() => handleOpenNewsModal(post)}
                                  className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded transition cursor-pointer"
                                  title="Edit Post"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNews(post.id)}
                                  className="text-zinc-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition cursor-pointer"
                                  title="Delete Post"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Slide-over Audit Detail Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => { setSelectedRecord(null); setShowRawJson(false); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-lg bg-zinc-950 border-l border-white/5 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 z-10">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest block">Audit Detail Record</span>
                <h2 className="text-sm font-extrabold text-white truncate max-w-[280px]">
                  {selectedRecord.type === 'order' ? `Order Record` : `Contribution Record`}
                </h2>
              </div>
              <button 
                onClick={() => { setSelectedRecord(null); setShowRawJson(false); }}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Record Summary block */}
              <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Record UUID</span>
                  <span className="font-mono text-[9px] text-zinc-400 select-all">{selectedRecord.data.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Audited Timestamp</span>
                  <span className="text-zinc-300">{new Date(selectedRecord.data.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Associated Fan</span>
                  <span className="text-white font-medium truncate max-w-[200px]">{selectedRecord.data.email}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2.5 mt-2.5">
                  <span className="text-zinc-500">Record Status</span>
                  {selectedRecord.type === 'order' 
                    ? getStatusBadge(selectedRecord.data.status)
                    : <span className="px-2 py-0.5 border border-violet-500/20 bg-violet-500/10 text-violet-400 rounded-full text-[9px] font-bold uppercase tracking-wider">Cleared</span>
                  }
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Aggregate Amount</span>
                  <span className={cn("text-sm font-bold tabular-nums", selectedRecord.type === 'order' ? 'text-white' : 'text-violet-400')}>
                    {formatCents(selectedRecord.data.amountCents)}
                  </span>
                </div>
              </div>

              {/* Order Specific: Line Items */}
              {selectedRecord.type === 'order' && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Store Line Items</h4>
                  <div className="border border-white/5 rounded-xl bg-zinc-900/10 divide-y divide-white/5">
                    {selectedRecord.data.items?.length === 0 ? (
                      <p className="p-4 text-xs text-zinc-600 italic">No line item details found.</p>
                    ) : (
                      selectedRecord.data.items?.map((item: any, idx: number) => (
                        <div key={idx} className="p-3.5 flex justify-between items-start text-xs">
                          <div className="space-y-1 min-w-0 pr-4">
                            <p className="font-semibold text-white truncate max-w-[240px]">{item.productTitle}</p>
                            <p className="text-[9px] text-zinc-500 font-mono">SKU: {item.sku}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-white font-medium">Qty {item.quantity}</p>
                            <p className="text-[10px] text-zinc-400 font-bold tabular-nums mt-0.5">{formatCents(item.priceCents * item.quantity)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Donation Specific: Comments */}
              {selectedRecord.type === 'donation' && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Support Allocation</h4>
                  <div className="border border-white/5 rounded-xl bg-zinc-900/10 p-4 space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Dedicated Event</span>
                      <span className="text-white font-medium">{selectedRecord.data.eventTitle}</span>
                    </div>
                    {selectedRecord.data.comment && (
                      <div className="space-y-1.5 border-t border-white/5 pt-3 mt-3">
                        <span className="text-zinc-500 text-[10px] block">Comment Message</span>
                        <div className="p-3 rounded-lg bg-zinc-950 border border-white/5 text-[10px] text-zinc-400 font-light leading-relaxed italic">
                          "{selectedRecord.data.comment}"
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw JSON Audit Log Toggle */}
              <div className="space-y-3.5">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition select-none cursor-pointer"
                >
                  <FileCode className="h-4 w-4" />
                  <span>{showRawJson ? 'Hide Database Audit Log' : 'Reveal Database Audit Log'}</span>
                </button>

                {showRawJson && (
                  <pre className="p-4 rounded-xl border border-white/5 bg-zinc-950 font-mono text-[9px] text-zinc-400 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                    {JSON.stringify(selectedRecord.data, null, 2)}
                  </pre>
                )}
              </div>

            </div>

            {/* Quick Audit Actions */}
            <div className="p-6 border-t border-white/5 bg-zinc-950/80 space-y-3">
              <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Administrative Override Controls</h4>
              
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  onClick={() => triggerQuickAction(`Quick action 'Flag Record' triggered for UUID: ${selectedRecord.data.id}`)}
                  className="h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white border border-white/5 transition flex items-center justify-center gap-1.5 select-none active:scale-95"
                >
                  <span>Flag for Review</span>
                </button>

                <button
                  onClick={() => triggerQuickAction(`Quick action 'Issue Refund' initiated for transaction ID: ${selectedRecord.data.id}`)}
                  className={cn(
                    "h-10 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 select-none active:scale-95",
                    selectedRecord.type === 'order' 
                      ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                      : "bg-zinc-900 border-white/5 text-zinc-500 cursor-not-allowed"
                  )}
                  disabled={selectedRecord.type !== 'order'}
                >
                  <span>Refund Transaction</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-zinc-500 hover:text-white transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-mono text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Nile Waves Vinyl Record"
                  className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">SKU (Unique)</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g. nile-vinyl-01"
                    className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Type</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  >
                    <option value="MERCHANDISE">Merchandise</option>
                    <option value="TICKET_DIGITAL">Digital Ticket</option>
                    <option value="VIP_EXPERIENCE">VIP Experience</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={(productForm.priceCents / 100).toString()}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setProductForm(prev => ({ ...prev, priceCents: isNaN(val) ? 0 : Math.round(val * 100) }));
                    }}
                    placeholder="e.g. 19.99"
                    className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setProductForm(prev => ({ ...prev, stockQuantity: isNaN(val) ? 0 : val }));
                    }}
                    placeholder="e.g. 100"
                    className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Image URL</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://... or /uploads/..."
                  className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                />
                <div className="flex items-center gap-3 pt-1">
                  <label className="h-9 px-4 inline-flex items-center rounded-xl bg-zinc-900 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:border-white/10 transition cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={handleProductImageUpload}
                    />
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </label>
                  {productForm.imageUrl && (
                    <img
                      src={productForm.imageUrl}
                      alt="Product preview"
                      className="h-9 w-9 rounded-lg object-cover border border-white/10"
                    />
                  )}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-primary/20"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingEvent ? 'Edit Tour Event' : 'Add Tour Event'}
              </h3>
              <button onClick={() => setShowEventModal(false)} className="text-zinc-500 hover:text-white transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEventSubmit} className="space-y-4 text-xs font-mono text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Concert Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Cairo Polyrhythms LIVE"
                  className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Event Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Venue Name</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venueName}
                    onChange={(e) => setEventForm(prev => ({ ...prev, venueName: e.target.value }))}
                    placeholder="e.g. Pyramids Arena"
                    className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Address / City</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venueAddress}
                    onChange={(e) => setEventForm(prev => ({ ...prev, venueAddress: e.target.value }))}
                    placeholder="e.g. Giza, Egypt"
                    className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-primary/20"
                >
                  {editingEvent ? 'Update Concert Event' : 'Create Concert Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News Form Modal */}
      {showNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editingNews ? 'Edit News Post' : 'Add News Post'}
              </h3>
              <button onClick={() => setShowNewsModal(false)} className="text-zinc-500 hover:text-white transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleNewsSubmit} className="space-y-4 text-xs font-mono text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Post Title</label>
                  <input
                    type="text"
                    required
                    value={newsForm.title}
                    onChange={(e) => {
                      const titleVal = e.target.value;
                      setNewsForm(prev => ({
                        ...prev,
                        title: titleVal,
                        slug: prev.slug === '' || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                          ? titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                          : prev.slug
                      }));
                    }}
                    placeholder="e.g. Nile Waves Tour Announced"
                    className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">URL Slug (Unique)</label>
                  <input
                    type="text"
                    required
                    value={newsForm.slug}
                    onChange={(e) => setNewsForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="e.g. tour-announced"
                    className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Category Type</label>
                  <select
                    value={newsForm.type}
                    onChange={(e) => setNewsForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  >
                    <option value="NEWS">NEWS</option>
                    <option value="DEVLOG">DEVLOG</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Publish Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newsForm.publishedAt}
                    onChange={(e) => setNewsForm(prev => ({ ...prev, publishedAt: e.target.value }))}
                    className="w-full h-10 px-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">HTML Body Content</label>
                <textarea
                  required
                  rows={6}
                  value={newsForm.bodyHtml}
                  onChange={(e) => setNewsForm(prev => ({ ...prev, bodyHtml: e.target.value }))}
                  placeholder="<p>Write news body here...</p>"
                  className="w-full p-4 rounded-xl bg-zinc-900 border border-white/5 focus:border-primary text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-primary/20"
                >
                  {editingNews ? 'Update News Post' : 'Create News Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

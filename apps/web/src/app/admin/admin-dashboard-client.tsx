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
  CheckCircle2,
  Wrench,
  Maximize2,
  Plus,
  Edit,
  Trash2,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Sliders,
  ChevronLeft
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
  // Navigation & Layout States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workspace, setWorkspace] = useState<'AfroNile Studio' | 'Nile Records'>('AfroNile Studio');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = [
    "New support contribution from Nairobi: $25.00",
    "Ticket validation complete for event: Nairobi Release Concert",
    "Inventory alert: Album Vinyl stock is below 10 units"
  ];

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
      PAID: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
      PENDING: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
      FAILED: 'border-red-500/20 bg-red-500/10 text-red-400',
      SHIPPED: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
      REFUNDED: 'border-zinc-700 bg-zinc-800 text-zinc-400',
    };
    return (
      <span className={cn("px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border tracking-wider", statusConfig[status] || statusConfig.PENDING)}>
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 space-y-4">
        <div className="h-6 w-6 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Assembling studio work environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center space-y-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Operational Fault Detected</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">{error}</p>
          </div>
          <button
            onClick={() => fetchStats()}
            className="h-10 w-full bg-zinc-950 border border-zinc-800 text-xs font-semibold text-white rounded-md hover:bg-zinc-850 hover:border-zinc-700 transition active:scale-98"
          >
            Re-Establish Terminal Link
          </button>
        </div>
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

  const chartWidth = 600;
  const chartHeight = 220;
  const salesChartInfo = buildSvgPath(timeSeries, 'sales', chartWidth, chartHeight);
  const donationsChartInfo = buildSvgPath(timeSeries, 'donations', chartWidth, chartHeight);

  const sidebarLinks = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders & Sales', icon: ShoppingBag, count: filteredOrders.length },
    { id: 'donations', label: 'Fan Contributions', icon: HeartHandshake, count: filteredDonations.length },
    { id: 'inventory', label: 'Products', icon: Sliders },
    { id: 'tickets', label: 'Cryptographic Gates', icon: Ticket, count: filteredTickets.filter(t => !t.isScanned).length },
    { id: 'events', label: 'Tour Events', icon: Calendar },
    { id: 'news', label: 'Articles & Logs', icon: FileCode },
  ] as const;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white antialiased">
      
      {/* Toast Alert Box */}
      {quickActionMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-md bg-zinc-900 border border-zinc-800 text-white text-xs font-mono shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{quickActionMsg}</span>
        </div>
      )}

      {/* Sidebar Workspace Panel */}
      <aside 
        className={cn(
          "flex flex-col border-r border-zinc-900 bg-zinc-950 transition-all duration-300 shrink-0 select-none z-40",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Sidebar Workspace Switcher Header */}
        <div className="h-14 border-b border-zinc-900 flex items-center justify-between px-4 relative">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-7 w-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">AN</span>
            </div>
            {!sidebarCollapsed && (
              <button 
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-100 hover:text-white transition"
              >
                <span>{workspace}</span>
                <ChevronDown className="h-3 w-3 text-zinc-500" />
              </button>
            )}
          </div>

          {/* Collapsible trigger */}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-6 w-6 rounded-md hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white transition border border-transparent hover:border-zinc-800"
          >
            {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>

          {/* Workspace Switcher dropdown menu */}
          {showWorkspaceMenu && !sidebarCollapsed && (
            <div className="absolute top-12 left-4 z-50 w-52 bg-zinc-900 border border-zinc-800 rounded-md p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <button 
                onClick={() => { setWorkspace('AfroNile Studio'); setShowWorkspaceMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-zinc-800 transition font-medium"
              >
                AfroNile Studio
              </button>
              <button 
                onClick={() => { setWorkspace('Nile Records'); setShowWorkspaceMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-zinc-800 transition font-medium"
              >
                Nile Records
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => { setActiveTab(link.id); setSearchQuery(''); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md transition text-left group cursor-pointer",
                  isActive 
                    ? "bg-zinc-900 text-white font-semibold border border-zinc-800" 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300")} />
                  {!sidebarCollapsed && <span className="text-xs truncate">{link.label}</span>}
                </div>
                {!sidebarCollapsed && 'count' in link && (link.count as number) > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {link.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer user profile block */}
        <div className="p-3 border-t border-zinc-900 flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[11px] font-bold text-white truncate">Administrator</p>
              <p className="text-[9px] font-mono text-zinc-500 truncate">active_gate_sync</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace Frame container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Top Sticky Header */}
        <header className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 shrink-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="text-zinc-500">Workspace</span>
            <ChevronRight className="h-3 w-3 text-zinc-650" />
            <span className="text-zinc-500">Dashboard</span>
            <ChevronRight className="h-3 w-3 text-zinc-650" />
            <span className="text-zinc-200 capitalize font-medium">{activeTab}</span>
          </div>

          {/* Quick actions panel */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                placeholder={cn(
                  activeTab === 'overview' ? "Global platform filter..." : `Filter ${activeTab} records...`
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8.5 pl-8.5 pr-3 bg-zinc-900 border border-zinc-800 rounded-md text-[11px] text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition"
              />
            </div>

            {/* Sync Console */}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              title="Synchronize workspace statistics"
              className="h-8.5 px-3 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 select-none cursor-pointer"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Sync'}</span>
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              title="Export current view to JSON"
              className="h-8.5 px-3 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 transition active:scale-95 select-none cursor-pointer"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="h-8.5 w-8.5 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-355 hover:text-white transition cursor-pointer relative"
              >
                <Bell className="h-3.5 w-3.5" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-10 z-50 w-72 bg-zinc-900 border border-zinc-800 rounded-md p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">System log events</p>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {notifications.map((n, idx) => (
                      <div key={idx} className="px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-850/50">
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action launcher */}
            <a
              href="/live/screen"
              target="_blank"
              rel="noopener noreferrer"
              title="Launch concert board view"
              className="h-8.5 px-3 rounded-md bg-primary text-white hover:bg-primary/95 text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 select-none cursor-pointer"
            >
              <Maximize2 className="h-3 w-3" />
              <span className="hidden sm:inline">Live Display</span>
            </a>
          </div>
        </header>

        {/* Content Body Pane */}
        <main className="flex-1 p-6 w-full space-y-6">
          
          {/* Tab 1: Overview Dashboard */}
          {activeTab === 'overview' && metrics && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Top Operational status banner */}
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-2.5 w-2.5 items-center justify-center relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">LIVE CONCERT COMPANION TERMINAL ACTIVE</p>
                    <p className="text-[11px] text-zinc-400 font-light mt-0.5">Stream connections, order checkouts, and security scanning streams are fully active.</p>
                  </div>
                </div>
              </div>

              {/* Main metrics summary row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Store sales */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg relative overflow-hidden text-left">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Total Sales</span>
                      <h3 className="text-2xl font-bold text-white tabular-nums tracking-tight">
                        {formatCents(metrics.totalRevenueCents)}
                      </h3>
                    </div>
                    <div className="p-2 rounded-md bg-zinc-950 border border-zinc-800 text-primary">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span><span className="text-zinc-300 font-bold">{metrics.paidOrders}</span> transactions cleared</span>
                  </div>
                </div>

                {/* Fan support */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg relative overflow-hidden text-left">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Fan Donations</span>
                      <h3 className="text-2xl font-bold text-white tabular-nums tracking-tight">
                        {formatCents(metrics.totalDonationsCents)}
                      </h3>
                    </div>
                    <div className="p-2 rounded-md bg-zinc-950 border border-zinc-800 text-[#f3b775]">
                      <HeartHandshake className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                    <TrendingUp className="h-3 w-3 text-[#f3b775]" />
                    <span><span className="text-zinc-300 font-bold">{metrics.totalDonationsCount}</span> contributions</span>
                  </div>
                </div>

                {/* Fans community */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg relative overflow-hidden text-left">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Registered Fans</span>
                      <h3 className="text-2xl font-bold text-white tabular-nums tracking-tight">
                        {metrics.totalUsers}
                      </h3>
                    </div>
                    <div className="p-2 rounded-md bg-zinc-950 border border-zinc-800 text-[#e28a47]">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                    <ShieldCheck className="h-3 w-3 text-[#e28a47]" />
                    <span>Nile Fanbase index synced</span>
                  </div>
                </div>

                {/* Scanner access rate */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg relative overflow-hidden text-left">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Scan Rate</span>
                      <h3 className="text-2xl font-bold text-white tabular-nums tracking-tight">
                        {scanRate}%
                      </h3>
                      <span className="text-[9px] text-zinc-500 font-medium block">
                        {metrics.scannedTickets} / {metrics.totalTickets} tickets verified
                      </span>
                    </div>
                    <div className="relative h-11 w-11 flex items-center justify-center shrink-0">
                      <svg className="h-full w-full transform -rotate-90">
                        <circle 
                          cx="22" cy="22" r="18" 
                          strokeWidth="2.5" stroke="rgba(255,255,255,0.03)" 
                          fill="transparent" 
                        />
                        <circle 
                          cx="22" cy="22" r="18" 
                          strokeWidth="2.5" stroke="#d95f30" 
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={(2 * Math.PI * 18) * (1 - scanRate / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <Ticket className="absolute h-3 w-3 text-primary" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Time series SVG ledger charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sales Chart */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Sales Ledger (30-Day)</h3>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Aggregated payments cleared daily</p>
                    </div>
                    <span className="text-[9px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded border border-primary/10 font-mono">
                      Max: {formatCents(salesChartInfo.maxVal)}
                    </span>
                  </div>

                  <div className="relative h-[220px] w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 overflow-hidden flex items-center justify-center">
                    {timeSeries.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic font-mono">No time-series statistics available.</p>
                    ) : (
                      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                        <defs>
                          <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d95f30" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#d95f30" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {salesChartInfo.coords.length > 0 && (
                          <path 
                            d={`${salesChartInfo.linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                            fill="url(#salesAreaGrad)"
                          />
                        )}
                        
                        <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                        <line x1="0" y1={chartHeight - 1} x2={chartWidth} y2={chartHeight - 1} stroke="rgba(255,255,255,0.05)" />
                        
                        <path 
                          d={salesChartInfo.linePath} 
                          fill="none" 
                          stroke="#d95f30" 
                          strokeWidth="2" 
                          strokeLinecap="round"
                        />
                        
                        {salesChartInfo.coords.map((c, i) => (
                          (i === 0 || i === salesChartInfo.coords.length - 1 || i % 5 === 0) && (
                            <g key={i}>
                              <circle cx={c.x} cy={c.y} r="3" fill="#09090b" stroke="#d95f30" strokeWidth="1.5" />
                              <text x={c.x} y={chartHeight - 8} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="middle" fontFamily="monospace">
                                {timeSeries[i]?.date}
                              </text>
                            </g>
                          )
                        ))}
                      </svg>
                    )}
                  </div>
                </div>

                {/* Support contributions chart */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Donations Ledger (30-Day)</h3>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Aggregated fan support values</p>
                    </div>
                    <span className="text-[9px] font-bold text-[#f3b775] px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 font-mono">
                      Max: {formatCents(donationsChartInfo.maxVal)}
                    </span>
                  </div>

                  <div className="relative h-[220px] w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 overflow-hidden flex items-center justify-center">
                    {timeSeries.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic font-mono">No time-series statistics available.</p>
                    ) : (
                      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                        <defs>
                          <linearGradient id="donationsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f3b775" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#f3b775" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {donationsChartInfo.coords.length > 0 && (
                          <path 
                            d={`${donationsChartInfo.linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
                            fill="url(#donationsAreaGrad)"
                          />
                        )}
                        
                        <line x1="0" y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="rgba(255,255,255,0.03)" strokeDasharray="4 4" />
                        <line x1="0" y1={chartHeight - 1} x2={chartWidth} y2={chartHeight - 1} stroke="rgba(255,255,255,0.05)" />
                        
                        <path 
                          d={donationsChartInfo.linePath} 
                          fill="none" 
                          stroke="#f3b775" 
                          strokeWidth="2" 
                          strokeLinecap="round"
                        />
                        
                        {donationsChartInfo.coords.map((c, i) => (
                          (i === 0 || i === donationsChartInfo.coords.length - 1 || i % 5 === 0) && (
                            <g key={i}>
                              <circle cx={c.x} cy={c.y} r="3" fill="#09090b" stroke="#f3b775" strokeWidth="1.5" />
                              <text x={c.x} y={chartHeight - 8} fill="rgba(255,255,255,0.2)" fontSize="8" textAnchor="middle" fontFamily="monospace">
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

              {/* Two-column summary lists (Sales activity & Donations activity) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sales block */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-zinc-400" />
                      <span>Recent Store activity</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline"
                    >
                      <span>All Orders</span>
                      <ChevronRight className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-8 text-center font-mono">No matching records.</p>
                  ) : (
                    <div className="divide-y divide-zinc-800 max-h-[260px] overflow-y-auto pr-1">
                      {filteredOrders.slice(0, 5).map((order) => (
                        <div 
                          key={order.id} 
                          onClick={() => setSelectedRecord({ type: 'order', data: order })}
                          className="py-2.5 flex items-center justify-between text-xs hover:bg-zinc-950/40 cursor-pointer rounded px-2 transition"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-white truncate max-w-[200px]">{order.email}</p>
                            <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                              <span>ID: {order.id.slice(0, 8)}...</span>
                              <span>•</span>
                              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
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

                {/* Donations block */}
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4 text-zinc-400" />
                      <span>Recent Contributions</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab('donations')}
                      className="text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline"
                    >
                      <span>All Donations</span>
                      <ChevronRight className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  {filteredDonations.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-8 text-center font-mono">No matching records.</p>
                  ) : (
                    <div className="divide-y divide-zinc-800 max-h-[260px] overflow-y-auto pr-1">
                      {filteredDonations.slice(0, 5).map((donation) => (
                        <div 
                          key={donation.id} 
                          onClick={() => setSelectedRecord({ type: 'donation', data: donation })}
                          className="py-2.5 space-y-1.5 hover:bg-zinc-950/40 cursor-pointer rounded px-2 transition text-xs"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-white truncate max-w-[200px]">{donation.email}</p>
                              <p className="text-[9px] text-zinc-555 font-semibold">{donation.eventTitle}</p>
                            </div>
                            <p className="font-bold text-violet-400 tabular-nums">{formatCents(donation.amountCents)}</p>
                          </div>
                          {donation.comment && (
                            <div className="p-2 rounded bg-zinc-950 text-[10px] text-zinc-400 border border-zinc-800 line-clamp-1 italic font-light">
                              "{donation.comment}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Developer Operations Tools simulation panel */}
              <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800 space-y-3 text-left">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Wrench className="h-4 w-4 text-zinc-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Testing & Simulation Console</h3>
                </div>
                <p className="text-xs text-zinc-500 font-light max-w-xl leading-relaxed">
                  Trigger actions below to evaluate layout updates, transaction metrics, and scan confirmations instantly in development.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {process.env.NODE_ENV !== 'production' && (
                    <>
                      <button
                        onClick={handleSimulateOrder}
                        disabled={refreshing}
                        className="h-9 px-3.5 rounded bg-primary hover:bg-primary/95 text-xs font-bold text-white transition active:scale-95 disabled:opacity-40 select-none cursor-pointer"
                      >
                        Simulate Order Payment
                      </button>
                      <button
                        onClick={handleSimulateDonation}
                        disabled={refreshing}
                        className="h-9 px-3.5 rounded bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white transition active:scale-95 disabled:opacity-40 select-none cursor-pointer"
                      >
                        Simulate Donation
                      </button>
                      <button
                        onClick={handleStripeSync}
                        disabled={refreshing}
                        className="h-9 px-3.5 rounded bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition active:scale-95 disabled:opacity-40 select-none cursor-pointer"
                      >
                        Sync Stripe Catalog
                      </button>
                      <button
                        onClick={handleResetScans}
                        disabled={refreshing}
                        className="h-9 px-3.5 rounded bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition active:scale-95 disabled:opacity-40 select-none cursor-pointer"
                      >
                        Reset Access Scans
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Filter bars for paginated lists */}
          {activeTab !== 'overview' && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 p-3 border border-zinc-800 rounded-lg">
              
              {/* Context Actions */}
              <div className="text-left">
                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block font-mono">active view</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mt-0.5">{activeTab} Ledger Records</h2>
              </div>

              {/* Filtering selection controls */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Advanced selector dropdowns */}
                {activeTab !== 'inventory' && activeTab !== 'tickets' && (
                  <div className="flex items-center gap-1.5 h-8.5 px-3 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-400">
                    <Calendar className="h-3 w-3 text-zinc-500" />
                    <select 
                      value={dateRange} 
                      onChange={(e) => setDateRange(e.target.value as any)}
                      className="bg-transparent border-none text-zinc-300 focus:outline-none text-[11px] cursor-pointer select-none"
                    >
                      <option value="all" className="bg-zinc-950">All Time</option>
                      <option value="30" className="bg-zinc-950">Last 30 Days</option>
                      <option value="7" className="bg-zinc-950">Last 7 Days</option>
                    </select>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="flex items-center gap-1.5 h-8.5 px-3 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-400">
                    <Tag className="h-3 w-3 text-zinc-500" />
                    <select 
                      value={orderStatusFilter} 
                      onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                      className="bg-transparent border-none text-zinc-300 focus:outline-none text-[11px] cursor-pointer select-none"
                    >
                      <option value="ALL" className="bg-zinc-950">All Statuses</option>
                      <option value="PAID" className="bg-zinc-950">Paid</option>
                      <option value="PENDING" className="bg-zinc-950">Pending</option>
                      <option value="FAILED" className="bg-zinc-950">Failed</option>
                    </select>
                  </div>
                )}

                {/* Add Actions */}
                {activeTab === 'inventory' && (
                  <button
                    onClick={() => handleOpenProductModal(null)}
                    className="h-8.5 px-3 rounded bg-primary hover:bg-primary/95 text-[11px] font-bold text-white transition active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Product</span>
                  </button>
                )}

                {activeTab === 'events' && (
                  <button
                    onClick={() => handleOpenEventModal(null)}
                    className="h-8.5 px-3 rounded bg-primary hover:bg-primary/95 text-[11px] font-bold text-white transition active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Event</span>
                  </button>
                )}

                {activeTab === 'news' && (
                  <button
                    onClick={() => handleOpenNewsModal(null)}
                    className="h-8.5 px-3 rounded bg-primary hover:bg-primary/95 text-[11px] font-bold text-white transition active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Post</span>
                  </button>
                )}

              </div>
            </div>
          )}

          {/* Ledger Lists Content */}
          <div className="min-h-[300px]">

            {/* Tab 2: Orders Table */}
            {activeTab === 'orders' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-in fade-in duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950 text-[9px] text-zinc-400 uppercase font-mono font-bold tracking-widest">
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer Email</th>
                        <th className="px-6 py-4">Order Date</th>
                        <th className="px-6 py-4 text-right">Items</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic font-mono">No orders found matching filters.</td>
                        </tr>
                      ) : (
                        filteredOrders.slice((ordersPage - 1) * ITEMS_PER_PAGE, ordersPage * ITEMS_PER_PAGE).map((order) => (
                          <tr 
                            key={order.id} 
                            onClick={() => setSelectedRecord({ type: 'order', data: order })}
                            className="hover:bg-zinc-950/40 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{order.id.slice(0, 18)}...</td>
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
                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-950/40">
                  <button
                    disabled={ordersPage === 1}
                    onClick={() => setOrdersPage(prev => Math.max(prev - 1, 1))}
                    className="h-8 px-3 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                  >
                    Previous
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Page {ordersPage} of {Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE))}
                  </span>
                  <button
                    disabled={ordersPage >= Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)}
                    onClick={() => setOrdersPage(prev => prev + 1)}
                    className="h-8 px-3 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Donations Table */}
            {activeTab === 'donations' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-in fade-in duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950 text-[9px] text-zinc-400 uppercase font-mono font-bold tracking-widest">
                        <th className="px-6 py-4">Contribution ID</th>
                        <th className="px-6 py-4">Fan Email</th>
                        <th className="px-6 py-4">Associated Event</th>
                        <th className="px-6 py-4">Auditing Comment</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                      {filteredDonations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic font-mono">No matching contributions found.</td>
                        </tr>
                      ) : (
                        filteredDonations.slice((donationsPage - 1) * ITEMS_PER_PAGE, donationsPage * ITEMS_PER_PAGE).map((donation) => (
                          <tr 
                            key={donation.id} 
                            onClick={() => setSelectedRecord({ type: 'donation', data: donation })}
                            className="hover:bg-zinc-950/40 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{donation.id.slice(0, 18)}...</td>
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
                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-950/40">
                  <button
                    disabled={donationsPage === 1}
                    onClick={() => setDonationsPage(prev => Math.max(prev - 1, 1))}
                    className="h-8 px-3 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                  >
                    Previous
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Page {donationsPage} of {Math.max(1, Math.ceil(filteredDonations.length / ITEMS_PER_PAGE))}
                  </span>
                  <button
                    disabled={donationsPage >= Math.ceil(filteredDonations.length / ITEMS_PER_PAGE)}
                    onClick={() => setDonationsPage(prev => prev + 1)}
                    className="h-8 px-3 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Inventory Table */}
            {activeTab === 'inventory' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950 text-[9px] text-zinc-400 uppercase font-mono font-bold tracking-widest">
                        <th className="px-6 py-4">SKU Code</th>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4 text-right">Price</th>
                        <th className="px-6 py-4 text-right">Stock Level</th>
                        <th className="px-6 py-4 text-center">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                      {filteredInventory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic font-mono">No products in inventory list.</td>
                        </tr>
                      ) : (
                        filteredInventory.map((product) => {
                          const isLowStock = product.stockQuantity < 10;
                          return (
                            <tr key={product.id} className="hover:bg-zinc-950/40 transition-colors">
                              <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{product.sku}</td>
                              <td className="px-6 py-4 font-semibold text-white">{product.title}</td>
                              <td className="px-6 py-4 text-zinc-400">{getProductTypeLabel(product.type)}</td>
                              <td className="px-6 py-4 text-right font-bold text-white tabular-nums">{formatCents(product.priceCents)}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={cn(
                                  "font-mono font-bold tabular-nums px-1.5 py-0.5 rounded text-[10px]",
                                  isLowStock ? "bg-red-500/10 text-red-400 border border-red-500/20" : "text-zinc-400"
                                )}>
                                  {product.stockQuantity} units
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenProductModal(product)}
                                    className="p-1 hover:bg-zinc-950 rounded text-zinc-400 hover:text-white transition cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-1 hover:bg-zinc-950 rounded text-zinc-400 hover:text-red-400 transition cursor-pointer"
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
            )}

            {/* Tab 5: Tickets Scanning Table */}
            {activeTab === 'tickets' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-in fade-in duration-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950 text-[9px] text-zinc-400 uppercase font-mono font-bold tracking-widest">
                        <th className="px-6 py-4">Ticket ID</th>
                        <th className="px-6 py-4">Event Title</th>
                        <th className="px-6 py-4">Holder Email</th>
                        <th className="px-6 py-4">QR Hash</th>
                        <th className="px-6 py-4 text-center">Scan Status</th>
                        <th className="px-6 py-4 text-center">Gate Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                      {filteredTickets.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic font-mono">No tickets in database registry.</td>
                        </tr>
                      ) : (
                        filteredTickets.slice((ticketsPage - 1) * ITEMS_PER_PAGE, ticketsPage * ITEMS_PER_PAGE).map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-zinc-950/40 transition-colors">
                            <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{ticket.id.slice(0, 18)}...</td>
                            <td className="px-6 py-4 font-semibold text-white">{ticket.eventTitle}</td>
                            <td className="px-6 py-4 text-zinc-400">{ticket.email}</td>
                            <td className="px-6 py-4 font-mono text-[10px] text-zinc-500 truncate max-w-[150px]">{ticket.qrCodeHash}</td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                {ticket.isScanned ? (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 uppercase font-mono tracking-wider">
                                    Validated
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 uppercase font-mono tracking-wider">
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
                                    "px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition active:scale-95 disabled:opacity-40 select-none cursor-pointer",
                                    ticket.isScanned 
                                      ? "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white"
                                      : "bg-primary text-white hover:bg-primary/95"
                                  )}
                                >
                                  {ticket.isScanned ? 'Reset Scan' : 'Force Check-In'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-950/40">
                  <button
                    disabled={ticketsPage === 1}
                    onClick={() => setTicketsPage(prev => Math.max(prev - 1, 1))}
                    className="h-8 px-3 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                  >
                    Previous
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Page {ticketsPage} of {Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE))}
                  </span>
                  <button
                    disabled={ticketsPage >= Math.ceil(filteredTickets.length / ITEMS_PER_PAGE)}
                    onClick={() => setTicketsPage(prev => prev + 1)}
                    className="h-8 px-3 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed select-none transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Tab 6: Tour Events Table */}
            {activeTab === 'events' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950 text-[9px] text-zinc-400 uppercase font-mono font-bold tracking-widest">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Event Title</th>
                        <th className="px-6 py-4">Venue</th>
                        <th className="px-6 py-4">Location</th>
                        <th className="px-6 py-4 text-center">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic font-mono">No tour events scheduled.</td>
                        </tr>
                      ) : (
                        filteredEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-zinc-950/40 transition-colors">
                            <td className="px-6 py-4 text-zinc-400 font-mono">{new Date(event.eventDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-semibold text-white">{event.title}</td>
                            <td className="px-6 py-4 text-zinc-400">{event.venueName}</td>
                            <td className="px-6 py-4 text-zinc-500">{event.venueAddress}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenEventModal(event)}
                                  className="p-1 hover:bg-zinc-950 rounded text-zinc-400 hover:text-white transition cursor-pointer"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="p-1 hover:bg-zinc-950 rounded text-zinc-400 hover:text-red-400 transition cursor-pointer"
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
            )}

            {/* Tab 7: News and logs Table */}
            {activeTab === 'news' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950 text-[9px] text-zinc-400 uppercase font-mono font-bold tracking-widest">
                        <th className="px-6 py-4">Publish Date</th>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Slug Identifier</th>
                        <th className="px-6 py-4 text-center">Type</th>
                        <th className="px-6 py-4 text-center">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                      {filteredNews.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic font-mono">No news articles found.</td>
                        </tr>
                      ) : (
                        filteredNews.map((post) => (
                          <tr key={post.id} className="hover:bg-zinc-950/40 transition-colors">
                            <td className="px-6 py-4 text-zinc-400 font-mono">{new Date(post.publishedAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-semibold text-white">{post.title}</td>
                            <td className="px-6 py-4 text-zinc-500 font-mono text-[11px]">{post.slug}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-[10px] font-mono border border-zinc-800 text-zinc-400">
                                {post.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenNewsModal(post)}
                                  className="p-1 hover:bg-zinc-950 rounded text-zinc-400 hover:text-white transition cursor-pointer"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNews(post.id)}
                                  className="p-1 hover:bg-zinc-950 rounded text-zinc-400 hover:text-red-400 transition cursor-pointer"
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
            )}

          </div>

        </main>

      </div>

      {/* Record details slide drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="h-full w-full max-w-lg bg-zinc-950 border-l border-zinc-900 p-6 flex flex-col justify-between space-y-6 shadow-2xl animate-in slide-in-from-right duration-300 text-left">
            <div className="space-y-6">
              
              {/* Drawer header */}
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block font-mono">
                    {selectedRecord.type} detail profile
                  </span>
                  <h2 className="text-sm font-bold text-white font-mono mt-1 select-all">
                    {selectedRecord.data.id}
                  </h2>
                </div>
                <button 
                  onClick={() => { setSelectedRecord(null); setShowRawJson(false); }}
                  className="p-1.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-md text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Details content */}
              <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-1">
                {selectedRecord.type === 'order' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block font-mono">Account Holder</span>
                        <p className="text-xs text-white font-semibold">{selectedRecord.data.email}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block font-mono">Status</span>
                        <div>{getStatusBadge(selectedRecord.data.status)}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block font-mono">Paid Value</span>
                        <p className="text-xs text-white font-bold">{formatCents(selectedRecord.data.amountCents)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block font-mono">Timestamp</span>
                        <p className="text-xs text-zinc-300 font-mono">{new Date(selectedRecord.data.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2 border border-zinc-900 bg-zinc-900/10 p-4 rounded-md">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Basket Items</h4>
                      <div className="border border-zinc-900 rounded-md bg-zinc-950 divide-y divide-zinc-900">
                        {selectedRecord.data.items?.map((item: any, idx: number) => (
                          <div key={idx} className="p-3 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-semibold text-white">{item.productTitle}</p>
                              <p className="text-[9px] text-zinc-500 font-mono mt-0.5">SKU: {item.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-zinc-350">{item.quantity}x</p>
                              <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{formatCents(item.priceCents)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedRecord.type === 'donation' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Fan Email</span>
                        <p className="text-xs text-white font-semibold">{selectedRecord.data.email}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Value</span>
                        <p className="text-xs text-violet-400 font-bold">{formatCents(selectedRecord.data.amountCents)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Concert Show</span>
                        <p className="text-xs text-zinc-300 font-semibold">{selectedRecord.data.eventTitle}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Timestamp</span>
                        <p className="text-xs text-zinc-400 font-mono">{new Date(selectedRecord.data.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="border border-zinc-900 rounded-md bg-zinc-950 p-4 space-y-2 text-xs">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Fan Message</h4>
                      <p className="text-zinc-300 font-light italic leading-relaxed">
                        "{selectedRecord.data.comment || 'No comment provided by donor.'}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Raw JSON viewer */}
                {showRawJson && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-wider block font-mono">Raw data payload</span>
                    <pre className="p-4 rounded-md border border-zinc-900 bg-zinc-950 font-mono text-[9px] text-zinc-450 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                      {JSON.stringify(selectedRecord.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer footer buttons */}
            <div className="pt-4 border-t border-zinc-900 flex gap-3">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="h-10 rounded-md bg-zinc-900 hover:bg-zinc-855 text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-800 transition flex items-center justify-center gap-1.5 select-none active:scale-95 cursor-pointer flex-1"
              >
                <span>{showRawJson ? 'Hide Payload' : 'Show Payload'}</span>
              </button>
              <button
                onClick={() => { setSelectedRecord(null); setShowRawJson(false); }}
                className="h-10 rounded-md text-xs font-semibold border transition flex items-center justify-center gap-1.5 select-none active:scale-95 cursor-pointer flex-1 bg-zinc-900 border-zinc-800 text-zinc-455 hover:bg-zinc-855 hover:text-white"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Product Submission Form Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                {editingProduct ? 'Edit Product Item' : 'Create Product Item'}
              </h3>
              <button 
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-md text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Nile Waves Vinyl Gatefold"
                  className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">SKU Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Price (Cents)</label>
                  <input
                    type="number"
                    required
                    value={productForm.priceCents}
                    onChange={(e) => setProductForm(prev => ({ ...prev, priceCents: parseInt(e.target.value) || 0 }))}
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Catalog Type</label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="MERCHANDISE">MERCHANDISE</option>
                    <option value="TICKET_DIGITAL">TICKET_DIGITAL</option>
                    <option value="VIP_EXPERIENCE">VIP_EXPERIENCE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Product Image Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none"
                  />
                  <label className="h-10 px-4 inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer select-none">
                    {uploadingImage ? 'Uploading...' : 'Browse'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProductImageUpload}
                      disabled={uploadingImage}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-md font-bold text-xs transition active:scale-95 cursor-pointer"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tour Event Form Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                {editingEvent ? 'Edit Tour Event' : 'Add Tour Event'}
              </h3>
              <button 
                onClick={() => setShowEventModal(false)}
                className="p-1 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-md text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEventSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Nile Waves LIVE"
                  className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Venue Name</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venueName}
                    onChange={(e) => setEventForm(prev => ({ ...prev, venueName: e.target.value }))}
                    placeholder="e.g. The Dome"
                    className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Address / City</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venueAddress}
                    onChange={(e) => setEventForm(prev => ({ ...prev, venueAddress: e.target.value }))}
                    placeholder="e.g. Nairobi, Kenya"
                    className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-md font-bold text-xs transition active:scale-95 cursor-pointer"
                >
                  {editingEvent ? 'Update Concert Event' : 'Create Concert Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News Article Form Modal */}
      {showNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                {editingNews ? 'Edit News Post' : 'Add News Post'}
              </h3>
              <button 
                onClick={() => setShowNewsModal(false)}
                className="p-1 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-md text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleNewsSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Article Title</label>
                  <input
                    type="text"
                    required
                    value={newsForm.title}
                    onChange={(e) => {
                      setNewsForm(prev => ({
                        ...prev,
                        title: e.target.value,
                        slug: editingNews ? prev.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      }));
                    }}
                    placeholder="e.g. Nile Waves Tour Announced"
                    className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Slug Identifier</label>
                  <input
                    type="text"
                    required
                    value={newsForm.slug}
                    onChange={(e) => setNewsForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    placeholder="e.g. tour-announced"
                    className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Post Type</label>
                  <select
                    value={newsForm.type}
                    onChange={(e) => setNewsForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="NEWS">NEWS</option>
                    <option value="DEVLOG">DEVLOG</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">Publish Timestamp</label>
                  <input
                    type="datetime-local"
                    required
                    value={newsForm.publishedAt}
                    onChange={(e) => setNewsForm(prev => ({ ...prev, publishedAt: e.target.value }))}
                    className="w-full h-10 px-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-555 uppercase tracking-wider block font-mono font-bold">HTML Body Content</label>
                <textarea
                  value={newsForm.bodyHtml}
                  onChange={(e) => setNewsForm(prev => ({ ...prev, bodyHtml: e.target.value }))}
                  placeholder="<p>Write news body here...</p>"
                  className="w-full p-4 rounded-md bg-zinc-900 border border-zinc-800 focus:border-zinc-700 text-white focus:outline-none resize-none h-32 font-mono text-[11px]"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-md font-bold text-xs transition active:scale-95 cursor-pointer"
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

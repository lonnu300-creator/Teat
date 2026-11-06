(function (root) {
  'use strict';
  const VERSION = 1;
  const DEFAULT_STATE = {
    schemaVersion: VERSION,
    business: { name: 'کسب‌وکار من', owner: '', phone: '', email: '', address: '', nationalId: '', taxId: '', logoDataUrl: '', currency: 'تومان', defaultTax: 0, invoicePrefix: 'FN' },
    settings: { theme: 'light', language: 'fa', dateMode: 'jalali', backupEndpoint: '', cloudToken: '', lastBackupAt: null },
    customers: [], products: [], invoices: [], expenses: [],
    counters: { invoice: 1001 }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function digitsToEnglish(value) {
    return String(value ?? '').replace(/[۰-۹٠-٩]/g, ch => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(ch) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(ch) : '٠١٢٣٤٥٦٧٨٩'.indexOf(ch)));
  }
  function toNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = digitsToEnglish(value).replace(/[٬,\s]/g, '').replace(/[٫]/g, '.').replace(/[^0-9.-]/g, '');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function uid(prefix) {
    const id = root.crypto && typeof root.crypto.randomUUID === 'function'
      ? root.crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix || 'id'}_${id}`;
  }
  function formatNumber(value, digits = 0) {
    return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  }
  function formatMoney(value, currency = 'تومان') { return `${formatNumber(Math.round(toNumber(value)))} ${currency || 'تومان'}`; }
  function formatDate(dateValue, mode = 'jalali') {
    if (!dateValue) return '—';
    const date = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '—';
    try {
      return new Intl.DateTimeFormat(mode === 'jalali' ? 'fa-IR-u-ca-persian' : 'fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    } catch { return date.toLocaleDateString('fa-IR'); }
  }
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function calculateInvoice(invoice) {
    const items = Array.isArray(invoice?.items) ? invoice.items : [];
    const lines = items.map(item => {
      const quantity = Math.max(0, toNumber(item.quantity));
      const unitPrice = Math.max(0, toNumber(item.unitPrice));
      const gross = quantity * unitPrice;
      const lineDiscount = clamp(toNumber(item.discount), 0, gross);
      return { ...item, quantity, unitPrice, gross, lineDiscount, net: Math.max(0, gross - lineDiscount) };
    });
    const subtotal = lines.reduce((sum, item) => sum + item.gross, 0);
    const itemDiscount = lines.reduce((sum, item) => sum + item.lineDiscount, 0);
    const invoiceDiscount = clamp(toNumber(invoice?.discount), 0, Math.max(0, subtotal - itemDiscount));
    const shipping = Math.max(0, toNumber(invoice?.shipping));
    const otherFees = Math.max(0, toNumber(invoice?.otherFees));
    const taxable = Math.max(0, subtotal - itemDiscount - invoiceDiscount + shipping + otherFees);
    const taxRate = clamp(toNumber(invoice?.taxRate), 0, 100);
    const tax = Math.round(taxable * taxRate / 100);
    const total = Math.max(0, Math.round(taxable + tax));
    const paid = clamp(toNumber(invoice?.paid), 0, total);
    const balance = Math.max(0, total - paid);
    const cost = lines.reduce((sum, item) => sum + (Math.max(0, toNumber(item.costPrice)) * item.quantity), 0);
    return { lines, subtotal, itemDiscount, invoiceDiscount, shipping, otherFees, taxable, taxRate, tax, total, paid, balance, cost, grossProfit: Math.max(0, taxable - cost) };
  }
  function normalizeState(input) {
    const base = clone(DEFAULT_STATE);
    if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
    const out = { ...base, ...input };
    out.schemaVersion = VERSION;
    out.business = { ...base.business, ...(input.business || {}) };
    out.settings = { ...base.settings, ...(input.settings || {}) };
    out.counters = { ...base.counters, ...(input.counters || {}) };
    for (const key of ['customers', 'products', 'invoices', 'expenses']) out[key] = Array.isArray(input[key]) ? input[key] : [];
    out.settings.cloudToken = '';
    return out;
  }
  function validateBackup(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('ساختار فایل پشتیبان معتبر نیست.');
    const payload = input.data && typeof input.data === 'object' ? input.data : input;
    const normalized = normalizeState(payload);
    const total = normalized.customers.length + normalized.products.length + normalized.invoices.length + normalized.expenses.length;
    if (total > 200000) throw new Error('تعداد رکوردهای فایل پشتیبان بیش از حد مجاز است.');
    return normalized;
  }
  function monthKey(dateValue) {
    const d = new Date(`${dateValue || todayISO()}T12:00:00`);
    if (Number.isNaN(d.getTime())) return todayISO().slice(0, 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  function aggregate(state, startDate, endDate) {
    const inRange = date => (!startDate || date >= startDate) && (!endDate || date <= endDate);
    const invoices = state.invoices.filter(x => x.type === 'sale' && inRange(x.date));
    const expenses = state.expenses.filter(x => inRange(x.date));
    const sales = invoices.reduce((s, x) => s + calculateInvoice(x).total, 0);
    const paid = invoices.reduce((s, x) => s + calculateInvoice(x).paid, 0);
    const receivable = invoices.reduce((s, x) => s + calculateInvoice(x).balance, 0);
    const expenseTotal = expenses.reduce((s, x) => s + toNumber(x.amount), 0);
    const costOfGoods = invoices.reduce((s, x) => s + calculateInvoice(x).cost, 0);
    return { sales, paid, receivable, expenses: expenseTotal, costOfGoods, net: sales - expenseTotal - costOfGoods, invoiceCount: invoices.length, expenseCount: expenses.length };
  }
  function monthlySeries(state, count = 6) {
    const now = new Date();
    const months = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' }).format(d);
      const sales = state.invoices.filter(x => x.type === 'sale' && monthKey(x.date) === key).reduce((s, x) => s + calculateInvoice(x).total, 0);
      const expenses = state.expenses.filter(x => monthKey(x.date) === key).reduce((s, x) => s + toNumber(x.amount), 0);
      months.push({ key, label, sales, expenses });
    }
    return months;
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function xmlEscape(value) { return escapeHtml(value).replace(/&#39;/g, '&apos;'); }
  function defaultState() { return clone(DEFAULT_STATE); }

  const api = { VERSION, DEFAULT_STATE, defaultState, clone, digitsToEnglish, toNumber, clamp, uid, formatNumber, formatMoney, formatDate, todayISO, calculateInvoice, normalizeState, validateBackup, aggregate, monthlySeries, escapeHtml, xmlEscape, monthKey };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FarnavaCore = api;
})(typeof window !== 'undefined' ? window : globalThis);

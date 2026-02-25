import { create } from 'zustand';
import instrumentsData from '../data/instruments';
import bankAccountsData from '../data/bankAccounts';
import { getRate } from '../data/fxRates';
import { dispatchNotification } from '../utils/eventDispatcher';

const OMS_API_BASE = 'http://localhost:4002';

const INITIAL_ORDER_FORM = {
  bankAccountId: '',
  transactionType: 'buy',
  orderType: 'MKT',
  orderBy: 'quantity',
  quantity: '',
  amount: '',
  limitPrice: '',
  feeExceptionApplicable: false,
  exceptionFeePercent: '',
  // SIP/SWP fields
  placeFirstOrderToday: false,
  startDate: '',
  frequency: '',
  tenure: '',
  numberOfUnits: '',
  installmentAmount: '',
};

const useOmsStore = create((set, get) => ({
  // Instruments — start with local mock, replaced by API data when available
  instruments: instrumentsData,
  instrumentsLoading: false,
  instrumentsError: null,
  instrumentsSource: 'mock', // 'mock' | 'api'

  bankAccounts: bankAccountsData,

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  filteredInstruments: () => {
    const { instruments, searchQuery } = get();
    if (!searchQuery.trim()) return instruments;
    const q = searchQuery.toLowerCase();
    return instruments.filter(
      (ins) =>
        ins.name.toLowerCase().includes(q) ||
        ins.ticker.toLowerCase().includes(q) ||
        ins.assetType.toLowerCase().includes(q) ||
        ins.subAssetType.toLowerCase().includes(q)
    );
  },

  /**
   * Fetch instruments from the Fastify OMS API.
   * Falls back to local mock data if the API is unreachable.
   */
  fetchInstruments: async () => {
    set({ instrumentsLoading: true, instrumentsError: null });
    try {
      const res = await fetch(`${OMS_API_BASE}/api/instruments`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      set({
        instruments: data,
        instrumentsLoading: false,
        instrumentsSource: 'api',
      });
    } catch (err) {
      console.warn('OMS API unavailable, using mock instruments:', err);
      set({
        instruments: instrumentsData,
        instrumentsLoading: false,
        instrumentsError: err.message || 'Unknown error',
        instrumentsSource: 'mock',
      });
    }
  },

  selectedInstrument: null,
  selectInstrument: (instrument) => set({ selectedInstrument: instrument }),
  clearSelectedInstrument: () => set({ selectedInstrument: null }),

  orderForm: { ...INITIAL_ORDER_FORM },

  setOrderField: (field, value) =>
    set((state) => ({
      orderForm: { ...state.orderForm, [field]: value },
    })),

  setTransactionType: (type) =>
    set((state) => {
      const isSipSwp = type === 'sip' || type === 'swp';
      return {
        orderForm: {
          ...state.orderForm,
          transactionType: type,
          orderType: isSipSwp ? 'MKT' : state.orderForm.orderType,
          ...(isSipSwp
            ? {}
            : {
                placeFirstOrderToday: false,
                startDate: '',
                frequency: '',
                tenure: '',
                numberOfUnits: '',
                installmentAmount: '',
              }),
        },
      };
    }),

  resetOrderForm: () =>
    set({ orderForm: { ...INITIAL_ORDER_FORM } }),

  getSelectedBankAccount: () => {
    const { bankAccounts, orderForm } = get();
    return bankAccounts.find((ba) => ba.id === orderForm.bankAccountId) || null;
  },

  getFxRate: () => {
    const { selectedInstrument } = get();
    const bankAccount = get().getSelectedBankAccount();
    if (!selectedInstrument || !bankAccount) return null;
    return getRate(bankAccount.currency, selectedInstrument.currency);
  },

  getEffectivePrice: () => {
    const { selectedInstrument, orderForm } = get();
    if (!selectedInstrument) return 0;
    if (orderForm.orderType === 'LMT' && parseFloat(orderForm.limitPrice) > 0) {
      return parseFloat(orderForm.limitPrice);
    }
    return selectedInstrument.price;
  },

  getTotalAmount: () => {
    const { orderForm } = get();
    const price = get().getEffectivePrice();

    if (orderForm.orderBy === 'amount') {
      const amt = parseFloat(orderForm.amount);
      return !isNaN(amt) && amt > 0 ? Math.round(amt * 100) / 100 : 0;
    }

    const qty = parseFloat(orderForm.quantity);
    if (isNaN(qty) || qty <= 0 || price <= 0) return 0;
    return Math.round(price * qty * 100) / 100;
  },

  getDerivedQuantity: () => {
    const { orderForm } = get();
    if (orderForm.orderBy !== 'amount') return null;
    const amt = parseFloat(orderForm.amount);
    const price = get().getEffectivePrice();
    if (isNaN(amt) || amt <= 0 || price <= 0) return null;
    return Math.round((amt / price) * 10000) / 10000;
  },

  getTotalInAccountCurrency: () => {
    const total = get().getTotalAmount();
    const fxRate = get().getFxRate();
    if (!fxRate || total === 0) return null;
    return Math.round((total / fxRate) * 100) / 100;
  },

  isSubmitting: false,

  /**
   * Submit an order via the Fastify OMS API.
   * Falls back to simulated local submission if the API is unreachable.
   */
  submitOrder: async () => {
    const { selectedInstrument, orderForm } = get();
    const bankAccount = get().getSelectedBankAccount();
    const total = get().getTotalAmount();

    const hasQuantityOrAmount =
      orderForm.orderBy === 'quantity'
        ? parseFloat(orderForm.quantity) > 0
        : parseFloat(orderForm.amount) > 0;

    if (!selectedInstrument || !bankAccount || !hasQuantityOrAmount || total <= 0) {
      dispatchNotification({
        type: 'error',
        title: 'Order Validation Failed',
        message: 'Please fill in all required fields.',
      });
      return false;
    }

    set({ isSubmitting: true });
    try {
      const res = await fetch(`${OMS_API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instrumentId: selectedInstrument.id,
          ticker: selectedInstrument.ticker,
          currency: selectedInstrument.currency,
          transactionType: orderForm.transactionType,
          orderType: orderForm.orderType,
          orderBy: orderForm.orderBy,
          quantity: orderForm.quantity,
          amount: orderForm.amount,
          limitPrice: orderForm.limitPrice,
          bankAccountId: orderForm.bankAccountId,
          totalAmount: total,
          feeExceptionApplicable: orderForm.feeExceptionApplicable,
          exceptionFeePercent: orderForm.exceptionFeePercent,
          // SIP/SWP fields
          ...(orderForm.transactionType === 'sip' || orderForm.transactionType === 'swp'
            ? {
                placeFirstOrderToday: orderForm.placeFirstOrderToday,
                startDate: orderForm.startDate,
                frequency: orderForm.frequency,
                tenure: orderForm.tenure,
                numberOfUnits: orderForm.numberOfUnits,
                installmentAmount: orderForm.installmentAmount,
              }
            : {}),
        }),
      });

      const data = await res.json();
      const txLabel = orderForm.transactionType.toUpperCase();

      if (res.ok && data.status === 'success') {
        dispatchNotification({
          type: 'success',
          title: 'Order Placed Successfully',
          message: data.message || `${txLabel} ${orderForm.orderType} order for ${selectedInstrument.ticker} placed at ${selectedInstrument.currency} ${total.toLocaleString()}.`,
        });
        get().resetOrderForm();
        set({ isSubmitting: false });
        return true;
      } else {
        dispatchNotification({
          type: 'error',
          title: 'Order Failed',
          message: data.message || `Failed to place ${txLabel} order for ${selectedInstrument.ticker}. Please try again.`,
        });
        set({ isSubmitting: false });
        return false;
      }
    } catch (err) {
      // Fallback: if API is down, simulate locally
      console.warn('OMS API unreachable for order submission, simulating locally:', err);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const success = Math.random() > 0.15;
      const txLabel = orderForm.transactionType.toUpperCase();

      if (success) {
        dispatchNotification({
          type: 'success',
          title: 'Order Placed Successfully',
          message: `${txLabel} ${orderForm.orderType} order for ${selectedInstrument.ticker} placed at ${selectedInstrument.currency} ${total.toLocaleString()}. (local simulation)`,
        });
        get().resetOrderForm();
        set({ isSubmitting: false });
        return true;
      } else {
        dispatchNotification({
          type: 'error',
          title: 'Order Failed',
          message: `Failed to place ${txLabel} order for ${selectedInstrument.ticker}. Please try again.`,
        });
        set({ isSubmitting: false });
        return false;
      }
    }
  },
}));

export default useOmsStore;

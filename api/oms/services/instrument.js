'use strict';

/**
 * Instrument Service — Business Logic
 *
 * Contains mock instrument data, search/filter logic, and order simulation.
 * When LoopBack endpoints are identified, replace mock data with proxyToLoopback() calls.
 */

const { proxyToLoopback } = require('@mfe/shared');

// ── Mock Data ───────────────────────────────────────────────
// Will be replaced with LoopBack API calls when endpoints are known

const MOCK_INSTRUMENTS = [
  { id: 'INS001', name: 'Apple Inc.', ticker: 'AAPL', assetType: 'Equity', subAssetType: 'Large Cap', currency: 'USD', price: 187.44, exchange: 'NASDAQ', factsheetUrl: 'https://finance.yahoo.com/quote/AAPL' },
  { id: 'INS002', name: 'Microsoft Corp.', ticker: 'MSFT', currency: 'USD', assetType: 'Equity', subAssetType: 'Large Cap', price: 420.72, exchange: 'NASDAQ', factsheetUrl: 'https://finance.yahoo.com/quote/MSFT' },
  { id: 'INS003', name: 'iShares Core S&P 500 ETF', ticker: 'IVV', currency: 'USD', assetType: 'ETF', subAssetType: 'Index Fund', price: 525.38, exchange: 'NYSE', factsheetUrl: 'https://finance.yahoo.com/quote/IVV' },
  { id: 'INS004', name: 'Vanguard FTSE Europe ETF', ticker: 'VGK', currency: 'EUR', assetType: 'ETF', subAssetType: 'International', price: 68.15, exchange: 'NYSE', factsheetUrl: 'https://finance.yahoo.com/quote/VGK' },
  { id: 'INS005', name: 'US Treasury Bond 10Y', ticker: 'UST10Y', currency: 'USD', assetType: 'Fixed Income', subAssetType: 'Government Bond', price: 98.75, exchange: 'OTC', factsheetUrl: '#' },
  { id: 'INS006', name: 'Nestlé S.A.', ticker: 'NESN', currency: 'CHF', assetType: 'Equity', subAssetType: 'Consumer Staples', price: 98.32, exchange: 'SIX', factsheetUrl: 'https://finance.yahoo.com/quote/NSRGY' },
  { id: 'INS007', name: 'Toyota Motor Corp.', ticker: '7203', currency: 'JPY', assetType: 'Equity', subAssetType: 'Automotive', price: 2635.0, exchange: 'TSE', factsheetUrl: 'https://finance.yahoo.com/quote/TM' },
  { id: 'INS008', name: 'Reliance Industries Ltd.', ticker: 'RELIANCE', currency: 'INR', assetType: 'Equity', subAssetType: 'Conglomerate', price: 2480.5, exchange: 'NSE', factsheetUrl: 'https://finance.yahoo.com/quote/RELIANCE.NS' },
  { id: 'INS009', name: 'PIMCO Total Return Fund', ticker: 'PTTRX', currency: 'USD', assetType: 'Mutual Fund', subAssetType: 'Bond Fund', price: 8.92, exchange: 'OTC', factsheetUrl: '#' },
  { id: 'INS010', name: 'Gold Futures (GC)', ticker: 'GC=F', currency: 'USD', assetType: 'Commodity', subAssetType: 'Precious Metal', price: 2345.6, exchange: 'COMEX', factsheetUrl: 'https://finance.yahoo.com/quote/GC=F' },
];

// ── Service Methods ─────────────────────────────────────────

/**
 * Get all instruments, optionally filtered by search query.
 *
 * @param {string} [search] - Filter by name, ticker, asset type, or sub-asset type
 * @returns {Array} Filtered list of instruments
 */
function getInstruments(search) {
  if (!search || !search.trim()) {
    return MOCK_INSTRUMENTS;
  }

  const q = search.toLowerCase();
  return MOCK_INSTRUMENTS.filter(
    (ins) =>
      ins.name.toLowerCase().includes(q) ||
      ins.ticker.toLowerCase().includes(q) ||
      ins.assetType.toLowerCase().includes(q) ||
      ins.subAssetType.toLowerCase().includes(q)
  );
}

/**
 * Get a single instrument by ID.
 *
 * @param {string} id - Instrument ID
 * @returns {object|null} The instrument or null if not found
 */
function getInstrumentById(id) {
  return MOCK_INSTRUMENTS.find((ins) => ins.id === id) || null;
}

/**
 * Simulate placing an order.
 *
 * @param {object} orderData - Order details
 * @returns {Promise<object>} Order result
 */
async function placeOrder(orderData) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const success = Math.random() > 0.15;

  if (success) {
    return {
      status: 'success',
      orderId: `ORD-${Date.now()}`,
      message: `${orderData.transactionType.toUpperCase()} order placed successfully`,
      data: orderData,
    };
  }

  return {
    status: 'error',
    message: `Failed to place ${orderData.transactionType.toUpperCase()} order. Please try again.`,
  };
}

module.exports = {
  getInstruments,
  getInstrumentById,
  placeOrder,
};

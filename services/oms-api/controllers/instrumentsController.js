'use strict';

const cache = require('../lib/redis-cache');

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

async function listInstruments(request, reply) {
  const { search } = request.query;
  const searchKey = (search && search.trim()) ? search.trim() : '';

  const cacheKey = `oms:instruments:list:${searchKey}`;
  const cached = cache.isEnabled() ? await cache.get(cacheKey) : null;
  if (cached) {
    reply.send(cached);
    return;
  }

  let instruments = MOCK_INSTRUMENTS;
  if (searchKey) {
    const q = searchKey.toLowerCase();
    instruments = instruments.filter(
      (ins) =>
        ins.name.toLowerCase().includes(q) ||
        ins.ticker.toLowerCase().includes(q) ||
        ins.assetType.toLowerCase().includes(q) ||
        ins.subAssetType.toLowerCase().includes(q)
    );
  }

  if (cache.isEnabled()) await cache.set(cacheKey, instruments);
  reply.send(instruments);
}

async function getInstrumentById(request, reply) {
  const { id } = request.params;
  const cacheKey = `oms:instruments:id:${id}`;
  const cached = cache.isEnabled() ? await cache.get(cacheKey) : null;
  if (cached) {
    reply.send(cached);
    return;
  }

  const instrument = MOCK_INSTRUMENTS.find((ins) => ins.id === id);
  if (!instrument) {
    reply.code(404).send({ error: 'Not Found', message: `Instrument ${id} not found` });
    return;
  }

  if (cache.isEnabled()) await cache.set(cacheKey, instrument);
  reply.send(instrument);
}

async function createOrder(request, reply) {
  const orderData = request.body;

  if (!orderData || !orderData.instrumentId || !orderData.transactionType) {
    reply.code(400).send({
      error: 'Validation Failed',
      message: 'instrumentId and transactionType are required',
    });
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1200));

  const success = Math.random() > 0.15;

  if (success) {
    reply.code(201).send({
      status: 'success',
      orderId: `ORD-${Date.now()}`,
      message: `${orderData.transactionType.toUpperCase()} order placed successfully`,
      data: orderData,
    });
  } else {
    reply.code(500).send({
      status: 'error',
      message: `Failed to place ${orderData.transactionType.toUpperCase()} order. Please try again.`,
    });
  }
}

module.exports = {
  listInstruments,
  getInstrumentById,
  createOrder,
};

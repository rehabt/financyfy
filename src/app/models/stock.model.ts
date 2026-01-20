export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface StockInfo {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  high52Week: number;
  low52Week: number;
  dividendYield: number;
  sector: string;
  industry: string;
  description: string;
}

export interface HistoricalData {
  dates: string[];
  prices: number[];
  ohlc: OHLCData[];
}

export interface OHLCData {
  x: string;
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface GainerLoser {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface GainersLosersResponse {
  gainers: GainerLoser[];
  losers: GainerLoser[];
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  StockData, 
  MarketIndex, 
  StockInfo, 
  HistoricalData, 
  GainersLosersResponse 
} from '../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  getTrendingStocks(): Observable<StockData[]> {
    return this.http.get<StockData[]>(`${this.apiUrl}/trending`);
  }

  getMarketIndices(): Observable<MarketIndex[]> {
    return this.http.get<MarketIndex[]>(`${this.apiUrl}/indices`);
  }

  getStockInfo(ticker: string): Observable<StockInfo> {
    return this.http.get<StockInfo>(`${this.apiUrl}/stock/${ticker}`);
  }

  getHistoricalData(ticker: string, period: string = '1mo'): Observable<HistoricalData> {
    return this.http.get<HistoricalData>(`${this.apiUrl}/stock/${ticker}/history?period=${period}`);
  }

  getGainersLosers(): Observable<GainersLosersResponse> {
    return this.http.get<GainersLosersResponse>(`${this.apiUrl}/gainers-losers`);
  }

  exportData(ticker: string, format: string, period: string = '1mo'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/stock/${ticker}/export/${format}?period=${period}`, {
      responseType: 'blob'
    });
  }
}

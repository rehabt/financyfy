import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { StockService } from './services/stock.service';
import { 
  StockData, 
  MarketIndex, 
  StockInfo, 
  GainerLoser 
} from './models/stock.model';

declare var Chart: any; // Declare Chart.js

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'YFinance Market Dashboard';
  Math = Math;  // Make Math available in template
  
  private chart: any = null;
  
  // Data properties
  marketIndices: MarketIndex[] = [];
  trendingStocks: StockData[] = [];
  gainers: GainerLoser[] = [];
  losers: GainerLoser[] = [];
  selectedStock: StockInfo | null = null;
  chartData: any = null;
  rawChartData: any = null; // Store raw data for re-rendering with different chart types
  
  // UI state
  searchTicker: string = '';
  selectedPeriod: string = '1mo';
  chartType: string = 'line';
  loading = {
    indices: false,
    trending: false,
    gainersLosers: false,
    stockInfo: false,
    chart: false
  };
  
  private refreshSubscription?: Subscription;
  
  periods = [
    { value: '5d', label: '5 Days' },
    { value: '1mo', label: '1 Month' },
    { value: '3mo', label: '3 Months' },
    { value: '6mo', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: '5y', label: '5 Years' }
  ];

  constructor(private stockService: StockService) {}

  ngOnInit(): void {
    this.loadAllData();
    
    // Auto-refresh every 60 seconds
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadAllData();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  loadAllData(): void {
    this.loadMarketIndices();
    this.loadTrendingStocks();
    this.loadGainersLosers();
  }

  loadMarketIndices(): void {
    this.loading.indices = true;
    this.stockService.getMarketIndices().subscribe({
      next: (data) => {
        this.marketIndices = data;
        this.loading.indices = false;
      },
      error: (error) => {
        console.error('Error loading market indices:', error);
        this.loading.indices = false;
      }
    });
  }

  loadTrendingStocks(): void {
    this.loading.trending = true;
    this.stockService.getTrendingStocks().subscribe({
      next: (data) => {
        this.trendingStocks = data;
        this.loading.trending = false;
      },
      error: (error) => {
        console.error('Error loading trending stocks:', error);
        this.loading.trending = false;
      }
    });
  }

  loadGainersLosers(): void {
    this.loading.gainersLosers = true;
    this.stockService.getGainersLosers().subscribe({
      next: (data) => {
        this.gainers = data.gainers;
        this.losers = data.losers;
        this.loading.gainersLosers = false;
      },
      error: (error) => {
        console.error('Error loading gainers/losers:', error);
        this.loading.gainersLosers = false;
      }
    });
  }

  searchStock(): void {
    if (!this.searchTicker.trim()) return;
    
    const ticker = this.searchTicker.toUpperCase().trim();
    this.loadStockInfo(ticker);
  }

  loadStockInfo(ticker: string): void {
    this.loading.stockInfo = true;
    this.loading.chart = true;
    
    this.stockService.getStockInfo(ticker).subscribe({
      next: (data) => {
        this.selectedStock = data;
        this.loading.stockInfo = false;
        this.loadChart(ticker);
      },
      error: (error) => {
        console.error('Error loading stock info:', error);
        alert(`Error loading data for ${ticker}. Please check the ticker symbol.`);
        this.loading.stockInfo = false;
        this.loading.chart = false;
      }
    });
  }

  loadChart(ticker: string): void {
    this.stockService.getHistoricalData(ticker, this.selectedPeriod).subscribe({
      next: (data) => {
        console.log('Chart data received:', data); // Debug log
        
        if (!data.dates || !data.prices || data.dates.length === 0) {
          console.error('Invalid chart data received');
          this.loading.chart = false;
          return;
        }
        
        // Store raw data for chart type switching
        this.rawChartData = {
          ticker: ticker,
          dates: data.dates,
          prices: data.prices,
          ohlc: data.ohlc || []
        };
        
        console.log('Raw chart data:', this.rawChartData); // Debug log
        
        this.prepareChartData();
        this.loading.chart = false;
        
        // Render chart after data is loaded
        setTimeout(() => this.renderChart(), 100);
      },
      error: (error) => {
        console.error('Error loading chart data:', error);
        this.loading.chart = false;
      }
    });
  }
  
  private prepareChartData(): void {
    if (!this.rawChartData) return;
    
    if (this.chartType === 'candlestick') {
      console.log('Preparing candlestick chart with OHLC data:', this.rawChartData.ohlc);
      
      // Check if OHLC data is available
      if (!this.rawChartData.ohlc || this.rawChartData.ohlc.length === 0) {
        console.error('No OHLC data available for candlestick chart');
        alert('Candlestick data not available. Please try a different time period.');
        this.chartType = 'line';
        this.prepareChartData();
        return;
      }
      
      // Create separate datasets for bullish and bearish candles
      const bullishData: any[] = [];
      const bearishData: any[] = [];
      
      this.rawChartData.ohlc.forEach((item: any) => {
        const isBullish = item.c >= item.o;
        const candle = {
          x: item.x,
          y: [item.l, item.o, item.c, item.h] // [low, open, close, high]
        };
        
        if (isBullish) {
          bullishData.push(candle);
          bearishData.push({ x: item.x, y: [0, 0, 0, 0] });
        } else {
          bearishData.push(candle);
          bullishData.push({ x: item.x, y: [0, 0, 0, 0] });
        }
      });
      
      this.chartData = {
        labels: this.rawChartData.dates,
        datasets: [
          {
            label: 'Bullish',
            data: bullishData,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2
          },
          {
            label: 'Bearish',
            data: bearishData,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgba(239, 68, 68, 1)',
            borderWidth: 2
          }
        ]
      };
    } else {
      this.chartData = {
        labels: this.rawChartData.dates,
        datasets: [{
          label: this.rawChartData.ticker,
          data: this.rawChartData.prices,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.1,
          fill: true,
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5
        }]
      };
    }
    console.log('Chart data prepared:', this.chartData); // Debug log
  }
  
  private renderChart(): void {
    const canvas = document.getElementById('stockChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }
    
    if (!this.chartData) {
      console.error('No chart data available');
      return;
    }
    
    console.log('Rendering chart with type:', this.chartType); // Debug log
    
    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }
    
    try {
      // Check if candlestick chart type is available
      if (this.chartType === 'candlestick' && typeof Chart.controllers.candlestick === 'undefined') {
        console.warn('Candlestick chart type not available. Using bar chart with OHLC styling.');
      }

      // Calculate y-axis range for better scaling
      let yMin: number | undefined = undefined;
      let yMax: number | undefined = undefined;
      
      if (this.chartType === 'candlestick' && this.rawChartData?.ohlc) {
        const allValues = this.rawChartData.ohlc.flatMap((item: any) => [item.o, item.h, item.l, item.c]);
        yMin = Math.min(...allValues);
        yMax = Math.max(...allValues);
        // Add 2% padding
        const padding = (yMax - yMin) * 0.02;
        yMin = yMin - padding;
        yMax = yMax + padding;
      } else if (this.rawChartData?.prices) {
        yMin = Math.min(...this.rawChartData.prices);
        yMax = Math.max(...this.rawChartData.prices);
        // Add 2% padding
        const padding = (yMax - yMin) * 0.02;
        yMin = yMin - padding;
        yMax = yMax + padding;
      }

      this.chart = new Chart(ctx, {
        type: this.chartType === 'candlestick' ? 'bar' : 'line',
        data: this.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          parsing: this.chartType === 'candlestick' ? {
            yAxisKey: 'y'
          } : undefined,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: this.chartType === 'candlestick' ? {
                label: function(context: any) {
                  const data = context.raw;
                  if (data && data.y && Array.isArray(data.y)) {
                    const [low, open, close, high] = data.y;
                    if (high === 0) return null; // Skip empty candles
                    return [
                      `Open: $${open.toFixed(2)}`,
                      `High: $${high.toFixed(2)}`,
                      `Low: $${low.toFixed(2)}`,
                      `Close: $${close.toFixed(2)}`
                    ];
                  }
                  return null;
                }
              } : undefined
            }
          },
          scales: this.chartType === 'candlestick' ? {
            x: {
              stacked: true,
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            },
            y: {
              min: yMin,
              max: yMax,
              ticks: {
                callback: function(value: any) {
                  return '$' + value.toFixed(2);
                }
              }
            }
          } : {
            y: {
              min: yMin,
              max: yMax,
              ticks: {
                callback: function(value: any) {
                  return '$' + value.toFixed(2);
                }
              }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });
      console.log('Chart rendered successfully', 'Chart instance:', this.chart);
    } catch (error) {
      console.error('Error rendering chart:', error);
    }
  }

  changePeriod(period: string): void {
    this.selectedPeriod = period;
    if (this.selectedStock) {
      this.loadChart(this.selectedStock.ticker);
    }
  }

  changeChartType(type: string): void {
    this.chartType = type;
    if (this.rawChartData) {
      this.prepareChartData();
      this.renderChart();
    }
  }

  exportData(format: string): void {
    if (!this.selectedStock) return;
    
    this.stockService.exportData(this.selectedStock.ticker, format, this.selectedPeriod).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedStock!.ticker}_${this.selectedPeriod}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
      }
    });
  }

  selectTrendingStock(ticker: string): void {
    console.log('Stock clicked:', ticker); // Debug log
    this.searchTicker = ticker;
    this.searchStock();
    // Scroll to stock details
    setTimeout(() => {
      const stockSection = document.querySelector('.stock-details-section');
      if (stockSection) {
        stockSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatLargeNumber(num: number | undefined): string {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toLocaleString();
  }

  getChangeClass(change: number): string {
    return change >= 0 ? 'positive' : 'negative';
  }
}

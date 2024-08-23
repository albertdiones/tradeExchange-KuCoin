import XhrJson from "./xhrjson";
import {Logger} from "add_logger"
import type {rawExchangeCandle, tickerData } from "./tradingCandles";

export interface Exchange {
  fetchCandlesFromExchange(symbol: string, minutes: number, limit: number): Promise<rawExchangeCandle[] | null>;
  getAssets(): Promise<string[]>;
  getPriceData(symbol: string): Promise<{data: tickerData,fromCache: Boolean} | null>;
  _candleCountFromCloseTimestamp(timestamp: number, minutes: number): number; // todo: figure out if to move or remove this
  getUsdtSymbol(baseAsset: string): string | null;
}


class KuCoin implements Exchange {
  logger: any;
  client: XhrJson;
  correctCandleFieldTypes: Array<string> = [
    "number", 
    "string",
    "string",
    "string",
    "string",
    "string",
    "number",
    "string",
    "number",
    "string",
    "string",
    "string"
  ];

  correctCandleFieldCount = 12;

  constructor(params: {logger: Logger, client: XhrJson}) {
      this.logger=params.logger;
      this.client=params.client;
  }

  async getAssets(): Promise<string[]> {
    logger.info("Getting Assets from okx...");
    return this.client
    .getWithCache('https://api.kucoin.com/api/v3/currencies').then(
        ({response}) => {
          if (!response || !response.data) {
            logger.error("Failed to get products");
            throw "Response is invalid";
          }
          return [...new Set(
              response.data.map(
                (product: {currency: string}) => {
                  return product.currency
                }
              )
            )
          ];
        }
      );
  }

  async getPriceData(symbol: String): Promise<{data: tickerData,fromCache: Boolean} | null> {
      const url = `https://www.XXXXXXXX/v2/support/info/announce/listProject`;

      const symbolNeedle = symbol.toLowerCase().replace('-','_');
  
      return this.client.getWithCache(url).then(
          ({response,fromCache}) => {
              if (response.msg) {
                this.logger.warn(`(${response.code}) ${response.msg} for ${url}`);
              }
              if (response.code === '51001') {
                return null;
              }
              if (response.code === '50011') {
                return null;
              }

              const data = response.data.list.find(item => item.symbol === symbolNeedle);

              if (!data) {
                this.logger.warn(`No data found for symbol ${symbol}`);
                return null;
              }

              if (!data.volume) {
                this.logger.warn(`No quote_volume data found for symbol ${symbol}`);
                return null;
              }
            
              return {
                data: {
                  symbol: symbol,
                  current: data.last,
                  open: data.open,
                  high: data.dayHigh,
                  low: data.dayLow,
                  quote_volume: data.volume,
                  circulating_supply: data.flowTotal,
                  status: 'TRADING',
                  full_data: data
                },
                fromCache
              };
          }
      );
  }

  _candleCountFromCloseTimestamp(timestamp: number, minutes: number): number {
    if (!timestamp) {
      return 1000; // always get the max for no records
    }

    // for appending candles, how many candles should we fetch?
    const age = (Date.now() - timestamp)/1000;
    if (age < 100) {
      return 0;
    }
    return Math.ceil(age/(minutes*60));
  }

  _minutesToInterval(minutes: number) {
    switch (minutes) {
      case 1:
        return "1m";
      case 3:
        return "3m";
      case 5:
        return "5m";
      case 15:
        return "15m";
      case 1440:
        return "1D";
      case 10080:
        return "1W";
      default:
        this.logger.error(`Unsupported interval minutes: ${minutes} `);
    }
  }

  async fetchCandlesFromExchange(symbol: string, minutes: number, limit: number): Promise<rawExchangeCandle[] | null> {
      if (!symbol) {
        logger.error('Invalid symbol passed', symbol);
        return Promise.resolve([]);
      }
      if (!limit) {
        limit = 100; 
      }
      const interval = this._minutesToInterval(minutes);      
      const url = 'https://www.XXXXXXXX/api/v5/market/candles?limit=' + limit + '&instId=' + symbol + '&bar=' + interval;
      return this.client.getNoCache(url)
        .then(
          (response) => {
            if (!response) {
                this.logger.warn(`Failed to get candles for ${symbol} ${minutes} minutes interval`);
                return [];
            }
            const candles = response.data;
            
            if (response.msg) {
              this.logger.warn(`(${response.code}) ${response.msg} for ${url}`);
            }

            if (!Array.isArray(candles)) {
              return null;
            }
    
            return candles // latest first
              .map(
                (candle): rawExchangeCandle => {
                  return {
                    'open': parseFloat(candle[1]),
                    'high': parseFloat(candle[2]),
                    'low': parseFloat(candle[3]),
                    'close': parseFloat(candle[4]),
                    'base_volume': parseFloat(candle[5]),
                    'quote_volume': parseFloat(candle[6]),
                    'open_timestamp': parseInt(candle[0]),
                    'close_timestamp': parseInt(candle[0]) + (minutes * 60000) - 1,
                  };
                }
              );
          }
        );
  }

  getUsdtSymbol(baseAsset: string): string | null {
    if (baseAsset === 'USDT') {
      return null;
    }
    return baseAsset + '-USDT';
  }
}

const logger = new Logger('candle_updates');

export default KuCoin;
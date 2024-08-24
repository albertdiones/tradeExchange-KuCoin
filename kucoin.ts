import {Logger} from "add_logger"

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
    this.logger.info("Getting assets...");
    return this.client
      .getWithCache('https://api.kucoin.com/api/v3/currencies').then(
          ({response}) => {
            if (!response?.data) {
              this.logger.error("Failed to get products");
              throw "Response is invalid";
            }

            const assets = response.data.map(
              (product: {currency: string}) => product.currency
            );
            
            return Array.from(
              new Set(assets)
            );
          }
        );
  }

  async getTickerData(symbol: string): Promise<{data: TickerData,fromCache: Boolean} | null> {
      const url = `https://www.kucoin.com/_api/market-front/trade/search?currentPage=1&pageSize=1500&returnAll=true&lang=en_US`;

      const symbolNeedle = symbol.toLowerCase().replace('-','_');
  
      return this.client.getWithCache(url).then(
          ({response,fromCache}) => {

              const data = response?.data?.currencies?.items.find(
                (product: {symbolCode: string}) => {
                  return product.symbolCode === symbol;
                }
              );

              if (!data) {
                return null;
              }

              if (data.last === null) {
                this.logger.warn(`Error: price is null for symbol ${symbol}`);
                return null;
              }

              if (!data) {
                this.logger.warn(`No data found for symbol ${symbol}`);
                return null;
              }

              if (!data.volValue) {
                this.logger.warn(`No quote_volume data found for symbol ${symbol}`);
                return null;
              }

              const tickerData: TickerData = {
                symbol: symbol,
                current: data.last,
                high: data.high,
                low: data.low,
                base_volume: data.vol,
                quote_volume: data.volValue,
                circulating_supply: data.marketValue/data.last,
                status: 'TRADING',
                full_data: response.data
              };
            
              return {
                data: tickerData,
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

    // if the latest candle is just 100ms old, just skip the update
    if (age < 100) {
      return 0;
    }
    
    return Math.ceil(age/(minutes*60));
  }

  _minutesToInterval(minutes: number) {
    switch (minutes) {
      case 1:
        return "1min";
      case 3:
        return "3min";
      case 5:
        return "5min";
      case 15:
        return "15min";
      case 1440:
        return "1day";
      case 10080:
        return "1week";
      default:
        this.logger.error(`Unsupported interval minutes: ${minutes} `);
    }
  }

  async fetchCandlesFromExchange(symbol: string, minutes: number, limit: number): Promise<rawExchangeCandle[] | null> {
      if (!symbol) {
        this.logger.error('Invalid symbol passed', symbol);
        return Promise.resolve([]);
      }
      const endAt = Date.now()/1000;
      const startAt = endAt - (minutes*60*limit);
      const interval = this._minutesToInterval(minutes);      
      const url = `https://api.kucoin.com/api/v1/market/candles?type=${interval}&symbol=${symbol}&startAt=${Math.floor(startAt)}&endAt=${Math.floor(endAt)}`;
      return this.client.getNoCache(url)
        .then(
          (responseObject) => {

            const response = responseObject as { data: string[][] };
            if (!response) {
                this.logger.warn(`Failed to get candles for ${symbol} ${minutes} minutes interval`);
                return [];
            }
            const candles = response.data;
            
            if (!Array.isArray(candles)) {
              console.error('error', candles, response, );
              // error?
              return null;
            }

    
            return candles // latest first
              .map(
                (candle): rawExchangeCandle => {
                  const open_timestamp = parseInt(candle[0])*1000;
                  return {
                    'open': parseFloat(candle[1]),
                    'high': parseFloat(candle[3]),
                    'low': parseFloat(candle[4]),
                    'close': parseFloat(candle[2]),
                    'base_volume': parseFloat(candle[5]),
                    'quote_volume': parseFloat(candle[6]),
                    'open_timestamp': open_timestamp,
                    'close_timestamp': open_timestamp + (minutes * 60000) - 1,
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

export default KuCoin;
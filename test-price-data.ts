import Logger from "add_logger";
import KuCoin from "./kucoin";
import cacheViaRedis from "cache-via-redis";
import XhrJson from "./xhrjson";


class CacheViaNothing {
    async getItem(key: string): Promise<string | null> {
        return null;
    }

    setItem(
        key: string, 
        value: string,
        expirationSeconds: number
    ): void { 
    }
}


const exchange = new KuCoin({
    logger: new Logger('kucoin'), 
    client: new XhrJson({
        logger: new Logger('http_client'), 
        cache: new CacheViaNothing(), 
        minTimeoutPerRequest: 100,
        maxRandomPreRequestTimeout: 2000
    })
});

const symbol = exchange.getUsdtSymbol('BTC');

if (symbol) {
    const priceData = await exchange.getPriceData(symbol);
    
    // {"symbol": "BTC-USDT","current": 60123, "low24h":59123, "high24h": 61123}
    console.log(priceData);
}
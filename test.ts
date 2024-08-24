import Logger from "add_logger";
import KuCoin from "./kucoin";
import cacheViaRedis from "cache-via-redis";
import XhrJson from "tradeExchanges/xhrjson";


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

// ['BTC','ETH','XRP']
const assets = await exchange.getAssets();
console.log(assets.length, assets);
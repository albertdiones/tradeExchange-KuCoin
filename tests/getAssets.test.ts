import Logger from "add_logger";
import KuCoin from "../kucoin";
import cacheViaRedis from "cache-via-redis";
import XhrJson from "tradeExchanges/xhrjson";
import {describe, expect, test} from '@jest/globals';


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
test('get assets from KuCoin', async () => {
    const assets: string[] = await exchange.getAssets();

    expect(assets).toEqual(expect.arrayContaining(["BTC", "ETH", "XRP"]));

    expect(assets).not.toEqual(expect.arrayContaining(["ALBERTO"]));
});
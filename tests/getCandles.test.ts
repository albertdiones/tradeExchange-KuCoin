import Logger from "add_logger";
import KuCoin from "../kucoin";
import XhrJson from "tradeExchanges/xhrjson";
import {describe, expect, test} from '@jest/globals';
import { CacheViaNothing } from "./cacheViaNothing";



const exchange = new KuCoin({
    logger: new Logger('kucoin'), 
    client: new XhrJson({
        logger: new Logger('http_client'), 
        cache: new CacheViaNothing(), 
        minTimeoutPerRequest: 100,
        maxRandomPreRequestTimeout: 2000
    })
});


test('get BTC ticker data from KuCoin', async () => {
    const symbol = exchange.getUsdtSymbol('BTC');

    const limit = 150;

    const candles = await exchange.fetchCandlesFromExchange(symbol, 1, limit);

    expect(candles).toHaveLength(limit);
});


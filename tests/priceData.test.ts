import Logger from "add_logger";
import KuCoin from "../kucoin";
import cacheViaRedis from "cache-via-redis";
import XhrJson from "tradeExchanges/xhrjson";
import { CacheViaNothing } from "./cacheViaNothing";
import {describe, expect, test} from '@jest/globals';


async function cryptoPrice(asset: string): Promise<string> {
    return fetch("https://cryptoprices.cc/"+asset+"/").then(
        r => r.text()
    );  
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




test('get BTC ticker data from KuCoin', async () => {
    const symbol = exchange.getUsdtSymbol('BTC');

    expect(symbol).not.toBeNull();

    const priceData = await exchange.getTickerData(symbol as string);

    expect(priceData).not.toBeFalsy();

    expect(priceData?.data).not.toBeFalsy();
    expect(priceData?.data?.current).not.toBeFalsy();

    const alternativeSourcePrice = parseFloat(await cryptoPrice('BTC'));
    
    const exchangePrice = priceData?.data.current*1;

    expect(exchangePrice).toBeGreaterThanOrEqual(alternativeSourcePrice * 0.995);
    expect(exchangePrice).toBeLessThanOrEqual(alternativeSourcePrice * 1.005);

    console.log(exchangePrice, alternativeSourcePrice);
});
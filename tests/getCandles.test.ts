import {describe, expect, test} from '@jest/globals';
import { exchange } from './setup';


test('get BTC ticker data from KuCoin', async () => {
    const symbol = exchange.getAssetDefaultTickerSymbol('BTC');

    const limit = 150;

    const candles = await exchange.fetchCandles(symbol, 1, limit);

    expect(candles).toHaveLength(limit);
});


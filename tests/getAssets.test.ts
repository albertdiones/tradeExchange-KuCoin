import {describe, expect, test} from '@jest/globals';
import { exchange } from "./setup";


test('get assets from KuCoin', async () => {
    const assets: string[] = await exchange.getAssets();

    expect(assets).toEqual(expect.arrayContaining(["BTC", "ETH", "XRP"]));

    expect(assets).not.toEqual(expect.arrayContaining(["ALBERTO"]));
});
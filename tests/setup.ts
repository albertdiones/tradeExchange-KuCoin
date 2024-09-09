import HttpClient from "nonChalantJs";
import { KuCoin } from "../kucoin";


export class CacheViaNothing {
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

export const exchange = new KuCoin(
    //process.env.API_KEY ?? '',
    //process.env.API_SECRET ?? '',
    new HttpClient({
        logger: console,
        cache: new CacheViaNothing(),
        minTimeoutPerRequest: 100,
        maxRandomPreRequestTimeout: 0,
    }),
    {
        logger: console
    }
);
import { latestFirst, oldestFirst } from "./sorters";

export interface rawExchangeCandle extends BasicCandle {
    base_volume: number; // volume on the coin
    quote_volume: number; // e.g. usdt or btc
    trades?: number; // int # trades
    buyer_base_volume?: number;
    buyer_quote_volume?: number;
}


export interface rawIndexCandle extends BasicCandle {
    name: string,
    type: string
}

export interface BasicCandle {
    open: number;
    high: number;
    low: number;
    close: number;
    open_timestamp: number;
    close_timestamp: number;
    ema?: { [key: number]: number }
}

// ticker data for today
export interface TickerData {
    symbol: string,
    current: number,
    open?: number,
    high: number,
    low: number,
    base_volume: number,
    quote_volume: number,
    tags?: string[],
    circulating_supply?: number,
    status?: string,
    full_data: object
}


export function getLatestCandle(candles: BasicCandle[],  offset:number = 0): BasicCandle {
    return [...candles].sort(latestFirst).slice(offset)[0];
}


export function getOldestCandle(candles: BasicCandle[],  offset:number = 0): BasicCandle {
    return [...candles].sort(oldestFirst).slice(offset)[0];
}
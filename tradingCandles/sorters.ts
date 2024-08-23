import type { BasicCandle } from ".";

// Sort CandleInfo models by open_timestamp in descending order (latest first)
export const latestFirst = (a: BasicCandle, b: BasicCandle) => b.open_timestamp - a.open_timestamp;

// Sort CandleInfo models by open_timestamp in ascending order (oldest first)
export const oldestFirst = (a: BasicCandle, b: BasicCandle) => a.open_timestamp - b.open_timestamp;
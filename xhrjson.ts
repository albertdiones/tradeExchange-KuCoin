export interface ResponseDataWithCache {
  response: {[key: string]: any},
  fromCache: boolean
}


class XhrJson {
    logger;
    cache;
    maxRandomPreRequestTimeout: number = 0;
    minTimeoutPerRequest: number = 0;
    currentFetches: {[url: string]: Promise<any>} = {};
    lastFetchSchedule: number;

    constructor({logger, cache, minTimeoutPerRequest, maxRandomPreRequestTimeout }) {
        this.logger = logger;
        this.cache = cache;
        this.maxRandomPreRequestTimeout = maxRandomPreRequestTimeout ?? 0;
        this.minTimeoutPerRequest = parseInt(minTimeoutPerRequest) ?? 0;
        this.lastFetchSchedule = Date.now();
    }


    getWithCache(url: string): Promise<ResponseDataWithCache> {
        return this.cache.getItem(url).then(
          (cache: any) => {
            if (!cache) {
              return this.getNoCache(url).then((response) => ({response, fromCache: false}));
            }
            else {
              this.logger.info("found from cache: " + url);
              return Promise.resolve({response: JSON.parse(cache), fromCache: true});
            }
          }
        );
        
    }

    getNoCache(url: string): Promise<object> {
      const delay = this.maxRandomPreRequestTimeout > 0 ? Math.random()*this.maxRandomPreRequestTimeout : 0;

      return this._fetchWithDelay(url, delay);
    }

    _fetchWithDelay(url: string, randomDelay: number) {
      if (!this.currentFetches[url]) {
        const minDateForNextFetch = Math.max(this.lastFetchSchedule + this.minTimeoutPerRequest, Date.now());
        const nextFetch = this.lastFetchSchedule = minDateForNextFetch + randomDelay;
        const timeDiff = nextFetch-Date.now();
        const delayBeforeFetch = Math.max(timeDiff,0);

        this.logger.info(`Fetching ${url} (delay: ${delayBeforeFetch}`);

        this.currentFetches[url] = (
          delayBeforeFetch <= 0
          ? this._fetch(url) 
          : Bun.sleep(delayBeforeFetch).then(() => this._fetch(url))
        ).catch(
          (e: Error) => {
            this.logger.warn(`Error occurred trying to access ${url} : ${e}`)
          }
        ).finally(
          () => {
            delete this.currentFetches[url]; // Use delete to remove the entry
          }
        );
      }
      return this.currentFetches[url];
    }   

    _fetch(url: string) {
      return this._getDataNative(url);
    }

    _getDataNative(url: string) {
      this.logger.info("fetching(native): " + url);
      return fetch(url).then(
        (response) => {
          return response.json()
        }
      ).then(
        (jsonData) => {          
          this.cache.setItem(url,JSON.stringify(jsonData),300);
          return jsonData;
        }
      );
    }
    
}

export default XhrJson;
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
    apikey?: string;
    applicationid?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

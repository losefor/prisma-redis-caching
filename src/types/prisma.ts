/* eslint-disable @typescript-eslint/no-explicit-any */
export type PrismaAction =
    | 'findUnique'
    | 'findFirst'
    | 'findMany'
    | 'create'
    | 'createMany'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'groupBy';

export type MiddlewareParams = {
    model?: any;
    action: PrismaAction;
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
};

export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => Promise<T>
) => Promise<T>;

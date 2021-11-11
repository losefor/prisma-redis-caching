import { Redis } from 'ioredis';
import { MiddlewareParams, PrismaAction, Middleware } from './types/prisma';
import _ from 'lodash';
interface ModelInstance<PrismaModel> {
    model: PrismaModel;
    actions: PrismaAction[];
    expirationInSec: number;
}

export const caching = <PrismaModel>(
    redis: Redis,
    modelInstances: ModelInstance<PrismaModel>[]
): Middleware => {
    return async (
        params: MiddlewareParams,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        next: (prisma: MiddlewareParams) => Promise<any>
    ) => {
        const { args, model, action } = params;

        // Extract the models from the ModelInstances
        const models = _.map(modelInstances, 'model');

        // Loop over the model instances
        for (const modelInstance of modelInstances) {
            if (
                modelInstance.model === model &&
                _.includes(modelInstance.actions, action)
            ) {
                const key = JSON.stringify({
                    model,
                    action,
                    ...args,
                });

                // Check if it's already in redis
                let cities = await redis.hget(model, key);
                cities = JSON.parse(cities);

                if (cities) {
                    return cities;
                }

                // Make the query and save it into the redis
                const result = await next(params);
                const value = JSON.stringify(result);

                redis.hset(
                    model,
                    key,
                    value,
                    'EX',
                    modelInstance.expirationInSec
                );

                return result;
            }
        }

        // Clean the redis when the model get Updated or Deleted
        if (
            models.includes(model) &&
            (action === 'delete' || action === 'update')
        ) {
            await redis.del(model);
        }

        // Make the query and save it into the redis
        const result = await next(params);

        return result;
    };
};

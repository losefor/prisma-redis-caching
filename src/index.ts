import { PrismaAction } from './types/prisma';
import _ from 'lodash';

interface ModelInstance<PrismaModel, PrismaActions> {
    model: PrismaModel;
    actions: PrismaActions[];
}

/**
 *
 * @param redisInstance
 * @param modelInstances
 * @returns prisma middleware
 *
 * @example
 * ```ts
 * // Prisma client
 * const prisma = new PrismaClient();
 *
 * const cachingMiddleware = createCachingMiddleware<
 *  Prisma.ModelName,
 *  Prisma.PrismaAction
 *>(redis, [
 *  {
 *    model: "City",
 *    actions: ["findMany"],
 *  },
 *  {
 *    model: "Category",
 *    actions: ["findMany"],
 *  },
 *]);
 *
 *prisma.$use(cachingMiddleware);
 *  ```
 *
 */

export const createCachingMiddleware = <PrismaModel, PrismaActions>(
    redisInstance: any,
    modelInstances: ModelInstance<PrismaModel, PrismaActions>[]
): any => {
    return async (
        params: any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        next: (prisma: any) => Promise<any>
    ) => {
        const { args, model, action } = params;

        const key = JSON.stringify({
            model,
            action,
            ...args,
        });

        // Extract the models from the ModelInstances
        const models = _.map(modelInstances, 'model');

        // Loop over the model instances
        for (const modelInstance of modelInstances) {
            if (
                modelInstance.model === model &&
                _.includes(modelInstance.actions, action)
            ) {
                // Check if it's already in redis
                let instance = await redisInstance.hget(model, key);
                instance = JSON.parse(instance);

                if (instance) {
                    console.log('Return from the cache');
                    return instance;
                }

                // Make the query and save it into the redis
                const result = await next(params);
                const value = JSON.stringify(result);

                redisInstance.hset(model, key, value);

                console.log('Fetch from the db');

                return result;
            }
        }

        // Clean the redis when the model get Updated or Deleted
        if (
            models.includes(model) &&
            (action === 'delete' ||
                action === 'update' ||
                action === 'updateMany' ||
                action === 'deleteMany')
        ) {
            console.log('clear the cache');
            await redisInstance.del(model);
        }

        // Make the query and save it into the redis
        const result = await next(params);

        return result;
    };
};

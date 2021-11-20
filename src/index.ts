import { PrismaAction } from './types/prisma';
import _ from 'lodash';

interface ModelInstance<PrismaModel> {
    model: PrismaModel;
    actions: PrismaAction[];
    expirationInSec: number;
}

export const createCachingMiddleware = <PrismaModel>(
    redisInstance: any,
    modelInstances: ModelInstance<PrismaModel>[]
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
                let instance = await redisInstance.get(key);
                instance = JSON.parse(instance);

                if (instance) {
                    console.log('Return from the cache');
                    return instance;
                }

                // Make the query and save it into the redis
                const result = await next(params);
                const value = JSON.stringify(result);

                redisInstance.set(
                    key,
                    value,
                    'EX',
                    modelInstance.expirationInSec
                );

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
            await redisInstance.del(key);
        }

        // Make the query and save it into the redis
        const result = await next(params);

        return result;
    };
};

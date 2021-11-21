cache your project with prisma and redis with single line of code and without the hassle of
implementing it by you own self

### Installation

-   if you use npm :
    ```bash
    npm i prisma-redis-caching
    ```
-   if you use npm :
    ```bash
    yarn add prisma-redis-caching
    ```

### Usage

-   import the package into your own project

```ts
import { createCachingMiddleware } from 'prisma-redis-caching';
```

-   after you instantiate the `prismaClient()` create the cachingMiddleware by providing the `createCachingMiddleware` function the redis instance as the first parameter and caching configuration in the second parameter

```ts
const cachingMiddleware = createCachingMiddleware<
    Prisma.ModelName,
    Prisma.PrismaAction
>(redis, [
    {
        model: 'City',
        actions: ['findMany'],
    },
    {
        model: 'Category',
        actions: ['findMany'],
    },
]);
```

## configuration

you can provide configuration the middleware creator which is an array of objects each object you can provide the model that you want to cache it with the actions that will happens
|Props| type|
|-----|-----|
|model| any |
|actions|any|

NOTE: you can provide generics as the example above to have the proper intellisense 

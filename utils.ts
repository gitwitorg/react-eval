export async function asyncMap<T, U>(
    items: T[],
    concurrencyLimit: number,
    asyncFunc: (item: T) => Promise<U>
  ): Promise<U[]> {
    const results: U[] = [];
    const queue: (() => Promise<void>)[] = [];
  
    const processItem = async (item: T) => {
      const result = await asyncFunc(item);
      results.push(result);
    };
  
    for (const item of items) {
      const task = () => processItem(item);
      queue.push(task);
  
      if (queue.length >= concurrencyLimit) {
        await Promise.race(queue.map(task => task()));
        queue.length = 0;
      }
    }
  
    await Promise.all(queue.map(task => task()));
  
    return results;
  }  
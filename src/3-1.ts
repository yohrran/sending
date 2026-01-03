export const Temp = () => {
  function sumOfSquaresOfOddNumbers(limit: number, list: number[]): number {
    let acc = 0;

    for (const a of take(
      limit,
      list.filter((a) => a % 2 === 1).map((b) => b * b)
    )) {
      console.log(a);
      acc += a;
    }

    return acc;
  }

  const temp = sumOfSquaresOfOddNumbers(3, [1, 2, 3, 4, 5, 6, 7]);

  console.log(temp);

  return null;
};

function* take<A>(limit: number, iterable: Iterable<A>): IterableIterator<A> {
  const iterator = iterable[Symbol.iterator]();
  while (true) {
    const { value, done } = iterator.next();
    console.log(value, done);
    if (done) break;
    yield value;
    if (--limit === 0) break;
  }
}

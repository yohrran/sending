export const Temp = () => {
  /**
   * 리스트 프로세싱은 이처럼(명령형) 코드 라인들을 리스트로 변환한다.
   * 코드를 값(리스트)으로 다루고 함수를 값(일금 함수)으로 다루어 작은 코드들의 목록으로
   * 복잡한 문제를 해결해나가는 것. 이것이 함수형 프로그래밍과 리스트 프로세싱의 방법이다.
   *
   * 이 접근 방식은 코드의 각 부분을 독립적으로 리스트 요소로 취급함으로써 복잡한 로직을 세분화 하여
   * 정복하는 방법이다. 결과적으로 리스트 프로세싱으로 구현된 코드는 더 읽기 쉽고 유지 보수하기 쉬우며
   * 각 부분의 역할이 명확해진다.
   */
  function sumOfSquaresOfOddNumbers(limit: number, list: number[]): number {
    return list
      .filter((a) => a % 2 === 1)
      .slice(0, limit)
      .map((a) => a * a)
      .reduce((a, b) => a + b, 0);
  }

  const temp = sumOfSquaresOfOddNumbers(3, [1, 2, 3, 4, 5, 6, 7]);

  console.log(temp);

  return null;
};

type Head = <T>(arr: T[]) => T;

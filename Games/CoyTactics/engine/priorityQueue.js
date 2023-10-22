// priority queue implemented with array-based binary heap. taken from this great answer https://stackoverflow.com/a/42919752
const top = 0;  // semantics
// bit shifting traversal functions
const parent = (i) => ((i + 1) >>> 1) - 1;
const left = (i) => (i << 1) + 1;
const right = (i) => (i + 1) << 1;

export class PriorityQueue{
  #heap;
  #comparator;

  constructor(comparator = (a, b) => a > b){
    this.#heap = [];
    this.#comparator = comparator;
  }

  size(){
    return this.#heap.length;
  }

  isEmpty(){
    return this.size() == 0;
  }

  // return the next value without removing it
  peek(){
    return this.#heap[top];
  }

  // returns the new size of the heap
  push(...values){
    values.forEach(value => {
      this.#heap.push(value);
      this.#bubbleUp();
    });

    return this.size();
  }

  // return the next value and also remove it
  pop(){
    const bottom = this.size() - 1;
    if(bottom > top){ // there might be 0 or 1 element, in which case no need to swap
      this.#swap(top, bottom);
    }

    let result = this.#heap.pop();
    this.#bubbleDown();

    return result;
  }

  // combination of x=pop();push(y); - more efficient to do replace(y) if y is already known
  replace(value){
    let result = this.peek();

    this.#heap[top] = value;
    this.#bubbleDown();

    return result;
  }

  // use the comparator to do determine if the value at i is better than the value at j (comparator(i, j) returns true), meaning i could be a parent of j
  #better(i, j){
    if(i >= this.size() || j >= this.size()) return false;
    return this.#comparator(this.#heap[i], this.#heap[j]);
  }

  #swap(i, j){
    // destructuring assignment, nifty way to avoid using temp variables
    [this.#heap[i], this.#heap[j]] = [this.#heap[j], this.#heap[i]];
  }

  // move the last node up the tree to the first valid spot for it (better than both children)
  #bubbleUp(){
    let node = this.size() - 1;
    let parentNode = parent(node);

    while(node > top && this.#better(node, parentNode)){
      this.#swap(node, parentNode);

      node = parentNode;
      parentNode = parent(node);
    }
  }

  // move the root node down the tree to the first valid spot for it (better than both children)
  #bubbleDown(){
    let node = top;
    let leftChild = left(node);
    let rightChild = right(node);

    while(this.#better(leftChild, node) || this.#better(rightChild, node)){
      let betterChild = this.#better(rightChild, leftChild) ? rightChild : leftChild;
      this.#swap(node, betterChild);

      node = betterChild;
      leftChild = left(node);
      rightChild = right(node);
    }
  }
}

export class PriorityQueueTests{
  static TestPushPop(){
    let pq = new PriorityQueue();

    console.assert(pq.isEmpty(), "TestPushPop (isEmpty)");

    pq.push(20, 10, 30);

    console.assert(pq.size() == 3, "TestPushPop (size after push)");
    
    let result = pq.pop();

    console.assert(pq.size() == 2, "TestPushPop (size after pop)");
    console.assert(result == 30, "TestPushPop (pop)");
  }

  static TestPeek(){
    let pq = new PriorityQueue();
    pq.push(20, 10, 30);
    let result = pq.peek();

    console.assert(pq.size() == 3, "TestPeek (size)");
    console.assert(result == 30, "TestPeek (peek)");
  }

  static TestReplace(){
    let pq = new PriorityQueue();
    pq.push(20, 10, 30, 15, 25);
    pq.replace(7);
    let result = pq.peek();

    console.assert(pq.size() == 5, "TestReplace (size)");
    console.assert(result == 25, "TestReplace (pop)");
  }

  static TestComplexComparator(){
    let pq = new PriorityQueue((a, b) => a[1] > b[1]);
    pq.push(["medium", 20], ["low", 10], ["high", 30]);
    let [first, second, third] = [pq.pop(), pq.pop(), pq.pop()];

    console.assert(first[0] == "high", "TestComplexComparator (first)");
    console.assert(second[0] == "medium", "TestComplexComparator (second)");
    console.assert(third[0] == "low", "TestComplexComparator (third)");
  }

  static TestAll(){
    console.log("Running PriorityQueueTests, fails are:");

    PriorityQueueTests.TestPushPop();
    PriorityQueueTests.TestPeek();
    PriorityQueueTests.TestReplace();
    PriorityQueueTests.TestComplexComparator();

    console.log("End of PriorityQueueTests");
  }
}

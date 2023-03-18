<template>
  <div id="TestTwo">TestTwo</div>
</template>
<script>
import { effect, ref } from 'vue';
import { renderer } from '../../services/test12-4';
import useQueue from '../../services/queueJob';

export default {
  name: 'TestTwo',
  // data() {
  //   return {
  //     val: 'testTwo',
  //   };
  // },
  setup() {
    const bol = ref(0);

    const { queueJob } = useQueue();

//      const jobQueue = new Set()
//  // 使用 Promise.resolve() 创建一个 promise 实例，我们用它将一个任务添加到微任务队列
//  const p = Promise.resolve()

//  // 一个标志代表是否正在刷新队列
//  let isFlushing = false
//  function flushJob() {
//    // 如果队列正在刷新，则什么都不做
//    if (isFlushing) return
//    // 设置为 true，代表正在刷新
//    isFlushing = true
//    // 在微任务队列中刷新 jobQueue 队列
//    p.then(() => {
//      jobQueue.forEach(job => job())
//    }).finally(() => {
//      // 结束后重置 isFlushing
//      isFlushing = false
//    })
//  }

    // effect(() => {
    //   console.log('%c [ xxx ]', 'font-size:13px; background:pink; color:#bf2c9f;', bol.value);
    //   const MyComponent = {
    //     name: 'MyComponent',
    //     // 组件接收名为 title 的 props，并且该 props 的类型为 String
    //     data() {
    //       return {
    //         foo: 'hello world',
    //       };
    //     },
    //     props: {
    //       title: 'test',
    //     },
    //     render() {
    //       return {
    //         type: 'div',
    //         children: `count is: ${this.title}`, // 访问 props 数据
    //       };
    //     },
    //   };

    //   // 创建 vnode
    //   const vnode = {
    //     type: MyComponent,
    //     props: {
    //       title: bol.value,
    //       // other: this.val,
    //     },
    //   };

    //   // 渲染 vnode
    //   renderer.render(vnode, document.querySelector('#app'));
    // });
    
    // 更新子组件时失败，报错信息是

    effect(() => {
    console.log( bol.value);
 }, {
   scheduler(fn) {
     // 每次调度时，将副作用函数添加到 jobQueue 队列中
     console.log('%c [ xxx ]', 'font-size:13px; background:pink; color:#bf2c9f;', fn);
     queueJob(() => {
    console.log('%c [ bol ]', 'font-size:13px; background:pink; color:#bf2c9f;', bol.value);
 });
   }
    });

    bol.value++;
    bol.value++;
    bol.value++;
  },

  // 1、scheduler(fn)里的fn为undefined,导致无法运行
  // 2、 给queueJob强行传入fn，为什么没有去重，导致最后还是执行了3次fn
};
</script>
<style></style>

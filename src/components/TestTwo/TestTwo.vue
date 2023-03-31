<template>
  <div>
    <div id="TestTwo"></div>
    <button @click="handleClick">add</button>
  </div>

</template>
<script>
import { effect, ref,nextTick } from 'vue';
import { renderer } from '../../services/test12-4';
// import useQueue from '../../services/queueJob';

export default {
  name: 'TestTwo',
  // data() {
  //   return {
  //     val: 'testTwo',
  //   };
  // },
  setup() {
    const bol = ref(0);
    const handleClick=() => {
      bol.value++;
    }

    effect(() => {
      console.log('%c [ xxx ]', 'font-size:13px; background:pink; color:#bf2c9f;', bol.value);
      const MyComponent = {
        name: 'MyComponent',
        // 组件接收名为 title 的 props，并且该 props 的类型为 String
        data() {
          return {
            foo: 'hello world',
          };
        },
        props: {
          title: 'test',
        },
        render() {
          return {
            type: 'div',
            children: `count is: ${this.title}`, // 访问 props 数据
          };
        },
      };

      // 创建 vnode
      const vnode = {
        type: MyComponent,
        props: {
          title: bol.value,
          // other: this.val,
        },
      };
      console.log('%c [ 123123 ]', 'font-size:13px; background:pink; color:#bf2c9f;', document.querySelector('#TestTwo'));
      // 渲染 vnode，在dom渲染完之后才能获取到#TestTwo，所以要在nextTick里
      nextTick(() => {
        renderer.render(vnode, document.querySelector('#TestTwo'));
      })

    });
    
    // 更新子组件时失败，报错信息是

//     const scheduler = (job) => {
//   Scheduler.nextTick(job)
// }

//     effect(() => {
//     scheduler(() => {
//       queueJob(() => console.log('%c [ xxx ]', 'font-size:13px; background:pink; color:#bf2c9f;', bol.value))
//     })
//  });

    bol.value++;

    return {
      bol,
      handleClick
    }
  },

  

  // 1、scheduler(fn)里的fn为undefined,导致无法运行
  // 2、 给queueJob强行传入fn，为什么没有去重，导致最后还是执行了3次fn
};
</script>
<style></style>

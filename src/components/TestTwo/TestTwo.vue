<template>
  <div id="TestTwo">TestTwo</div>
</template>
<script>
import { effect, ref } from 'vue';
import { renderer } from '../../services/test12-4';

export default {
  name: 'TestTwo',
  // data() {
  //   return {
  //     val: 'testTwo',
  //   };
  // },
  setup() {
    const bol = ref(false);

    effect(() => {
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
          title: 'A big Title',
          // other: this.val,
        },
      };

      // 渲染 vnode
      renderer.render(vnode, document.querySelector('#app'));
    });
  },
};
</script>
<style></style>

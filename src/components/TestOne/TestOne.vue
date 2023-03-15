<template>
  <div id="TestOne">TestOne</div>
</template>
<script>
import { effect, ref } from 'vue';
import { renderer } from '../../services/test8-8';

export default {
  name: 'TestOne',
  setup() {
    const bol = ref(false);

    effect(() => {
      // 创建 vnode
      const vnode = {
        type: 'div',
        props: bol.value
          ? {
              onClick: () => {
                alert('父元素 clicked');
              },
            }
          : {},
        children: [
          {
            type: 'p',
            props: {
              onClick: () => {
                bol.value = true;
              },
            },
            children: 'text',
          },
        ],
      };
      // 渲染 vnode
      renderer.render(vnode, document.querySelector('#app'));
    });
  },
};
</script>
<style></style>

<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Welcome to Your Vue.js App" />
</template>

<script>
import { effect, ref } from '@vue/reactivity';
import HelloWorld from './components/HelloWorld.vue';
import { renderer } from './services/test8-8';

export default {
  name: 'App',
  components: {
    HelloWorld,
  },

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

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

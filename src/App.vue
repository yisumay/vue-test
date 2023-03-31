<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
  <!-- <TestOne /> -->
  <TestThree />
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue';
// import TestOne from './components/TestOne/TestOne.vue';
// import TestTwo from './components/TestTwo/TestTwo.vue';
import TestThree from './components/TestThree/TestThree.vue';

export default {
  name: 'App',
  components: {
    // TestOne,
    TestThree,
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

<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <!-- <HelloWorld msg="Welcome to Your Vue.js App" /> -->
  <!-- <TestOne /> -->
  <TestTwo />
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue';
// import TestOne from './components/TestOne/TestOne.vue';
import TestTwo from './components/TestTwo/TestTwo.vue';

export default {
  name: 'App',
  components: {
    // TestOne,
    TestTwo,
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

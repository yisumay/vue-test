<template>
  <div class="TestCompile" @click="start">开始生成模板AST</div>
</template>
<script setup>
import useParse from './useInit/useParse';

const { genAst } = useParse();

const template = '<div><p>Vue</p><p>Template</p></div>';

const start = () => {
  genAst(template);
  alert('模板AST已生成');
};
</script>
<style scoped>
.TestCompile {
  cursor: pointer;
}
</style>

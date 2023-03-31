<template>
  <div>
    <div id="TestThree"></div>
  </div>
</template>
<script setup>
import { effect, ref,nextTick } from 'vue';
import { renderer } from '../../services/test12-5-8';
import { onMounted } from '../../services/mounted';

// 测试emit事件
// effect(() => {
//       const MyComponent = {
//         name: 'MyComponent',
//         // 组件接收名为 title 的 props，并且该 props 的类型为 String
//         props: {},
//         setup(props, { emit }) {
//          // 发射 change 事件，并传递给事件处理函数两个参数
//          const count = 0;
//          function changeNum () {
//           emit('change', count);
//          }

//            return {changeNum, count };
//       },

//       render() {
//        // 通过 this 可以访问 setup 暴露出来的响应式数据
//        return { type: 'div', children: `count is: ${this.count}`, props: {
//         onClick: this.changeNum
//        }, }
//      }
//       };

//       // 创建 vnode
//       const vnode = {
//         type: MyComponent,
//         props: {
//           onChange: (...payload) => {
//             console.log('%c [ change ]', 'font-size:13px; background:pink; color:#bf2c9f;', ...payload);
//           }
//         },
//       };
//       // 渲染 vnode，在dom渲染完之后才能获取到#TestTwo，所以要在nextTick里
//       nextTick(() => {
//         renderer.render(vnode, document.querySelector('#TestThree'));
//       })

//     });


// 测试插槽
// effect(() => {
//       const MyComponent = {
//         name: 'MyComponent',
//       render() {
//        // 通过 this 可以访问 setup 暴露出来的响应式数据
//        return [
//        {
//          type: 'header',
//          children: [this.$slots.header()]
//        },
//        {
//          type: 'body',
//          children: [this.$slots.body()]
//        },
//        {
//          type: 'footer',
//          children: [this.$slots.footer()]
//        }
//      ]
//      }
//       };

//       // 创建 vnode
//       const vnode = {
//         type: MyComponent,
//        // 组件的 children 会被编译成一个对象
//          children: {
//          header() {
//            return [ 
//             {type: 'h1', children: '我是标题1' },
//             {type: 'h1', children: '我是标题2' },
//            ];
//          },
//          body() {
//            return { type: 'section', children: '我是内容' }
//          },
//          footer() {
//            return { type: 'p', children: '我是注脚' }
//          }
//        }
//       };
//       // 渲染 vnode，在dom渲染完之后才能获取到#TestTwo，所以要在nextTick里
//       nextTick(() => {
//         renderer.render(vnode, document.querySelector('#TestThree'));
//       })

//     });


//测试生命周期
effect(() => {
      const MyComponent = {
        name: 'MyComponent',
        setup() {
          onMounted(() => {
            alert('mounted 1')
          })
          onMounted(() => {
            alert('mounted 2')
          })
        },

      render() {
       // 通过 this 可以访问 setup 暴露出来的响应式数据
       return [
       {
         type: 'header',
         children: [this.$slots.header()]
       },
       {
         type: 'body',
         children: [this.$slots.body()]
       },
       {
         type: 'footer',
         children: [this.$slots.footer()]
       }
     ]
     }
      };

      // 创建 vnode
      const vnode = {
        type: MyComponent,
       // 组件的 children 会被编译成一个对象
         children: {
         header() {
           return [ 
            {type: 'h1', children: '我是标题1' },
            {type: 'h1', children: '我是标题2' },
           ];
         },
         body() {
           return { type: 'section', children: '我是内容' }
         },
         footer() {
           return { type: 'p', children: '我是注脚' }
         }
       }
      };
      // 渲染 vnode，在dom渲染完之后才能获取到#TestTwo，所以要在nextTick里
      nextTick(() => {
        renderer.render(vnode, document.querySelector('#TestThree'));
      })

    });

</script>
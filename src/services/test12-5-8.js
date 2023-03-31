/**
 * vue.js 第12章 组件的实现原理 本test包括：12.5　setup 函数的作用与实现；12.6　组件事件与 emit 的实现；12.7　插槽的工作原理与实现；12.8　注册生命周期
 * @date 2023-02-07
 * @param {any} options
 * @returns {any}
 */

 import { reactive, effect, shallowReactive, shallowReadonly } from 'vue';
 import useQueue from './queueJob';
 import { setCurrentInstance } from './mounted';
 
 // 引入缓存的调度器函数
 // const { queueJob } = useQueue();
 function createRenderer(options) {
   // 通过 options 得到操作 DOM 的 API，在这个作用域内定义的函数都可以访问那些 API
   const { createElement, insert, setElementText, patchProps } = options;
 
 
   /**
    * 挂载元素
    * @date 2023-02-17
    */
   function mountElement(vnode, container) {
     // 让 vnode.el 引用真实 DOM 元素，当卸载操作发生的时候，只需要根据虚拟节点对象 vnode.el 取得真实 DOM 元素，再将其从父元素中移除即可：
     const el = (vnode.el = createElement(vnode.type));
     console.log('mount', vnode.children)
     if (typeof vnode.children === 'string') {
       setElementText(el, vnode.children);
     } else if (Array.isArray(vnode.children)) {
       vnode.children.forEach((child) => {
         patch(null, child, el);
       });
     }
     if (vnode.props) {
       for (const key in vnode.props) {
         patchProps(el, key, null, vnode.props[key]);
       }
     }
 
     insert(el, container);
   }
 
 
   /**
    * 用于解析组件 props 和 attrs 数据
    * @date 2023-03-18 3-31
    */
   function resolveProps(options, propsData) {
     const props = {};
     const attrs = {};
     for (const key in propsData) {
      // 以字符串 on 开头的 props，无论是否显式地声明，都将其添加到 props 数据中，而不是添加到 attrs 中
       if (key in options || key.startsWith('on')) {
         props[key] = propsData[key];
       } else {
         attrs[key] = propsData[key];
       }
     }
     return [props, attrs];
   }
 
   /**
    * 挂载组件
    * @date 2023-03-18 3-31
    */
   function mountComponent(vnode, container, anchor) {
     // 通过 vnode 获取组件的选项对象，即 vnode.type
     const componentOptions = vnode.type;
     const {
       render,
       data,
       beforeCreate,
       created,
       beforeMount,
       mounted,
       beforeUpdate,
       updated,
       props: propsOption,
       setup,
     } = componentOptions;
 

     beforeCreate && beforeCreate();
     const state = data ? reactive(data()) : null
 
     const [props, attrs] = resolveProps(propsOption, vnode.props);

     // 直接使用编译好的 vnode.children 对象作为 slots 对象即可
   const slots = vnode.children || {}

     const instance = {
       state,
       props: shallowReactive(props),
       isMounted: false,
       subTree: null,
       slots, // 将插槽添加到组件实例上
       // 在组件实例中添加 mounted 数组，用来存储通过 onMounted 函数注册的生命周期钩子函数
       mounted: [],
     };

       // 定义 emit 函数，它接收两个参数
     // event: 事件名称
     // payload: 传递给事件处理函数的参数
     function emit(event, ...payload) {
       // 根据约定对事件名称进行处理，例如 change --> onChange
       const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
       console.log('emit', eventName, instance.props)
       // 根据处理后的事件名称去 props 中寻找对应的事件处理函数
       const handler = instance.props[eventName];
       if (handler) {
         // 调用事件处理函数并传递参数
         handler(...payload);
       } else {
         console.error('事件不存在');
       }
     }


   // 将 emit 函数添加到 setupContext 中，用户可以通过 setupContext 取得 emit 函数
   const setupContext = { attrs, emit, slots };

      // 在调用 setup 函数之前，设置当前组件实例
     setCurrentInstance(instance);
     // 执行 setup 函数

   // 调用 setup 函数，将只读版本的 props 作为第一个参数传递，避免用户意外地修改 props 的值，
   // 将 setupContext 作为第二个参数传递
   const setupResult = setup(shallowReadonly(instance.props), setupContext)
   // setupState 用来存储由 setup 返回的数据
    // 在 setup 函数执行完毕之后，重置当前组件实例
     setCurrentInstance(null)
    let setupState = null;
   // 如果 setup 函数的返回值是函数，则将其作为渲染函数
   if (typeof setupResult === 'function') {
     // 报告冲突
     if (render) console.error('setup 函数返回渲染函数，render 选项将被忽略')
      // 将 setupResult 作为渲染函数
      // render = setupResult;
      } else {
     // 如果 setup 的返回值不是函数，则作为数据状态赋值给 setupState
     setupState = setupResult;
    }
 
    vnode.component = instance;

     // 创建渲染上下文对象，本质上是组件实例的代理
     const renderContext = new Proxy(instance, {
       get(t, k, r) {
         const { state, props } = t;
         if (k === '$slots') { 
          console.log('slots', slots)
           return slots 
        } else if (state && k in state) {
           return state[k];
         } else if (k in props) {
           return props[k];
         } else if (setupState && k in setupState) {
            // 渲染上下文需要增加对 setupState 的支持
            return setupState[k]
            } else {
           console.error('不存在');
         }
       },
       set(t, k, v, r) {
         const { state, props } = t;
         if (state && k in state) {
           state[k] = v;
         } else if (k in props) {
           console.warn(`Attempting to mutate prop "${k}". Props are readonly.`);
         } else if (setupState && k in setupState) {
            // 渲染上下文需要增加对 setupState 的支持
            setupState[k] = v
          } else {
           console.error('不存在');
         }
       },
     });
 
 
     created && created.call(renderContext);
 
     // 将组件的 render 函数调用包装到 effect 内
     effect(
       () => {
         const subTree = render.call(renderContext, renderContext)
         if (!instance.isMounted) {
           beforeMount && beforeMount.call(renderContext);
           patch(null, subTree, container, anchor);
           instance.isMounted = true;
          //  mounted && mounted.call(renderContext);
           // 遍历 instance.mounted 数组并逐个执行即可
           console.log('mmmmm', instance.mounted)
          instance.mounted && instance.mounted.forEach(hook => hook.call(renderContext))
         } else {
           beforeUpdate && beforeUpdate.call(renderContext);
           patch(instance.subTree, subTree, container, anchor);
           debugger
           console.log('patch', subTree);
           updated && updated.call(renderContext);
         }
         instance.subTree = subTree;
       },
       // {
       //   // 指定该副作用函数的调度器为 queueJob 即可
       //   scheduler: queueJob,
       // }
     );
   }
 
   // 卸载元素
   function unmount(vnode) {
     const parent = vnode.el.parentNode;
     if (parent) {
       parent.removeChild(vnode.el);
     }
   }
 
   /**
    *
    * @date 2023-02-07
    */
   function patch(n1, n2, container, anchor) {
     if (n1 && n1.type !== n2.type) {
       unmount(n1);
       n1 = null;
     }
     const { type } = n2;
     if (typeof type === 'string') {
       if (!n1) {
         mountElement(n2, container);
       } else {
         patchElement(n1, n2);
       }
     } else if (typeof type === 'object') {
       if (!n1) {
         // 挂载组件
         mountComponent(n2, container, anchor);
       } else {
         debugger
         // 更新组件
         patchComponent(n1, n2, anchor);
       }
     } else if (Array.isArray(n2)) {
      console.log('patch', n1, n2)
       // 处理其他类型的 vnode
       if (!n1) {
        // 挂载组件
        n2.forEach(el => mountElement(el, container, anchor))
      } else {
        debugger
        // 更新组件
        n2.forEach(el => patchElement(el, container, anchor))
      }
     }
   }
 
   /**
    *  更新元素
    * * @date 2023-02-17
    */
   function patchElement(n1, n2) {
     const el = (n2.el = n1.el);
     const oldProps = n1.props;
     const newProps = n2.props;
     // 第一步：更新 props
     for (const key in newProps) {
       if (newProps[key] !== oldProps[key]) {
         patchProps(el, key, oldProps[key], newProps[key]);
       }
     }
     for (const key in oldProps) {
       if (!(key in newProps)) {
         patchProps(el, key, oldProps[key], null);
       }
     }
 
     // 第二步：更新 children
     patchChildren(n1, n2, el);
   }
 
   /**
    * 判断props是否有变化
    * * @date 2023-03-18
    */
   function hasPropsChanged(prevProps, nextProps) {
     const nextKeys = Object.keys(nextProps);
     if (nextKeys.length !== Object.keys(prevProps).length) {
       return true;
     }
     for (let i = 0; i < nextKeys.length; i++) {
       const key = nextKeys[i];
       if (nextProps[key] !== prevProps[key]) return true;
     }
     return false;
   }
 
   /**
    * 更新组件
    * @date 2023-03-18
    */
   function patchComponent(n1, n2, anchor) {
 
     const componentOptions = n2.type;
     const instance = (n2.component = n1.component);
     const { props, render } = instance;
     if (hasPropsChanged(n1.props, n2.props)) {
       const [nextProps] = resolveProps(n2.type.props, n2.props);
       for (const k in nextProps) {
         props[k] = nextProps[k];
       }
       for (const k in props) {
         if (!(k in nextProps)) delete props[k];
       }
     }
   }
 
   /**
    * 更新子节点
    * @date 2023-02-17
    */
   function patchChildren(n1, n2, container) {
     if (typeof n2.children === 'string') {
       // 旧子节点的类型有三种可能：没有子节点、文本子节点以及一组子节点
       // 只有当旧子节点为一组子节点时，才需要逐个卸载，其他情况下什么都不需要做
       if (Array.isArray(n1.children)) {
         n1.children.forEach((c) => unmount(c));
       }
       // 最后将新的文本节点内容设置给容器元素
       setElementText(container, n2.children);
     } else if (Array.isArray(n2.children)) {
       // 说明新子节点是一组子节点
       if (Array.isArray(n1.children)) {
         // 判断旧子节点是否也是一组子节点
         n1.children.forEach((c) => unmount(c));
         n2.children.forEach((c) => patch(null, c, container));
       } else {
         setElementText(container, '');
         n2.children.forEach((c) => patch(null, c, container));
       }
     } else {
       // 代码运行到这里，说明新子节点不存在
       // 旧子节点是一组子节点，只需逐个卸载即可
       if (Array.isArray(n1.children)) {
         n1.children.forEach((c) => unmount(c));
       } else if (typeof n1.children === 'string') {
         setElementText(container, '');
       }
     }
   }
 
   /**
    * 渲染
    * * @date 2023-02-17
    */
   function render(vnode, container) {
     if (vnode) {
       // 新 vnode 存在，将其与旧 vnode（container._vnode保存旧 vnode） 一起传递给 patch 函数，进行打补丁（更新操作）
       console.log('%c [ container ]', 'font-size:13px; background:pink; color:#bf2c9f;',container._vnode );
       patch(container._vnode, vnode, container);
     } else {
       if (container._vnode) {
         unmount(container._vnode);
       }
     }
     // 把 vnode 存储到 container._vnode 下，即后续渲染中的旧 vnode
     container._vnode = vnode;
   }
 
   return {
     render,
   };
 }
 
 function shouldSetAsProps(el, key) {
   // 特殊处理：比如<input/> 标签设置了 form 属性（HTML Attributes）。它对应的 DOM Properties 是 el.form，但 el.form 是只读的，
   if (key === 'form' && el.tagName === 'INPUT') return false;
   // 兜底
   return key in el;
 }
 
 export const renderer = createRenderer({
   // 省略其他选项
   createElement(tag) {
     return document.createElement(tag);
   },
   // 用于设置元素的文本节点
   setElementText(el, text) {
     el.textContent = text;
   },
   // 用于在给定的 parent 下添加指定元素
   insert(el, parent, anchor = null) {
     parent.insertBefore(el, anchor);
   },
   createText(text) {
     return document.createTextNode(text);
   },
   setText(el, text) {
     el.nodeValue = text;
   },
 
   // 将属性设置相关操作封装到 patchProps 函数中，并作为渲染器选项传递
   patchProps(el, key, prevValue, nextValue) {
     if (/^on/.test(key)) {
       // 以on开头说明是事件，对事件进行处理，  el._vei 为一个对象，存在事件名称到事件处理函数的映射
       const invokers = el._vei || (el._vei = {});
       let invoker = invokers[key];
       const name = key.slice(2).toLowerCase();
       if (nextValue) {
         if (!invoker) {
           invoker = el._vei[key] = (e) => {
             if (e.timeStamp < invoker.attached) return;
             if (Array.isArray(invoker.value)) {
               invoker.value.forEach((fn) => fn(e));
             } else {
               invoker.value(e);
             }
           };
           invoker.value = nextValue;
           invoker.attached = performance.now();
           el.addEventListener(name, invoker);
         } else {
           // 新的事件绑定函数不存在，且之前绑定的 invoker 存在，则移除绑定
           invoker.value = nextValue;
         }
       } else if (invoker) {
         el.removeEventListener(name, invoker);
       }
     } else if (key === 'class') {
       // 对class进行处理，className方式是最优的
       el.className = nextValue || '';
     } else if (shouldSetAsProps(el, key, nextValue)) {
       const type = typeof el[key];
       if (type === 'boolean' && nextValue === '') {
         // 如果是布尔类型，并且 value 是空字符串，则将值矫正为 true
         el[key] = true;
       } else {
         el[key] = nextValue;
       }
     } else {
       el.setAttribute(key, nextValue);
     }
   },
 });
 
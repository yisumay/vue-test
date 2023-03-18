/**
 * vue.js 第12章 组件的实现原理 本test包括：12.1　渲染组件； 12.2　组件状态与自更新；12.3　组件实例与组件的生命周期；12.4　props 与组件的被动更新
 * @date 2023-02-07
 * @param {any} options
 * @returns {any}
 */

import { reactive, effect, shallowReactive } from 'vue';
import useQueue from './queueJob';

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
   * @date 2023-03-18
   * @param {any} options 组件自身的 props 选项
   * @param {any} propsData 为组件传递的 props 数据
   * @returns {any}
   */
  function resolveProps(options, propsData) {
    const props = {};
    const attrs = {};
    // 遍历为组件传递的 props 数据
    for (const key in propsData) {
      if (key in options) {
        // 如果为组件传递的 props 数据在组件自身的 props 选项中有定义，则将其视为合法的 props
        props[key] = propsData[key];
      } else {
        // 否则将其作为 attrs
        attrs[key] = propsData[key];
      }
    }

    // 最后返回 props 与 attrs 数据
    return [props, attrs];
  }

  /**
   * 挂载组件
   * @date 2023-03-18
   * @param {any} vnode
   * @param {any} container
   * @param {any} anchor
   * @returns {any}
   */
  function mountComponent(vnode, container, anchor) {
    // 通过 vnode 获取组件的选项对象，即 vnode.type
    const componentOptions = vnode.type;
    // 获取组件的渲染函数 render, 从组件选项对象中取得组件的生命周期函数, 取出 props 定义，即 propsOption
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
    } = componentOptions;
    // 调用 data 函数得到原始数据，并调用 reactive 函数将其包装为响应式数据

    // 在这里调用 beforeCreate 钩子
    beforeCreate && beforeCreate();
    const state = reactive(data());

    // 调用 resolveProps 函数解析出最终的 props 数据与 attrs 数据
    const [props, attrs] = resolveProps(propsOption, vnode.props);

    // 定义组件实例，一个组件实例本质上就是一个对象，它包含与组件有关的状态信息
    const instance = {
      // 组件自身的状态数据，即 data
      state,
      // 一个布尔值，用来表示组件是否已经被挂载，初始值为 false
      // 将解析出的 props 数据包装为 shallowReactive 并定义到组件实例上
      props: shallowReactive(props),
      isMounted: false,
      // 组件所渲染的内容，即子树（subTree）
      subTree: null,
    };

    // 创建渲染上下文对象，本质上是组件实例的代理
    const renderContext = new Proxy(instance, {
      get(t, k, r) {
        // 取得组件自身状态与 props 数据
        const { state, props } = t;
        // 先尝试读取自身状态数据
        if (state && k in state) {
          return state[k];
        } else if (k in props) {
          // 如果组件自身没有该数据，则尝试从 props 中读取
          return props[k];
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
        } else {
          console.error('不存在');
        }
      },
    });

    // 将组件实例设置到 vnode 上，用于后续更新
    vnode.component = instance;

    // 在这里调用 created 钩子，上下文对象为renderContext
    created && created.call(renderContext);

    // 将组件的 render 函数调用包装到 effect 内
    effect(
      () => {
        // 调用 render 函数时，将其 this 设置为 renderContext
        // 从而 render 函数内部可以通过 this 访问组件自身状态数据
        const subTree = render.call(renderContext);
        // 检查组件是否已经被挂载
        if (!instance.isMounted) {
          // 在这里调用 beforeMount 钩子
          beforeMount && beforeMount.call(renderContext);
          // 初次挂载，调用 patch 函数第一个参数传递 null
          patch(null, subTree, container, anchor);
          // 重点：将组件实例的 isMounted 设置为 true，这样当更新发生时就不会再次进行挂载操作，
          // 而是会执行更新
          instance.isMounted = true;
          // 在这里调用 mounted 钩子
          mounted && mounted.call(renderContext);
        } else {
          // 在这里调用 beforeUpdate 钩子
          beforeUpdate && beforeUpdate.call(renderContext);
          // 当 isMounted 为 true 时，说明组件已经被挂载，只需要完成自更新即可，
          // 所以在调用 patch 函数时，第一个参数为组件上一次渲染的子树，
          // 意思是，使用新的子树与上一次渲染的子树进行打补丁操作
          patch(instance.subTree, subTree, container, anchor);
          // 在这里调用 updated 钩子
          updated && updated.call(renderContext);
        }
        // 更新组件实例的子树
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
   * @param {any} n1 旧节点，若为空则为首次挂载，不空是更新
   * @param {any} n2 新节点
   * @param {any} container 挂载点
   * @returns {any}
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
    } else if (type === 'xxx') {
      // 处理其他类型的 vnode
    }
  }

  /**
   *  更新组件
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
   * @param {any} n1
   * @param {any} n2
   * @param {any} anchor
   * @returns {any}
   */
  function patchComponent(n1, n2, anchor) {

    // 获取组件实例，即 n1.component，同时让新的组件虚拟节点 n2.component 也指向组件实例
    const instance = (n2.component = n1.component);
    // 获取当前的 props 数据
    const { props } = instance;
    // 调用 hasPropsChanged 检测为子组件传递的 props 是否发生变化，如果没有变化，则不需要更新
    if (hasPropsChanged(n1.props, n2.props)) {
      // 调用 resolveProps 函数重新获取 props 数据
      const [nextProps] = resolveProps(n2.type.props, n2.props);
      // 更新 props
      for (const k in nextProps) {
        props[k] = nextProps[k];
      }
      // 删除不存在的 props
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

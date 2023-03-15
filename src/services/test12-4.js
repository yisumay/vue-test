/**
 * vue.js 第12章 组件的实现原理 本test包括：12.1　渲染组件； 12.2　组件状态与自更新；12.3　组件实例与组件的生命周期；12.4　props 与组件的被动更新
 * @date 2023-02-07
 * @param {any} options
 * @returns {any}
 */

import { reactive, effect, shallowReactive } from 'vue';
import useQueue from './queueJob';

const { queueJob } = useQueue();
function createRenderer(options) {
  // 通过 options 得到操作 DOM 的 API
  const { createElement, insert, setElementText, patchProps } = options;

  // 在这个作用域内定义的函数都可以访问那些 API
  function mountElement(vnode, container) {
    // 让 vnode.el 引用真实 DOM 元素，当卸载操作发生的时候，只需要根据虚拟节点对象 vnode.el 取得真实 DOM 元素，再将其从父元素中移除即可：
    const el = (vnode.el = createElement(vnode.type));
    if (typeof vnode.children === 'string') {
      setElementText(el, vnode.children);
    } else if (Array.isArray(vnode.children)) {
      // 如果 children 是数组，则遍历每一个子节点，并调用 patch 函数挂载它们
      vnode.children.forEach((child) => {
        patch(null, child, el);
      });
    }
    //渲染属性 如果 vnode.props 存在才处理它
    if (vnode.props) {
      for (const key in vnode.props) {
        // 在传入的options选项中的patchProps函数里正确地设置元素属性
        patchProps(el, key, null, vnode.props[key]);
      }
    }

    insert(el, container);
  }

  // resolveProps 函数用于解析组件 props 和 attrs 数据
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

    // 在这里调用 created 钩子
    created && created.call(renderContext);

    // 将组件的 render 函数调用包装到 effect 内
    effect(
      () => {
        // 调用 render 函数时，将其 this 设置为 state，
        // 从而 render 函数内部可以通过 this 访问组件自身状态数据
        const subTree = render.call(state, state);
        // 检查组件是否已经被挂载
        if (!instance.isMounted) {
          // 在这里调用 beforeMount 钩子
          beforeMount && beforeMount.call(state);
          // 初次挂载，调用 patch 函数第一个参数传递 null
          patch(null, subTree, container, anchor);
          // 重点：将组件实例的 isMounted 设置为 true，这样当更新发生时就不会再次进行挂载操作，
          // 而是会执行更新
          instance.isMounted = true;
          // 在这里调用 mounted 钩子
          mounted && mounted.call(state);
        } else {
          // 在这里调用 beforeUpdate 钩子
          beforeUpdate && beforeUpdate.call(state);
          // 当 isMounted 为 true 时，说明组件已经被挂载，只需要完成自更新即可，
          // 所以在调用 patch 函数时，第一个参数为组件上一次渲染的子树，
          // 意思是，使用新的子树与上一次渲染的子树进行打补丁操作
          patch(instance.subTree, subTree, container, anchor);
          // 在这里调用 updated 钩子
          updated && updated.call(state);
        }
        // 更新组件实例的子树
        instance.subTree = subTree;
        patch(null, subTree, container, anchor);
      },
      {
        // 指定该副作用函数的调度器为 queueJob 即可
        scheduler: queueJob,
      }
    );
  }

  function unmount(vnode) {
    // 根据 vnode 获取要卸载的真实 DOM 元素,container._vnode 代表旧 vnode
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
    // 如果 n1 存在，则对比 n1 和 n2 的类型
    if (n1 && n1.type !== n2.type) {
      // 如果新旧 vnode 的类型不同，则直接将旧 vnode 卸载
      unmount(n1);
      n1 = null;
    }
    // 代码运行到这里，证明 n1 和 n2 所描述的内容相同
    const { type } = n2;
    // 如果 n2.type 的值是字符串类型，则它描述的是普通标签元素
    if (typeof type === 'string') {
      if (!n1) {
        // 如果 n1 不存在，意味着挂载，则调用 mountElement 函数完成挂载
        mountElement(n2, container);
      } else {
        // 否则打补丁更新
        patchElement(n1, n2);
      }
    } else if (typeof type === 'object') {
      // 如果 n2.type 的值的类型是对象，则它描述的是组件
      if (!n1) {
        // 挂载组件
        mountComponent(n2, container, anchor);
      } else {
        // 更新组件
        patchComponent(n1, n2, anchor);
      }
    } else if (type === 'xxx') {
      // 处理其他类型的 vnode
    }
  }

  function patchElement(n1, n2) {
    const el = (n2.el = n1.el);
    const oldProps = n1.props;
    const newProps = n2.props;
    // 第一步：更新 props
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        // 新旧props不等时，进行更新
        patchProps(el, key, oldProps[key], newProps[key]);
      }
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        // 去除旧props中新props不需要的props
        patchProps(el, key, oldProps[key], null);
      }
    }

    // 第二步：更新 children
    patchChildren(n1, n2, el);
  }

  function hasPropsChanged(prevProps, nextProps) {
    const nextKeys = Object.keys(nextProps);
    // 如果新旧 props 的数量变了，则说明有变化
    if (nextKeys.length !== Object.keys(prevProps).length) {
      return true;
    }
    // 只有
    for (let i = 0; i < nextKeys.length; i++) {
      const key = nextKeys[i];
      // 有不相等的 props，则说明有变化
      if (nextProps[key] !== prevProps[key]) return true;
    }
    return false;
  }

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
   * @param {any} n1 旧节点
   * @param {any} n2 新节点
   * @param {any} container 容器
   * @returns {any}
   */
  function patchChildren(n1, n2, container) {
    // 判断新子节点的类型是否是文本节点
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
        // 代码运行到这里，则说明新旧子节点都是一组子节点，这里涉及核心的 Diff 算法
        // 傻瓜式做法：将旧的一组子节点全部卸载
        n1.children.forEach((c) => unmount(c));
        // 再将新的一组子节点全部挂载到容器中
        n2.children.forEach((c) => patch(null, c, container));
      } else {
        // 此时：
        // 旧子节点要么是文本子节点，要么不存在
        // 但无论哪种情况，我们都只需要将容器清空，然后将新的一组子节点逐个挂载
        setElementText(container, '');
        n2.children.forEach((c) => patch(null, c, container));
      }
    } else {
      // 代码运行到这里，说明新子节点不存在
      // 旧子节点是一组子节点，只需逐个卸载即可
      if (Array.isArray(n1.children)) {
        n1.children.forEach((c) => unmount(c));
      } else if (typeof n1.children === 'string') {
        // 旧子节点是文本子节点，清空内容即可
        setElementText(container, '');
      }
      // 如果也没有旧子节点，那么什么都不需要做
    }
  }

  function render(vnode, container) {
    if (vnode) {
      // 新 vnode 存在，将其与旧 vnode（container._vnode保存旧 vnode） 一起传递给 patch 函数，进行打补丁（更新操作）
      patch(container._vnode, vnode, container);
    } else {
      if (container._vnode) {
        // 旧 vnode 存在，且新 vnode 不存在，说明是卸载（unmount）操作
        // 只需要将 container 内的 DOM 清空即可
        // container.innerHTML = ''; 这种卸载是不严谨的
        // 调用 unmount 函数卸载 旧vnode
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
      // 获取为该元素伪造的事件处理函数 invoker，使用一个数组来描述事件
      let invoker = invokers[key];
      const name = key.slice(2).toLowerCase();
      if (nextValue) {
        if (!invoker) {
          // 如果没有 invoker，则将一个伪造的 invoker 缓存到 el._vei[key] 中
          invoker = el._vei[key] = (e) => {
            // e.timeStamp 是事件发生的时间
            // 如果事件发生的时间早于事件处理函数绑定的时间，则不执行事件处理函数
            if (e.timeStamp < invoker.attached) return;
            if (Array.isArray(invoker.value)) {
              // 如果 invoker.value 是数组，则遍历它并逐个调用事件处理函数
              invoker.value.forEach((fn) => fn(e));
            } else {
              // 否则直接作为函数调用
              invoker.value(e);
            }
          };
          // 将真正的事件处理函数赋值给 invoker.value
          invoker.value = nextValue;
          // 添加 invoker.attached 属性，存储事件处理函数被绑定的时间
          invoker.attached = performance.now();
          // 绑定 invoker 作为事件处理函数
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
      // shouldSetAsProps函数判断 key 是否存在对应的 DOM Properties，有则优先设置元素的 DOM Properties
      // 获取该 DOM Properties 的类型
      const type = typeof el[key];
      if (type === 'boolean' && nextValue === '') {
        // 如果是布尔类型，并且 value 是空字符串，则将值矫正为 true
        el[key] = true;
      } else {
        el[key] = nextValue;
      }
    } else {
      // 如果要设置的属性没有对应的 DOM Properties，则使用 setAttribute 函数设置属性
      el.setAttribute(key, nextValue);
    }
  },
});

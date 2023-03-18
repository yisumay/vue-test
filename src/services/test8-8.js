/**
 * vue.js 第8章 挂载与更新 本test主要是写元素属性的更新，包括普通标签属性和事件
 * @date 2023-02-07
 * @param {any} options
 * @returns {any}
 */

function createRenderer(options) {
  // 通过 options 得到操作 DOM 的 API
  const { createElement, insert, setElementText, patchProps } = options;

  // 在这个作用域内定义的函数都可以访问那些 API

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

    // 卸载元素
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
  function patch(n1, n2, container) {
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

import { effect, ref } from '@vue/reactivity';

const bol = ref(false);

function createRenderer(options) {
  // 通过 options 得到操作 DOM 的 API
  const { createElement, insert, setElementText } = options;

  // 在这个作用域内定义的函数都可以访问那些 API
  function mountElement(vnode, container) {
    // 调用 createElement 函数创建元素
    const el = createElement(vnode.type);
    if (typeof vnode.children === 'string') {
      // 调用 setElementText 设置元素的文本节点
      setElementText(el, vnode.children);
    }
    // 调用 insert 函数将元素插入到容器内
    insert(el, container);
  }

  function patch(n1, n2, container) {
    // 如果 n1 不存在，意味着挂载，则调用 mountElement 函数完成挂载
    if (!n1) {
      mountElement(n2, container);
    } else {
      // n1 存在，意味着打补丁，暂时省略
    }
  }

  function render(vnode, container) {
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else {
      if (container._vnode) {
        container.innerHTML = '';
      }
    }
    container._vnode = vnode;
  }

  return {
    render,
  };
}

const renderer = createRenderer({
  createElement(tag) {
    // 省略部分代码
  },
  setElementText(el, text) {
    // 省略部分代码
  },
  insert(el, parent, anchor = null) {
    // 省略部分代码
  },
  createText(text) {
    return document.createTextNode(text);
  },
  setText(el, text) {
    el.nodeValue = text;
  },
  patchProps(el, key, prevValue, nextValue) {
    // 省略部分代码
  },
});

const renderer = createRenderer({
  // 省略其他选项

  patchProps(el, key, prevValue, nextValue) {
    // 对 class 进行特殊处理
    if (key === 'class') {
      el.className = nextValue || '';
    } else if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof el[key];
      if (type === 'boolean' && nextValue === '') {
        el[key] = true;
      } else {
        el[key] = nextValue;
      }
    } else {
      el.setAttribute(key, nextValue);
    }
  },
});

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

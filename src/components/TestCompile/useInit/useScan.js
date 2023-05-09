export default () => {
  // 优化版
  let scanningText = '';
  let type = 'tag';
  const initScanningText = () => {
    scanningText = '';
    type = 'tag';
  };
  // 生成的 Token 会存储到 tokens 数组中，并作为函数的返回值返回
  const tokenList = [];

  /**
   * 创建一个扫描token的内部函数
   * @date 2023-05-09
   * @param {any} target 传进来的模板字符串
   * @returns {any}
   */
  const createScanner = (target) => {
    // 二阶函数，将内部函数抛出去
    return (cb) => {
      while (target.length !== 0) {
        // 切换cb的tag
        let isEnd = cb(target[0], (spliceNum) => {
          target = target.slice(spliceNum);
        });
        // **重点**
        // isEnd利用cb的返回值来跳出循环，当cb里返回true时，再在循环体里根据返回值来判断return，告诉扫描器，我这里已经匹配到了，不需要我这个cb了，请执行下一步的解析器吧
        // 当cb里没有匹配到结束的token时，不返回true，则继续调用cb
        if (isEnd) return target;
      }
    };
  };

  /**
   * 扫描开始和结束标签
   * @date 2023-05-09
   * @param {any} str 传进来的字符
   * @param {any} spliceTarget 对模板字符串进行剪切操作的回调函数
   * @returns {any}
   */
  const tagScanner = (str, spliceTarget) => {
    // 当匹配到'>'代表该标签token已扫描完毕
    if (str === '>') {
      // 创建一个标签 Token，并添加到 tokenList 数组中
      tokenList.push({
        type,
        name: scanningText,
      });
      //  消费当前字符
      spliceTarget(1);
      initScanningText();
      return true;
    }
    if (str === '/') {
      type = 'tagEnd';
    }
    if (/[a-z]/i.test(str)) {
      scanningText += str;
    }
     //  消费当前字符
    spliceTarget(1);
  };

  /**
   * 扫描文本
   */
  const textScanner = (str, spliceTarget) => {
        // 当匹配到'<'代表该文本token已扫描完毕
    if (str === '<') {
      // 创建一个文本 Token，并添加到 tokenList 数组中
      tokenList.push({
        type: 'text',
        content: scanningText,
      });
      initScanningText();
      return true;
    }
    scanningText += str;
    spliceTarget(1);
  };

  /**
   * 调用该函数来生成tokenList
   * @date 2023-05-09
   * @param {any} target 传进来的模板字符串
   * @returns {any}
   */
  const genTokens = (target) => {
    const scanner = createScanner(target);
    // 使用 while 循环开启自动机，只要模板字符串没有被消费尽，自动机就会一直运行
    let tempStr = target;
    while (tempStr) {
      const char = tempStr[0];
      if (char === '<') {
        // 进入标签扫描器， 得到消费已扫描的字符后返回的剩余模板字符串
        tempStr = scanner(tagScanner);
      } else {
        // 进入文本扫描器
        tempStr = scanner(textScanner);
      }
    }

    return tokenList;
  };

  // 这是书本最简易的做法
  // 定义状态机的状态
  //   const State = {
  //     initial: 1, // 初始状态
  //     tagOpen: 2, // 标签开始状态
  //     tagName: 3, // 标签名称状态
  //     text: 4, // 文本状态
  //     tagEnd: 5, // 结束标签状态
  //     tagEndName: 6, // 结束标签名称状态
  //   };

  //    // 一个辅助函数，用于判断是否是字母
  // function isAlpha(char) {
  //   return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  // }

  // // 接收模板字符串作为参数，并将模板切割为 Token 返回
  // function tokenize(str) {
  //   // 状态机的当前状态：初始状态y
  //   let currentState = State.initial;
  //   // 用于缓存字符
  //   const chars = [];
  //   // 生成的 Token 会存储到 tokens 数组中，并作为函数的返回值返回
  //   const tokens = [];
  //   // 使用 while 循环开启自动机，只要模板字符串没有被消费尽，自动机就会一直运行
  //   while (str) {
  //     // 查看第一个字符，注意，这里只是查看，没有消费该字符
  //     const char = str[0];
  //     // switch 语句匹配当前状态
  //     switch (currentState) {
  //       // 状态机当前处于初始状态
  //       case State.initial:
  //         // 遇到字符 <
  //         if (char === '<') {
  //           // 1. 状态机切换到标签开始状态
  //           currentState = State.tagOpen;
  //           // 2. 消费字符 <
  //           str = str.slice(1);
  //         } else if (isAlpha(char)) {
  //           // 1. 遇到字母，切换到文本状态
  //           currentState = State.text;
  //           // 2. 将当前字母缓存到 chars 数组
  //           chars.push(char);
  //           // 3. 消费当前字符
  //           str = str.slice(1);
  //         }
  //         break;
  //       // 状态机当前处于标签开始状态
  //       case State.tagOpen:
  //         if (isAlpha(char)) {
  //           // 1. 遇到字母，切换到标签名称状态
  //           currentState = State.tagName;
  //           // 2. 将当前字符缓存到 chars 数组
  //           chars.push(char);
  //           // 3. 消费当前字符
  //           str = str.slice(1);
  //         } else if (char === '/') {
  //           // 1. 遇到字符 /，切换到结束标签状态
  //           currentState = State.tagEnd;
  //           // 2. 消费字符 /
  //           str = str.slice(1);
  //         }
  //         break;
  //       // 状态机当前处于标签名称状态
  //       case State.tagName:
  //         if (isAlpha(char)) {
  //           // 1. 遇到字母，由于当前处于标签名称状态，所以不需要切换状态，
  //           // 但需要将当前字符缓存到 chars 数组
  //           chars.push(char);
  //           // 2. 消费当前字符
  //           str = str.slice(1);
  //         } else if (char === '>') {
  //           // 1.遇到字符 >，切换到初始状态
  //           currentState = State.initial;
  //           // 2. 同时创建一个标签 Token，并添加到 tokens 数组中
  //           // 注意，此时 chars 数组中缓存的字符就是标签名称
  //           tokens.push({
  //             type: 'tag',
  //             name: chars.join(''),
  //           });
  //           // 3. chars 数组的内容已经被消费，清空它
  //           chars.length = 0;
  //           // 4. 同时消费当前字符 >
  //           str = str.slice(1);
  //         }
  //         break;
  //       // 状态机当前处于文本状态
  //       case State.text:
  //         if (isAlpha(char)) {
  //           // 1. 遇到字母，保持状态不变，但应该将当前字符缓存到 chars 数组
  //           chars.push(char);
  //           // 2. 消费当前字符
  //           str = str.slice(1);
  //         } else if (char === '<') {
  //           // 1. 遇到字符 <，切换到标签开始状态
  //           currentState = State.tagOpen;
  //           // 2. 从 文本状态 --> 标签开始状态，此时应该创建文本 Token，并添加到 tokens 数组
  //           // 注意，此时 chars 数组中的字符就是文本内容
  //           tokens.push({
  //             type: 'text',
  //             content: chars.join(''),
  //           });
  //           // 3. chars 数组的内容已经被消费，清空它
  //           chars.length = 0;
  //           // 4. 消费当前字符
  //           str = str.slice(1);
  //         }
  //         break;
  //       // 状态机当前处于标签结束状态
  //       case State.tagEnd:
  //         if (isAlpha(char)) {
  //           // 1. 遇到字母，切换到结束标签名称状态
  //           currentState = State.tagEndName;
  //           // 2. 将当前字符缓存到 chars 数组
  //           chars.push(char);
  //           // 3. 消费当前字符
  //           str = str.slice(1);
  //         }
  //         break;
  //       // 状态机当前处于结束标签名称状态
  //       case State.tagEndName:
  //         if (isAlpha(char)) {
  //           // 1. 遇到字母，不需要切换状态，但需要将当前字符缓存到 chars 数组
  //           chars.push(char);
  //           // 2. 消费当前字符
  //           str = str.slice(1);
  //         } else if (char === '>') {
  //           // 1. 遇到字符 >，切换到初始状态
  //           currentState = State.initial;
  //           // 2. 从 结束标签名称状态 --> 初始状态，应该保存结束标签名称 Token
  //           // 注意，此时 chars 数组中缓存的内容就是标签名称
  //           tokens.push({
  //             type: 'tagEnd',
  //             name: chars.join(''),
  //           });
  //           // 3. chars 数组的内容已经被消费，清空它
  //           chars.length = 0;
  //           // 4. 消费当前字符
  //           str = str.slice(1);
  //         }
  //         break;
  //     }
  //   }

  //   // 最后，返回 tokens
  //   return tokens;
  // }

  return {
    genTokens,
  };
};

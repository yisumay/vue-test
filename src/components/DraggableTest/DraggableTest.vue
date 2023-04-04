<template>
  <div>
    <div class="mainDiv" id="columns">
      <div
        id="child"
        class="childDiv"
        v-for="(option, index) in options"
        :key="index"
        @mousedown="down"
        @mouseup="end"
      >
        {{ option }}
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Draggable',
  data() {
    return {
      options: ['选项1', '选项2', '选项3', '选项4'],
      columns: undefined,
      flags: false,
      position: { x: 0, y: 0 },
      nx: '',
      ny: '',
      dx: '',
      dy: '',
      xPum: '',
      yPum: '',
    };
  },
  mounted() {
    this.columns = document.querySelectorAll('#child');
    console.log(
      '%c [ columns ]',
      'font-size:13px; background:pink; color:#bf2c9f;',
      this.columns
    );
    // let num = 0;
    // for (let i of this.columns) {
    //   i.style.top = i.offsetHeight * num + 'px';
    //   i.addEventListener('touchstart', this.down);
    //   i.addEventListener('touchmove', this.move);
    //   i.addEventListener('touchend', this.end);
    //   num++;
    // }
    this.columns.forEach((item, index) => {
      item.style.top = item.offsetHeight * index + 'px';
      item.addEventListener('touchstart', this.down);
      item.addEventListener('touchmove', this.move);
      item.addEventListener('touchend', this.end);
    });
  },
  methods: {
    down(e) {
      console.log(
        '%c [ touches ]',
        'font-size:13px; background:pink; color:#bf2c9f;',
        e.touches
      );
      e.preventDefault();
      this.flags = true;
      var touch;
      if (e.touches) {
        touch = e.touches[0];
      } else {
        touch = e;
      }
      /*touch.clientX clientY 鼠标点击的位置与视图窗口的距离
       * e.target.offsetLeft offsetTop 鼠标点击的div与父元
       * 素的边框距离，父元素必须为定位样式，不然认为父元素为body
       * */
      this.position.x = touch.clientX;
      this.position.y = touch.clientY;
      this.dx = e.target.offsetLeft;
      this.dy = e.target.offsetTop;
      document.addEventListener('mousemove', this.move, true);
    },
    move(e) {
      if (this.flags) {
        var touch;
        if (e.touches) {
          touch = e.touches[0];
        } else {
          touch = e;
        }
        this.nx = touch.clientX - this.position.x;
        this.ny = touch.clientY - this.position.y; //移动的距离
        this.xPum = this.dx + this.nx;
        this.yPum = this.dy + this.ny;
        e.target.style.left = this.xPum + 'px';
        e.target.style.top = this.yPum + 'px';
      }
    },
    end(e) {
      //处理边界问题
      // let right = e.target.offsetLeft + e.target.offsetWidth;
      // let bottom = e.target.offsetTop + e.target.offsetHeight;
      // if (
      //   e.target.offsetLeft <= 0 ||
      //   right >= e.target.offsetParent.offsetWidth
      // ) {
      //   e.target.style.left = 0 + 'px';
      // }
      // if (
      //   e.target.offsetTop <= 0 ||
      //   bottom >= e.target.offsetParent.offsetHeight
      // ) {
      //   e.target.style.top = 0 + 'px';
      // }
      this.rectifyLocation(e.target);
      this.dataTransfer(e);
      this.flags = false;
    },

    rectifyLocation(e) {
      let right = e.offsetLeft + e.offsetWidth;
      let bottom = e.offsetTop + e.offsetHeight;
      if (e.offsetLeft <= 0 || right >= e.offsetParent.offsetWidth) {
        e.style.left = 0 + 'px';
      }
      if (e.offsetTop <= 0 || bottom >= e.offsetParent.offsetHeight) {
        e.style.top = 0 + 'px';
      }
    },

    dataTransfer(e) {
      let eleTop = e.target.offsetTop + Math.round(e.target.offsetHeight / 2); //找到当前元素的中间位置
      let arr = Array.from(this.columns); //将nodelist转为array
      console.log(
        '%c [ dataTransfer ]',
        'font-size:13px; background:pink; color:#bf2c9f;',
        arr,
        eleTop
      );
      let index = arr.indexOf(e.target); //找到当前元素下标
      for (let i in arr) {
        //如果当前元素进入另一个元素的位置，将他们的值互换，位置还原
        if (
          eleTop > arr[i].offsetTop &&
          eleTop < arr[i].offsetTop + arr[i].offsetHeight
        ) {
          console.log(
            '%c [ enter ]',
            'font-size:13px; background:pink; color:#bf2c9f;',
            eleTop,
            arr[i].offsetTop,
            arr[i].offsetHeight
          );
          //值互换，位置还原（保证数组的序列数据不变）
          let temp = arr[index].innerText;
          arr[index].innerText = arr[i].innerText;
          arr[i].innerText = temp;
        }
      }
      let num = 0;
      for (let i of this.columns) {
        i.style.top = i.offsetHeight * num + 'px';
        i.style.left = 0 + 'px';
        num++;
      }
    },
  },
};
</script>
<style scoped>
.mainDiv {
  position: absolute;
  height: 500px;
  width: 260px;
  border: 3px solid red;
  border-radius: 10px;
  margin: 10px;
}

.mainDiv > .childDiv {
  position: absolute;
  height: 50px;
  width: 90%;
  background-color: blue;
  border: 2px solid;
  border-radius: 10px;
  margin: 1px auto;
  padding: 10px;
  text-align: center;
}

.test {
  position: relative;
  height: 50px;
  width: auto;
  background-color: red;
  border: 2px solid;
  border-radius: 3px;
  margin: 1px 0 1px;
  padding: 10px;
  text-align: center;
}
</style>

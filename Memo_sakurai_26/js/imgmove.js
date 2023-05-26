'use strict';

//移動に使用するためのグローバル変数
let startX = 0;
let startY = 0;
let target = null;

function dragStart(e){
  //e.target.classList.add("drag");
  startX = e.pageX - e.target.offsetLeft;
  startY = e.pageY - e.target.offsetTop;
  target = e.target;
  //console.log(target);
  target.style.zIndex = 300;
  //let shiftX = event.clientX - ball.getBoundingClientRect().left;
  //let shiftY = event.clientY - ball.getBoundingClientRect().top;
  //target.style.position = 'absolute'
  //document.body.append(target);
}

function moveAt(e){
  if(target){
    target.style.top = `${e.pageY - startY}px`;
    target.style.left = `${e.pageX - startX}px`;
  }
}

function dragEnd(e){
  if(target){
    target.style.zIndex = 200;
    target = null;
  }
}

// mousemove でボールを移動する
document.addEventListener("mousemove", moveAt);
// 移動終了
document.addEventListener("mouseup",dragEnd);
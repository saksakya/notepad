'use strict';

//移動に使用するためのグローバル変数
let startX = 0;
let startY = 0;
let target = null;

function dragStart(e){
  //e.target.classList.add("drag");
  //左クリックのみ移動可能
  if(e.button === 0){
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
}

// 画像を特定地点に移動
function moveAt(e){
  if(target){
    target.style.top = `${e.pageY - startY}px`;
    target.style.left = `${e.pageX - startX}px`;
  }
}

// 移動後に初期化
function dragEnd(e){
  if(target){
    target.style.zIndex = 200;
    target = null;
  }
}

// 画像を右に回転
function rotateImg(e){
  if(e.button === 2){
    let rotate = Number(e.target.style.transform.replace(/[^0-9]/g, ''));
    rotate += 90;
    if(rotate >= 360) rotate -= 360;
    e.target.style.transform = `rotate(${rotate}deg)`;
  }
}

// mousemove でボールを移動する
document.addEventListener("mousemove", moveAt);
// 移動終了
document.addEventListener("mouseup",dragEnd);
'use strict';

//移動に使用するためのグローバル変数
let startX = 0;
let startY = 0;
let zIndexNum = 50;
let target = null;

function dragStart(e){
  //e.target.classList.add("drag");
  //左クリックのみ移動可能
  if(e.button === 0){
    startX = e.pageX - e.target.offsetLeft;
    startY = e.pageY - e.target.offsetTop;
    target = e.target;
    target.style.zIndex = zIndexNum ++;
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
    target = null;
    savePiecesInfo(true);
    //console.log('autosaveFlag')
  }
}

// 画像を右に回転
function rotateImg(e){
  if(e.button === 2){
    if(e.target.style.zIndex != zIndexNum) zIndexNum++;
    e.target.style.zIndex = zIndexNum;
    let rotate = Number(e.target.style.transform.replace(/[^0-9]/g, ''));
    rotate += 90;
    if(rotate >= 360) rotate -= 360;
    e.target.style.transform = `rotate(${rotate}deg)`;
  }
}

// mousemove で移動
document.addEventListener("mousemove", moveAt);
// 移動終了
document.addEventListener("mouseup",dragEnd);
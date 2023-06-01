
/****************************************************************
 * 要素を移動するための処理を記述
 ****************************************************************/

'use strict';

//移動に使用するためのグローバル変数
let startX = 0;
let startY = 0;
let zIndexNum = 100;
let target = null;

function dragStart(e){
  //e.target.classList.add("drag");
  //左クリック&タイマー動作時のみ移動可能
  if(e.button === 0 && reqAni !== null){
    startX = e.pageX - e.target.offsetLeft;
    startY = e.pageY - e.target.offsetTop;
    target = e.target;
    target.style.zIndex = zIndexNum ++;
    //let shiftX = event.clientX - ball.getBoundingClientRect().left;
    //let shiftY = event.clientY - ball.getBoundingClientRect().top;
    //target.style.position = 'absolute'
    //document.body.append(target);
    //console.log(zIndexNum);
  }
}

// 画像を特定地点に移動
function moveAt(e){
  if(target){
    target.style.top = `${e.pageY - startY}px`;
    target.style.left = `${e.pageX - startX}px`;
  }
}

// 移動後に初期化・オートセーブ
function dragEnd(e){
  if(target){
    matchingPos(e.target);
    target = null;
    savePiecesInfo(true);
    //console.log('autosaveFlag')

  }
}

// 右クリックで画像を右に回転
function rotateImg(e){
  if(e.button === 2 && reqAni !== null){
    if(e.target.style.zIndex != zIndexNum) zIndexNum++;
    e.target.style.zIndex = zIndexNum;
    let rotate = Number(e.target.style.transform.replace(/[^0-9]/g, ''));
    rotate += 90;
    if(rotate >= 360) rotate -= 360;
    e.target.style.transform = `rotate(${rotate}deg)`;
  }
  matchingPos(e.target);
}

// mousemove で移動
document.addEventListener("mousemove", moveAt);
// 移動終了
document.addEventListener("mouseup",dragEnd);


//初期位置かどうか確認する関数
function matchingPos (e){
  let piecesImg = document.getElementById(PIECES_ID).children
  const allow = 10;
  let iPos = {};
  let i = 0;

  let pPos= {
    x : parseInt(e.style.left) ,
    y : parseInt(e.style.top) ,
    rotate : Number(e.style.transform.replace(/[^0-9]/g, ''))
  }

  for(let element of piecesImg){
    if(element === e) {
      iPos = imgInstance.initialPos[i];
      break;
    }
    i ++;
  }
//  console.log(pPos);
//  console.log(iPos);
  if(iPos.x - allow < pPos.x  &&  pPos.x < iPos.x + allow &&
      iPos.y -allow < pPos.y && pPos.y < pPos.y + allow &&
      pPos.rotate == 0){

        imgInstance.removeEvent(PIECES_ID, i);//画像固定
        fixedPiecesNumber ++;

        if(fixedPiecesNumber >= piecesImg.length){
          completePuzzle();
        }
  }

}

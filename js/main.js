'use strict';

// パズル用の画像パスの定義
const IMAGE_PATH = [
  './img/dummy.png',
  './img/America.jpg',
  './img/DRS.jpg',
  './img/GOG.jpeg',
  './img/Sakura.webp',
];

// canvasサイズ(パズルサイズ)
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// ピースを表示するdivID
const PIECES_ID = 'pieces-storage';

// ピース数定義
const PIECE_NUMBER = {
  P4 : {horizontal : 2 , vertical : 2},
  P12 : {horizontal : 4 , vertical : 3},
  P24 : {horizontal : 6 , vertical : 4},
  P48 : {horizontal : 8 , vertical : 6},
  P96 : {horizontal : 12 , vertical : 8},
  P192 : {horizontal : 16 , vertical : 12},
  P300 : {horizontal : 20 , vertical : 15},
  P500 : {horizontal : 25 , vertical : 20},
  P600 : {horizontal : 30 , vertical : 20},
};

// 総ピース数、初期値はテスト用に24ピース
let totalPiece = 'P24';

// ローカルストレージの名前の定義
const LSkeyName = [
  'originalImg',  //オリジナルの画像
  'pieceData',    //ピースの座標・URL情報
  'elapsedTime'   //経過時間
]

// HTMLのcanvas要素
const cvs = document.querySelector("canvas");
const ctx = cvs.getContext("2d");

// howToPlayの文字列
const DESCRIPTION_MESSAGE = [
  '- How to PLAY - ',
  ' 1. ピース数を選択して、いずれかの方法でジグソーパズルを生成して下さい。',
  '     ① 右側の枠線内にドラッグ&ドロップして好きな画像を読み込む',
  '     ②「画像を選択」ボタンで好きな画像を読み込む',
  '     ③「ランダム画像」でランダムに画像を選択',
  ' 2. パズルを生成すると、タイマーがスタートします。',
  ' 3. パズルを早く組み立てよう!',
  '■ 操作方法',
  '   左ドラッグ：パズルを移動',
  '   右クリック：パズルを回転',
  '  「START」「PAUSE」: タイマを一時停止・再開    停止中は操作不可',
  '   SLOTを選択 → 「SAVE」:現在の状況を保存     「LOAD」: 読み出し',
  //'   ピースを動かすとAutoSaveスロットに自動保存されます。',
];

//フォントサイズ置き換え用
const match = /(?<value>\d+\.?\d*)/;

//クラスインスタンス生成用グローバル変数
let imgInstance = null;

//requestAnimationFlameタイマー管理用
let reqAni = null;

//タイマー秒数
let allElapsedTime = [0,0];

//タイマー秒数
let puzzleLoadedFlag = false;

//正しい位置にあるピースの数
let fixedPiecesNumber = 0;

//TimerのDOM要素を定義
let timerDOM = document.querySelector("#timerSS");

const sleep = time => new Promise(resolve => setTimeout(resolve, time));//タイマとして使用

/**************************************************************************
 * イメージを分割して描画するクラス
 *************************************************************************/
class sliceImage{
  constructor({
    imageSource = IMAGE_PATH[0],
    cvs,
    pieceNumber,
  }){
    this.image = new Image();
    this.image.src = imageSource;
    this.cvs = cvs;
    this.ctx = this.cvs.getContext("2d");
    this.pieceNumber = pieceNumber;
    this.initCVS();
    this.calPieceSize();
    this.piecesImg = [];
    this.initialPos = [];
    //this.imageScale();ここで初期化しようとすると、widthとheightが未取得のことがあるため没 slice内で分割時に初期化
  }

  // 非同期でパズル用画像1枚を読み込み
  drawOneImage() {
    return new Promise(resolve => {
      this.image.onload = () =>{
        this.ctx.drawImage(this.image,0,0,this.cvs.width,this.cvs.height);
        resolve();
      }
    });
  }

  //ヒント表示(背景に薄っすらオリジナル画像を表示)
  async hint(){
    ctx.globalAlpha = 0.4;
    //console.log(imgInstance.image.src)
    this.ctx.drawImage(this.image,0,0,this.cvs.width,this.cvs.height);
    ctx.globalAlpha = 1;
  }

  //画像サイズとcanvasサイズの比率を計算
  imageScale(){
    this.scale ={
      width : this.image.width / CANVAS_WIDTH,
      height : this.image.height / CANVAS_HEIGHT
    }
  }

  //ピースの大きさを計算
  calPieceSize(){
    this.pieceSize = {
      width : CANVAS_WIDTH / this.pieceNumber.horizontal,
      height : CANVAS_HEIGHT / this.pieceNumber.vertical
    };
  }

  //画像を分割して、imgURLを代入
  async slice(elementID){

    return new Promise(resolve => {
      this.imageScale();
      this.removeChild(elementID);
      this.cvs.width = this.pieceSize.width;
      this.cvs.height = this.pieceSize.height;

      for(let i = 0; i < this.pieceNumber.vertical; i ++){
        for(let j = 0; j < this.pieceNumber.horizontal; j++){
          this.ctx.drawImage(this.image,this.pieceSize.width * this.scale.width * j,this.pieceSize.height * this.scale.height * i,
            this.pieceSize.width * this.scale.width,this.pieceSize.height * this.scale.height,0,0,this.pieceSize.width,this.pieceSize.height);
          this.piecesImg.push(cvs.toDataURL());
        }
      }
      this.initCVS();
      resolve();
    });
}

  //画像を分割して、imgURLを代入(ピース形状強化バージョン)
  async strongSlice(elementID){

    this.imageScale();
    this.removeChild(elementID); //子要素初期化

    //線を引く関数が分かりやすくするため、別の変数に代入
    let width = this.pieceSize.width;   // ピースの幅
    let height = this.pieceSize.height; // ピースの高さ
    let bumpWidth = width / 25 * 7;
    let bumpHeight = height / 25 * 7;

    let trimWidth = width / 5 * 2;      // ピースの円弧開始位置(幅)
    let trimHeight = height / 5 * 2;    // ピースの円弧開始位置(高さ)
    let c1Width = width / 4 * 1;        // 制御点1(w)

    //乱数を使って、制御点に揺らぎを持たせたかったが、受け側と揺らぎを合わせるために配列に保管の必要あり
    //テストする時間がなくて断念
    // let c1Width = () => {
    //   let tempRand = 1.05 - Math.random() / 10 //0.95-1.05の揺らぎを持たせる
    //   return width / 4 * 1 * tempRand;
    // }

    let c1Height = height / 3 * 1;      // 制御点1(h)
    let c2Width = width / 3 * 1;        // 制御点2(w)
    let c2Height = height / 4 * 1;      // 制御点2(h)
    let rightBump = [];                  // ピース右の凹凸(左隣判定用)
    let bottomBump = [];                 // ピース下部の凹凸(下隣判定用)

    //ピースの大きさ+ピースの出っ張り分の合計の大きさ
    let grossWidth = width + bumpWidth * 2;
    let grossHeight = height + bumpHeight * 2

    let initialPos = {}; //パズルの初期位置

    //canvas要素をピースの大きさ+ピースの出っ張り分へ補正
    this.cvs.width = grossWidth;
    this.cvs.height = grossHeight;

    for(let i = 0; i < this.pieceNumber.vertical; i ++){
      for(let j = 0; j < this.pieceNumber.horizontal; j ++){
    // for(let i = 0; i < 2; i ++){
    //   for(let j = 0; j < 2; j ++){
        //凹凸ランダム判定用
        let rand = [];
        for(let z = 0; z < 2; z++)
          rand [z] = Math.trunc(Math.random() * 2);

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo( bumpWidth , bumpHeight );

        this.ctx.lineTo( trimWidth + bumpWidth, bumpHeight );

        if(i === 0){
          this.ctx.lineTo( width - trimWidth + bumpWidth, bumpHeight );
        } else {
          if(bottomBump[j] === false) c1Height *= -1 //凹凸逆転
          this.ctx.bezierCurveTo(c1Width + bumpWidth , c1Height + bumpHeight, width - c1Width + bumpWidth, c1Height + bumpHeight,
            width - trimWidth + bumpWidth, bumpHeight);
          if(bottomBump[j] === false) c1Height *= -1 //変数内容元に戻す
        }

        this.ctx.lineTo( width + bumpWidth , bumpHeight );
        this.ctx.lineTo( width + bumpWidth , trimHeight + bumpHeight);


        if(j === this.pieceNumber.horizontal - 1){
          this.ctx.lineTo( width + bumpWidth , height - trimHeight + bumpHeight );
        } else {
          if(rand[0] === 1) {
            c2Width *= -1 //凹凸逆転
            rightBump[j] = true;
          } else {
            rightBump[j] = false;
          }
          this.ctx.bezierCurveTo(width - c2Width + bumpWidth , c2Height + bumpHeight , width - c2Width +bumpWidth , height - c2Height + bumpHeight,
            width + bumpWidth , height - trimHeight + bumpHeight);
          if(rand[0] === 1) c2Width *= -1 //変数内容元に戻す
        }

        this.ctx.lineTo( width + bumpWidth , height + bumpHeight);
        this.ctx.lineTo( width - trimWidth + bumpWidth, height + bumpHeight);

        if(i === this.pieceNumber.vertical - 1){
          this.ctx.lineTo( trimWidth + bumpWidth, height + bumpHeight);
        } else {
          if(rand[1] === 1) {
            c1Height *= -1 //凹凸逆転
            bottomBump[j] = true;
          } else {
            bottomBump[j] = false;
          }
          this.ctx.bezierCurveTo( width -c1Width + bumpWidth , height - c1Height + bumpHeight, c1Width + bumpWidth, height - c1Height + bumpHeight,
            trimWidth + bumpWidth, height + bumpHeight);
          if(rand[1] === 1) c1Height *= -1 //変数内容元に戻す
        }

        this.ctx.lineTo( bumpWidth , height + bumpHeight);
        this.ctx.lineTo( bumpWidth , height -trimHeight + bumpHeight);

        if(j === 0){
          this.ctx.lineTo( bumpWidth, trimHeight + bumpHeight );
        } else {
          if(rightBump[j - 1] === false) c2Width *= -1 //凹凸逆転
          this.ctx.bezierCurveTo( c2Width + bumpWidth , height - c2Height + bumpHeight, c2Width + bumpWidth, c2Height + bumpHeight,
            bumpWidth, trimHeight + bumpHeight);
          if(rightBump[j - 1] === false) c2Width *= -1 //変数内容元に戻す
        }

        this.ctx.lineTo( bumpWidth , bumpHeight );

        this.ctx.clip();

        this.ctx.drawImage(this.image, (width * j - bumpWidth) * this.scale.width ,(height * i - bumpHeight) * this.scale.height,
          grossWidth * this.scale.width, grossHeight * this.scale.height, 0 , 0 , grossWidth, grossHeight);

        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        initialPos.x = width * j - bumpWidth;
        initialPos.y = height * i - bumpHeight;

        this.initialPos.push(JSON.parse(JSON.stringify(initialPos)));//値渡し
        this.piecesImg.push(cvs.toDataURL());

        //変数等初期化
        this.ctx.restore();
        this.ctx.clearRect(0,0,grossWidth,grossHeight);
      }
    }
    this.initCVS();
  }

  /**
   * 分割した画像をhtml要素へ表示
   * @param elementID 表示するDOM ID
   */
  drawPieces(elementID){
    let piecesContents = document.getElementById(elementID)
    for(let value of this.piecesImg){
      let img = document.createElement("img")
      img.src = value;
      img.addEventListener("mousedown", dragStart);//mousedownイベントを各img要素に仕込む
      img.addEventListener("contextmenu", rotateImg);//右クリックは回転
      img.setAttribute("oncontextmenu" , "return false");//画像上は右クリックメニュー禁止
      img.style.userSelect = 'none';

      img.ondragstart = () => false;//ondragイベントがmousedownイベントと競合するため無効にする。
      piecesContents.appendChild(img);
    }
  }

  removeEvent(elementID,i){
    let img = document.getElementById(elementID).children;
    img[i].removeEventListener("mousedown", dragStart);
    img[i].removeEventListener("contextmenu", rotateImg);
    img[i].style.left = `${this.initialPos[i].x}px`;
    img[i].style.top = `${this.initialPos[i].y}px`;
    img[i].style.zIndex = 1;
    img[i].style.pointerEvents = 'none';
  }

  // 表示した画像をランダムに配置
  randLayout(elementID){
    let piecesElement = document.getElementById(elementID).children;
    let rand = {};
    let randNum = {
      x : 400 - this.pieceSize.width,
      y : 500 - this.pieceSize.height
    }

    for(let element of piecesElement){
      rand.x = Math.trunc(Math.random() * randNum.x) + CANVAS_WIDTH;
      rand.y = Math.trunc(Math.random() * randNum.y);
      rand.d = 90 * Math.trunc(Math.random() * 4);
      rand.z = Math.trunc(Math.random() * 99) + 1;
      element.style.left = `${rand.x}px`;
      element.style.top = `${rand.y}px`;
      element.style.transform = `rotate(${rand.d}deg)`;
      element.style.zIndex = rand.z;
    }
  }

  //画像の位置情報を取得
  getImgPos(elementID){
    let piecesElement = document.getElementById(elementID).children;
    let i = 0;
    let posInfo = [];

    for(let element of piecesElement){
      posInfo[i] = {
        posX : element.style.left,
        posY : element.style.top,
        rotate : element.style.transform,
        zIndex : element.style.zIndex
      }
      i ++;
    }
    return posInfo;
  }

  //保存された情報を元に画像を復元
  loadImg(elementID, saveData){
    this.removeChild(elementID);
    this.piecesImg = []; //配列初期化

    for(let i = 0; i < saveData.length; i++){
      this.piecesImg[i] = saveData[i].url;
      this.initialPos[i] = saveData[i].initialPos;
    }

    this.drawPieces(elementID);

    let piecesElement = document.getElementById(elementID).children;
    let i = 0;

    for(let element of piecesElement){
      element.style.left = saveData[i].posX;
      element.style.top = saveData[i].posY;
      element.style.transform = saveData[i].rotate;
      element.style.zIndex = saveData[i].zIndex;
      //新規ピースにはzIndexの最大値より大きい値を設定する必要があるため
      if(zIndexNum < saveData[i].zIndex)
        zIndexNum = saveData[i].zIndex;
      matchingPos(element);
      i ++;
    }

  }

  //子要素を全て削除
  removeChild(elementID){
    let element = document.getElementById(elementID);

    while(element.firstChild ){
      element.removeChild(element.firstChild );
    }
  }

  initCVS(){
    this.cvs.width = CANVAS_WIDTH;
    this.cvs.height = CANVAS_HEIGHT;
    this.ctx.clearRect(0,0,cvs.width,cvs.height);
  }
}

// グローバルでインスタンス生成 これがないと、cvsが初期化されない。後で要変更
imgInstance = new sliceImage({
  imageSource : IMAGE_PATH[0],
  cvs:cvs,
  pieceNumber : PIECE_NUMBER[totalPiece],
});

// main関数
async function drawInitImage(){
  await imgInstance.drawOneImage();
  await imgInstance.strongSlice(PIECES_ID);
  imgInstance.drawPieces(PIECES_ID);
  imgInstance.randLayout(PIECES_ID);
  initPuzzle();
  howToPlay();
}

//用意された画像をランダムで取込
async function randomImgPuzzle(){
  let modal = new controlModal({
    modalID : 'modal-1',
    modalTitle : '確認',
    modalContents : '作成中のパズルがリセットされますが、呼び出しますか？'
  });

  if (puzzleLoadedFlag === false || await modal.confirm()){
  //if (confirm('作成中のパズルがリセットされますが、呼び出しますか？') === true){
    let rand = Math.trunc(Math.random() * (IMAGE_PATH.length - 1)) + 1;

    totalPiece = `P${document.querySelector("#totalPiece").value}`;
    imgInstance = new sliceImage({
      imageSource : IMAGE_PATH[rand],
      cvs:cvs,
      pieceNumber : PIECE_NUMBER[totalPiece],
    });
    document.form1.hint.checked = false;
    drawInitImage();
  }
}


//外部画像読み込み用関数
async function selectFileProcessing(e){
  let modal = new controlModal({
    modalID : 'modal-1',
    modalTitle : '確認',
    modalContents : '作成中のパズルがリセットされますが、呼び出しますか？'
  });

  const reader = new FileReader();

  if (puzzleLoadedFlag === false || await modal.confirm()){

    reader.onload = e => {
      totalPiece = `P${document.querySelector("#totalPiece").value}`;
      imgInstance = new sliceImage({
        imageSource : e.target.result,
        cvs:cvs,
        pieceNumber : PIECE_NUMBER[totalPiece],
      });
      document.form1.hint.checked = false;
      drawInitImage();
    }
    reader.readAsDataURL(e.target.files[0])
  }

}

//ヒント表示用DOM
addEventListener('DOMContentLoaded', () => {

  const triggerCheckbox = document.querySelector('input[name="hint"]');

  triggerCheckbox.addEventListener("change", e => {
    if (e.target.checked) {
      imgInstance.initCVS();
      imgInstance.hint();
    } else {
      imgInstance.initCVS();
      howToPlay();
    }
  });
});

//ローカルストレージにパズル情報を保存
async function savePiecesInfo(autoSave = false){
  let pieceData = imgInstance.getImgPos(PIECES_ID);
  let originalData = imgInstance.image.src;
  let key = [];
  let slotData = document.querySelector("#slot");

  let modal = new controlModal({
    modalID : 'modal-1',
    modalTitle : '確認',
    modalContents : `SLOT:0${slotData.value}に上書き保存しますか?`
  });

  let modal2 = new controlModal({
    modalID : 'modal-2',
    modalTitle : 'Warning',
    modalContents : '保存スロットが選択されていません。'
  });

  if(puzzleLoadedFlag){
    if(autoSave === true){
      for(let i = 0; i < LSkeyName.length; i++ )
        key[i] = `${LSkeyName[i]}100`;
    } else if(slotData.value === ""){
      await modal2.confirm();
      return;
    } else if(slotData.value === "100"){
      modal2.modalContents = 'Auto Saveは自動保存専用です。';
      await modal2.confirm();
      return;
    } else {
      for(let i = 0; i < LSkeyName.length; i++ )
        key[i] = `${LSkeyName[i]}${slotData.value}`;
    }

    if(autoSave === true || await modal.confirm()){
    //if(autoSave === true || confirm(`SLOT:0${slotData.value}に上書き保存しますか?`) === true){
      for (let i = 0; i < pieceData.length; i++) {
        pieceData[i].url = imgInstance.piecesImg[i];
        pieceData[i].initialPos = imgInstance.initialPos[i];
      }

      localStorage.setItem(key[1],JSON.stringify(pieceData));
      localStorage.setItem(key[0],originalData);
      localStorage.setItem(key[2],Math.trunc(allElapsedTime[0] + allElapsedTime[1]));
    }
  } else {
    modal2.modalContents = 'パズルが生成されていません。';
    await modal2.confirm();
  }
}

//ローカルストレージからパズル情報を復元
async function loadPuzzle(){
  let slotData = document.querySelector("#slot");
  let pieceData = JSON.parse(localStorage.getItem(`${LSkeyName[1]}${slotData.value}`));
  let originalData = localStorage.getItem(`${LSkeyName[0]}${slotData.value}`);
  let ET = Number(localStorage.getItem(`${LSkeyName[2]}${slotData.value}`));

  let name = null;

  if (slotData.value === '100') {
    name = 'Auto Save';
  } else{
    name = `SLOT:0${slotData.value}`;
  }

  let modal = new controlModal({
    modalID : 'modal-1',
    modalTitle : '確認',
    modalContents : `${name}のデータを呼び出しますか?`
  });

  let modal2 = new controlModal({
    modalID : 'modal-2',
    modalTitle : 'Warning',
    modalContents : 'スロットを選択して下さい。'
  });

  if(slotData.value === ""){
    await modal2.confirm();
    return;
  } else if(pieceData === null){
    modal2.modalContents = 'データ未保存です。';
    await modal2.confirm();
    return;
  } else if (await modal.confirm()){
    initPuzzle();
    imgInstance.loadImg(PIECES_ID, pieceData);
    imgInstance.image.src = originalData;
    allElapsedTime[1] = ET;

    //ボタン数値変更
    document.form1.hint.checked = false;

    //img srcで画像を読み込んだ瞬間、下記記載なくてもonloadイベントが発火してしまう。意図的にawaitすることで、描写後初期化している。
    await imgInstance.drawOneImage();
    imgInstance.initCVS();
    howToPlay();
  }
}

//upperTimer
timerDOM.addEventListener('click', () => {

  let startTime = performance.now();
  let showTime = document.querySelector("#timerNum")
  let elapsedTime = {};
  let reqAniCopy = reqAni;

  let modal = new controlModal({
    modalID : 'modal-2',
    modalTitle : 'Warning',
    modalContents : '先にパズルを生成して下さい。'
  });

  if(puzzleLoadedFlag){
    timerDOM.textContent = "PAUSE"
    if(reqAni === null){
      let elapsedTimer = () =>{
        //時間表示
        allElapsedTime[0] = performance.now() - startTime;
        elapsedTime.totalSec = Math.trunc((allElapsedTime[0] + allElapsedTime[1]));
        showTime.textContent = calculateTime(elapsedTime.totalSec);
        reqAni = requestAnimationFrame(elapsedTimer);
      }
      elapsedTimer();
    }

    if(reqAniCopy !== null){
      allElapsedTime[1] += allElapsedTime[0]
      cancelAnimationFrame(reqAni);
      timerDOM.textContent = "START"
      reqAni = null;
    }
  } else {
    //confirm('先にパズルを生成して下さい。');
    modal.confirm();
  }
})

function calculateTime(totalMSec){
  let elapsedTime = {};
  let totalSec = totalMSec / 1000;

  elapsedTime.sec = Math.trunc(totalSec % 60).toString().padStart(2,'0');
  elapsedTime.min = Math.trunc(totalSec % 3600 / 60).toString().padStart(2,'0');
  elapsedTime.hour = Math.trunc(totalSec / 3600).toString().padStart(2,'0');
  elapsedTime.time = `${elapsedTime.hour}:${elapsedTime.min}:${elapsedTime.sec}`;

  return elapsedTime.time;
}

//パズル生成時の変数初期化
function initPuzzle(){
  allElapsedTime = [0,0];
  fixedPiecesNumber = 0;
  puzzleLoadedFlag = true;

  //タイマー稼働中なら停止
  if(reqAni !== null)
    timerDOM.click();

  //新規タイマースタート
  timerDOM.click();

}

//パズル完成時
async function completePuzzle(){
  //タイマーストップ
  timerDOM.click();

  await sleep(200);

  let modal = new controlModal({
    modalID : 'modal-2',
    modalTitle : 'Congratulations!',
    modalContents : `あなたのパズル完成時間は${calculateTime(allElapsedTime[1])}でした。`
  });

  await modal.confirm();
}

//howToPlayをcanvas要素に表示
function howToPlay(){
  ctx.font = '40px "M PLUS 1p", sans-serif';
  ctx.fillText(DESCRIPTION_MESSAGE[0] , 40 , 60)
  ctx.font = ctx.font.replace(match, 19)

  for (let i = 1; i < 12; i++)
    ctx.fillText(DESCRIPTION_MESSAGE[i] ,60 , 70 + i * 45);

}

howToPlay();

//テスト用
//drawInitImage();
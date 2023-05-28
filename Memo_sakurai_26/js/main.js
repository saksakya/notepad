/*******************
 * ToDo
 *
 * ピースの形
 * タイマー
 * canvasの大きさを調整する
 * 完成判定
 *
 * !!!優先度低!!!
 * 説明を追加
 * セーブデータを5個ぐらい保管できるようにする。
 * confirmWindowを自作
 * 画像の透明部分は選択できないようにできないか
 *
 */

'use strict';

// パズル用の画像パスの定義
const IMAGE_PATH = [
  './img/dummy.png',
  './img/America.jpg',
  './img/DRS.jpg',
  './img/GOG.jpeg',
  './img/Sakura.webp',
];

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = CANVAS_WIDTH / 3 * 2;

// ピースを表示するdivID
const PIECES_ID = 'pieces-storage';

// ピース数定義
const PIECE_NUMBER = {
  P4 : {horizontal : 2 , vertical : 2},//テスト用
  P12 : {horizontal : 4 , vertical : 3},
  P48 : {horizontal : 8 , vertical : 6},
  P96 : {horizontal : 12 , vertical : 8},
  P192 : {horizontal : 16 , vertical : 12},
  P300 : {horizontal : 20 , vertical : 15},
  P500 : {horizontal : 25 , vertical : 20},
  P600 : {horizontal : 30 , vertical : 20},
};

// 総ピース数、後で変更できるようにする。
let totalPiece = 'P12';

// ローカルストレージの名前の定義
const LSkeyName = [
  'originalImg', //オリジナルの画像
  'pieceData'    //ピースの座標・URL情報
]

// HTMLのcanvas要素
const cvs = document.querySelector("canvas");
const ctx = cvs.getContext("2d");

//クラスインスタンス生成用グローバル変数
let imgInstance = null;

//タイマの定義(現状不要)
let sleep = time => new Promise(resolve => setTimeout(resolve, time));

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
    let c1Height = height / 3 * 1;      // 制御点1(h)
    let c2Width = width / 3 * 1;        // 制御点2(w)
    let c2Height = height / 4 * 1;      // 制御点2(h)
    let rightBump = [];                  // ピース右の凹凸(左隣判定用)
    let bottomBump = [];                 // ピース下部の凹凸(下隣判定用)

    //ピースの大きさ+ピースの出っ張り分の合計の大きさ
    let grossWidth = width + bumpWidth * 2;
    let grossHeight = height + bumpHeight * 2

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

      img.ondragstart = () => false;//ondragイベントがmousedownイベントと競合するため無効にする。
      piecesContents.appendChild(img);
    }
  }

  // 表示した画像をランダムに配置
  randLayout(elementID){
    let piecesElement = document.getElementById(elementID).children;
    let rand = {};

    for(let element of piecesElement){
      rand.x = Math.trunc(Math.random() * 500);
      rand.y = Math.trunc(Math.random() * 300);
      rand.d = 90 * Math.trunc(Math.random() * 4);
      element.style.left = `${rand.x}px`;
      element.style.top = `${rand.y}px`;
      element.style.transform = `rotate(${rand.d}deg)`;
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
    for(let i = 0; i < saveData.length; i++)
      this.piecesImg[i] = saveData[i].url;

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
    //let element = document.getElementsByClassName('canvas-wrap');
    //element.className = 'canvas-wrap';
    //console.log(element.style.width);
    //element.height = "400px";
    //let element = document.getElementsByClassName('canvas-wrap');
    //let element = document.getElementById('pieceInfo');
    //element.style = "width:600px;height:400px";
    //element.style.height = "400px";
    //console.log(element);
    //console.log(element)
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
}

//用意された画像をランダムで取込
function randomImgPuzzle(){
  if (confirm('作成中のパズルがリセットされますが、呼び出しますか？') === true){
    let rand = Math.trunc(Math.random() * (IMAGE_PATH.length - 1)) + 1;
    totalPiece = `P${document.difficulty.totalPieceNum.value}`;

    imgInstance = new sliceImage({
      imageSource : IMAGE_PATH[rand],
      cvs:cvs,
      pieceNumber : PIECE_NUMBER[totalPiece],
    });
    document.form1.hint.checked = false;
    drawInitImage();
  }
}

//画像のファイル入力用DOM
addEventListener("DOMContentLoaded", () => {
  document.getElementById("selectImg").addEventListener("change", e => {

    const reader = new FileReader();

    reader.onload = e => {
      totalPiece = `P${document.difficulty.totalPieceNum.value}`;
      imgInstance = new sliceImage({
        imageSource : e.target.result,
        cvs:cvs,
        pieceNumber : PIECE_NUMBER[totalPiece],
      });
      document.form1.hint.checked = false;
      drawInitImage();
    }
    reader.readAsDataURL(e.target.files[0])
  });
});

//ヒント表示用DOM
addEventListener('DOMContentLoaded', () => {

  const triggerCheckbox = document.querySelector('input[name="hint"]');

  triggerCheckbox.addEventListener("change", e => {
    if (e.target.checked) {
      imgInstance.hint();
    } else {
      imgInstance.initCVS();
    }
  });
});

//ローカルストレージにパズル情報を保存
function savePiecesInfo(){
  let pieceData = imgInstance.getImgPos(PIECES_ID);
  let originalData = imgInstance.image.src;

  if(document.form1.autoSave.checked === true || confirm('パズルを保存しますか?') === true){
    for (let i = 0; i < pieceData.length; i++) pieceData[i].url = imgInstance.piecesImg[i];
    localStorage.setItem(LSkeyName[1],JSON.stringify(pieceData));
    localStorage.setItem(LSkeyName[0],originalData);
  }
}

//ローカルストレージからパズル情報を復元
async function loadPuzzle(){

  let pieceData = JSON.parse(localStorage.getItem(LSkeyName[1]));
  let originalData = localStorage.getItem(LSkeyName[0]);

  if(pieceData === null){
    confirm('ローカルストレージに未保存です。')//エラー処理は後で変更する。
    return;
  } else if (confirm('データを呼び出しますか?') === true){
    imgInstance.loadImg(PIECES_ID, pieceData);
    imgInstance.image.src = originalData;

    //ボタン数値変更
    document.difficulty.totalPieceNum.value = pieceData.length;
    document.form1.hint.checked = false;

    //img srcで画像を読み込んだ瞬間、下記記載なくてもonloadイベントが発火してしまう。意図的にawaitすることで、描写後初期化している。
    await imgInstance.drawOneImage();
    imgInstance.initCVS();
  }
}


// テスト用関数
async function drawInitImage(){
  await imgInstance.drawOneImage();
  await imgInstance.strongSlice(PIECES_ID);
  imgInstance.drawPieces(PIECES_ID);
  imgInstance.randLayout(PIECES_ID);
}

//drawInitImage();
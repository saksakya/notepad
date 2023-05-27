/*******************
 * ToDo
 *
 * 説明を追加
 * ピースの形
 * 完成判定
 * タイマー
 * canvasの大きさを画面可変にする
 * 画像の読み込み
 * 複数のセーブデータ
 */

'use strict';

// 画像パスの定義
const IMAGE_PATH = [
  './img/1.jpg',
]

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = CANVAS_WIDTH / 3 * 2;

// ピースを表示するdivID
const PIECES_ID = 'pieces-storage';

// ピース数定義
const PIECE_NUMBER = {
  P6 : {horizontal : 3 , vertical : 2},//テスト用
  P12 : {horizontal : 4 , vertical : 3},
  P48 : {horizontal : 8 , vertical : 6},
  P96 : {horizontal : 12 , vertical : 8},
  P192 : {horizontal : 16 , vertical : 12},
  P300 : {horizontal : 20 , vertical : 15},
  P500 : {horizontal : 25 , vertical : 20},
  P600 : {horizontal : 30 , vertical : 20},
};

// 総ピース数、後で変更できるようにする。
let totalPiece = 'P6';

// HTMLのcanvas要素
const cvs = document.querySelector("canvas");
const ctx = cvs.getContext("2d");

//タイマの定義(現状不要)
//let sleep = time => new Promise(resolve => setTimeout(resolve, time));

/**************************************************************************
 * イメージを分割して描画するクラス
 *************************************************************************/
class sliceImage{
  constructor({
    imageSource,
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
    this.imageScale();
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

  //画像サイズとcanvasサイズの比率を計算
  imageScale(){
    this.scale ={
      width : this.image.width / this.cvs.width,
      height : this.image.height / this.cvs.height
    }
  }

  //ピースの大きさを計算
  calPieceSize(){
    this.pieceSize = {
      width : cvs.width / this.pieceNumber.horizontal,
      height : cvs.height / this.pieceNumber.vertical
    };
  }

  //画像を分割して、imgURLを代入
  slice(){
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
        rotate : element.style.transform
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
    let element = document.getElementsByClassName('canvas-wrap');
    //element.className = 'canvas-wrap';
    //console.log(element.style.width);
    //element.height = "400px";
    //let element = document.getElementsByClassName('canvas-wrap');
    //let element = document.getElementById('pieceInfo');
      element.style = "width:600px;height:400px";
    //element.style.height = "400px";
    console.log(element);
    //console.log(element)
    // this.cvs.width = CANVAS_WIDTH;
    // this.cvs.height = CANVAS_HEIGHT;
    this.ctx.clearRect(0,0,cvs.width,cvs.height);
  }
}

// グローバルでインスタンス生成
let slice = new sliceImage({
  imageSource: IMAGE_PATH[0],
  cvs:cvs,
  pieceNumber : PIECE_NUMBER[totalPiece],
});

// main関数
async function main(){

  await slice.drawOneImage();
  slice.slice();
  slice.drawPieces(PIECES_ID);
  slice.randLayout(PIECES_ID);

}

main();

//ローカルストレージにパズル情報を保存
function savePiecesInfo(){
  let saveData = slice.getImgPos(PIECES_ID);

  for (let i = 0; i < saveData.length; i++) saveData[i].url = slice.piecesImg[i];
  localStorage.setItem('pieceInfo',JSON.stringify(saveData));

}

//ローカルストレージからパズル情報を復元
function loadPuzzle(){

  let saveData = JSON.parse(localStorage.getItem('pieceInfo'));
  if(saveData === null){
    confirm('ローカルストレージに未保存です。')//エラー処理は後で変更する。
    return;
  } else {
    slice.loadImg(PIECES_ID, saveData);
  }
}
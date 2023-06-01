/********************************************
 * マイクロモダル用クラス設定を記述
 * 使用例は46行目以降参照
*********************************************/

class controlModal{
  constructor({
    modalID,
    modalTitle,
    modalContents
  }){
    this.mID = modalID
    this.elementTitle = document.querySelector(`#${modalID}-title`)
    this.elementContent = document.querySelector(`#${modalID}-content`)
    this.modalTitle = modalTitle;
    this.modalContents = modalContents;
    // this.elementTitle.textContent = modalTitle;
    // this.elementContent.textContent = modalContents;
  }

  confirm(){
    this.elementTitle.textContent = this.modalTitle;
    this.elementContent.textContent = this.modalContents;

    MicroModal.show(this.mID, {
      awaitCloseAnimation: true,
      awaitOpenAnimation: true,
      disableScroll: true,
    });

    return new Promise(resolve => {
      const eventBase = flag => () => {
        document.querySelector('#button-ok').removeEventListener("click", okEvent);
        document.querySelector('#button-cancel').removeEventListener("click", cancelEvent);
        resolve(flag);
      };
      const okEvent = eventBase(true);
      const cancelEvent = eventBase(false);

      document.querySelector('#button-ok').addEventListener("click", okEvent);
      document.querySelector('#button-cancel').addEventListener("click", cancelEvent);
    });
  }

}

//使用例を書きに記述 await処理が必要な場合 async functionで宣言すること。
// function buttonClick(){
//   let modal = new controlModal({
//     modalID : 'modal-1',
//     modalTitle : '確認画面',
//     modalContents : 'あなたは天才ですか？それとも秀才ですか'
//   });

//   let flag
//   flag = modal.confirm();
//   //console.log(test);
// }
/*************************************************************
 * ファイルドラッグアンドドロップ入力用
 * @param inputImgArea : HTML要素のドラッグが反応するIDを指定
 * @param selecImg : HTML要素のinput要素のIDを指定
*************************************************************/

'use strict';

const inputImgArea = document.querySelector('#dropArea');
const selectFile = document.querySelector('#selectImg')

inputImgArea.addEventListener('dragover', e =>  {
	e.preventDefault();
	e.target.style.backgroundColor = '#80ff80';
});
inputImgArea.addEventListener('dragleave', e => {
	e.target.style.backgroundColor = '';
});
inputImgArea.addEventListener('drop', e => {
	e.preventDefault();
	e.target.style.backgroundColor = '';
	if (e.dataTransfer.files.length > 0) {
		selectFile.files = e.dataTransfer.files;
		selectFile.dispatchEvent(new Event('change'));
	}
});

selectFile.addEventListener('change', e => {
	//読み込まれたときの処理を記述する。
	selectFileProcessing(e);
});
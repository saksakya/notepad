/*************************************************************
 * ファイルドラッグアンドドロップ入力用
 * @param inputImgArea : HTML要素のドラッグが反応するIDを指定
 * @param selectImg : HTML要素のinput要素のIDを指定
*************************************************************/

'use strict';

const DROP_AREA = document.querySelector('#pieces-storage');
const SELECT_FILE = document.querySelector('#selectImg')

DROP_AREA.addEventListener('dragover', e =>  {
	e.preventDefault();
	e.currentTarget.style.backgroundColor = ' #6495ed ';
});
DROP_AREA.addEventListener('dragleave', e => {
	e.currentTarget.style.backgroundColor = '';
});
DROP_AREA.addEventListener('drop', e => {
	e.preventDefault();
	e.currentTarget.style.backgroundColor = '';
	if (e.dataTransfer.files.length > 0) {
		SELECT_FILE.files = e.dataTransfer.files;
		SELECT_FILE.dispatchEvent(new Event('change'));
	}
});

SELECT_FILE.addEventListener('change', e => {
	//読み込まれたときの処理を記述する。
	selectFileProcessing(e);
});
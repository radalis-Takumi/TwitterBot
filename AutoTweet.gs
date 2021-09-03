Bearer_Token = "TwitterApp_Token";//作成したAppToken

//認証用インスタンスの生成
var twitter = TwitterWebService.getInstance(
  'xxxxxxxxxxx',//API Key
  'yyyyyyyyyyy'//API secret key
);
 
//アプリを連携認証する
function authorize() {
  twitter.authorize();
}
 
//認証を解除する
function reset() {
  twitter.reset();
}
 
//認証後のコールバック
function authCallback(request) {
  return twitter.authCallback(request);
}

function serch_id(text){
  //画像を保存してあるフォルダーID
  var GOOGLE_DRIVE_FOLDER_ID = "FolderId";
  // 指定フォルダ内のファイルを一括取得(FileIteratorオブジェクト)
  var files = DriveApp.getFolderById(GOOGLE_DRIVE_FOLDER_ID).getFiles();

  var retext = "unsetimage";

  while (files.hasNext()) {
    var file = files.next();
    var fileid = file.getId();
    var filename = file.getName();

    // ★POINT★正規表現で絞り込む
    var strCombRegex = text + "\.JPG";
    // 正規表現に組み合わせたい文字列
    var regexp = new RegExp(strCombRegex,"i");
    // 正規表現オブジェクト ここでは正規表現も文字列で記載する
    if (filename.match(regexp)) {
      retext = fileid;
    }
  }
  return retext;
}

var service        = twitter.getService();
var endPointStatus = 'https://api.twitter.com/1.1/statuses/update.json';
var endPointMedia  = 'https://upload.twitter.com/1.1/media/upload.json';
function mediaTweet(){ 
  //ツイート本文と画像のURL  
  //投稿するテキスト文を作成
  //スプレッドシートの読み込み
  var spreadsheet = SpreadsheetApp.openById('SoreadsheetId');
  var sheet = spreadsheet.getActiveSheet();

  var lastrow = sheet.getLastRow();

  if(sheet.getRange(5,5).getValue() === false){
    console.log("ツイート失敗：配信停止中");
    return;
  }

  //スプレッドシートからテンプレート文を持ってくる
  var post_text = "";
  var reply_text = "";
  var quiz_num = sheet.getRange(5,2).getValue();
  var serch_quiz_text = "No." + quiz_num.toString();
  var limit_time = sheet.getRange(5,3).getValue();
  var question_num = sheet.getRange(5,4).getValue() + 1;
  var post_text = sheet.getRange(1,2).getValue() + sheet.getRange(2,question_num).getValue() + "\n" + sheet.getRange(1,3).getValue() + limit_time.toString() + sheet.getRange(1,4).getValue();
  reply_text = sheet.getRange(1,5).getValue();

  if(lastrow === 5){
    sheet.getRange(6,2).setValue(sheet.getRange(5,2).getValue() + 1);
    sheet.getRange(6,3).setValue(5);
    sheet.getRange(6,4).setValue(1);
    sheet.getRange(6,5).setValue(false);
    lastrow = 6;
  }
  for(var i = 5;i <= lastrow;i++){
    for(var j = 2;j <= 5; j++){
      if(i !== lastrow){
        sheet.getRange(i,j).setValue(sheet.getRange(i + 1,j).getValue());
      }
      else{
        sheet.getRange(i,j).clear();
      }
    }
  }
     
  //画像の取得
  var image_file_id = serch_id(serch_quiz_text);
  if(image_file_id === "unsetimage"){
    console.log("ツイート失敗:画像がセットされてないです．");
    return;
  }
  var fileByApp = DriveApp.getFileById(image_file_id);
  var base64Data = Utilities.base64Encode(fileByApp.getBlob().getBytes());
   
  var img_option = { 
    'method' : "POST", 
    'payload': {
      'media_data': base64Data
    } 
  };
  var image_upload = JSON.parse(service.fetch(endPointMedia, img_option)); 
  var sendoption = { 
    'status'   : post_text, 
    'media_ids': image_upload['media_id_string']
  };
  var tweet_upload = service.fetch(endPointStatus, {method: 'post', payload: sendoption});
  var tw_id = JSON.parse(tweet_upload).id_str;
  var replysendoption = { 
    'status'   : reply_text, 
    'in_reply_to_status_id': tw_id
  };
  service.fetch(endPointStatus, {method: 'post', payload: replysendoption});

}

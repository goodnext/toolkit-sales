require('dotenv').config();
const puppeteer = require('puppeteer');
const axios = require('axios');

async function submitForm() {
  const apiUrl = process.env.KEEPA_API_URL;
  const response = await axios.get(apiUrl);
  
  // レスポンスからASINリストを抽出
  const asinList = response.data.asinList;
  if (!asinList || asinList.length === 0) {
      console.log('ASINリストが取得できませんでした');
      return;
  }
  
  const asinText = asinList.join('\n');

  console.log("ブラウザを起動します...");
  try {
    console.log("ブラウザを起動");
    // ブラウザを起動
    const browser = await puppeteer.launch({
        headless: true,  // ヘッドレスモードで起動
        executablePath: '/usr/bin/chromium',  // 手動でインストールしたChromiumのパス
        args: ['--no-sandbox', '--disable-setuid-sandbox'],  // サーバー環境ではこれらのフラグが必要
    });
    console.log("pageゲット前");
    const page = await browser.newPage();
    console.log("pageゲット");
  

    // リクエストをキャプチャ
    //   page.on('request', request => {
    //     console.log('-------------------------------');
    //     console.log('Request URL:', request.url());
    //     console.log('Request Method:', request.method());
    //     console.log('Request Headers:', request.headers());
    //     if (request.postData()) {
    //       console.log('Request Post Data:', request.postData());
    //     }
    //     console.log('-------------------------------');
    //   });

    console.log("ログインページにアクセス");
    // ログインページにアクセス
    await page.goto(process.env.TARGET_LOGIN_URL); // ログインページのURLに置き換える
    

    // ログイン処理（フォームにデータを入力）
    await page.type('input[name="user[email]"]', process.env.LOGIN_EMAIL);
    await page.type('input[name="user[password]"]', process.env.LOGIN_PASSWORD);
    await page.click('input[type="submit"]');  // ログインボタンをクリック

    await page.waitForNavigation();  // ページ遷移を待つ

    // ログイン後のCookieを取得
    const cookies = await page.cookies();

    // 取得したCookieを次のページリクエストに設定
    await page.setCookie(...cookies);

    // ボタンが存在し、クリック可能になるのを待つ
    await page.waitForSelector('#researchesSignupButton', { visible: true });
    // ボタンをクリック
    await page.click('#researchesSignupButton');

    // Keepaクエリ登録ボタンをクリックしてモーダルを開く
    const elements = await page.$$('a.dropdown-item');
    for (let element of elements) {
        const text = await page.evaluate(el => el.textContent, element);
        if (text.includes('テキスト登録')) {
        await element.click();
        break;
        }
    }
    // モーダルが表示されるのを待つ
    await page.waitForSelector('#value', { visible: true });

    // keepaから取得したASINをセット
    await page.evaluate((asinText) => {
        document.querySelector('textarea[name="value"]').value = asinText;
    }, asinText);

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // フォームを送信する
    await page.click('input[type="submit"][value="インポート"]');


    // 必要なら次のページが読み込まれるのを待つ
    await page.waitForNavigation();


    // 完了後、ブラウザを閉じる
    await browser.close();
  } catch (error) {
    console.error("ブラウザの起動に失敗しました: ", error);
  }
}

submitForm();

// sleep関数を定義
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
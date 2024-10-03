FROM node:18

# 必要な依存関係をインストール
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && apt-get install -y chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r pptruser && useradd -rm -g pptruser -G audio,video pptruser

# 作業ディレクトリを作成
WORKDIR /app

# package.json と package-lock.json をコピー
COPY package*.json ./

RUN npm install

RUN node node_modules/puppeteer/install.js
# puppeteer のフルバージョンをインストール
RUN npm install puppeteer --save-dev --unsafe-perm=true --allow-root


# ソースコードをコピー
COPY . .

# スクリプトを実行
CMD ["node", "script/submitForm.js"]

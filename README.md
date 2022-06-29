## 项目介绍
web版svg矢量图制作GUI

<div style='display:flex'>
<img src="./README_assets/GIF%202022-6-25%20下午%2011-59-59.gif" alt="drawing" width="300"/>
<img src="./README_assets/GIF%202022-6-28%20下午%2010-08-49.gif" alt="drawing" width="300"/>
</div>

## 开始使用
本项目基于nodejs，首先要有nodejs。

在项目目录下打开命令行，运行如下命令安装所需的npm包。
```cmd
npm install
```

在bin/www文件中
```js
var port = normalizePort(process.env.PORT || '3000');
```
处配置端口，比如`3000`。

运行以下命令开服。
```cmd
npm start
```

在浏览器端访问（当端口为`3000`时）：
http://127.0.0.1:3000/


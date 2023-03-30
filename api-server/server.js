const express = require('express');
const cors = require('cors')
const fs = require('fs');
const { create } = require('ipfs-http-client')
const { spawn } = require('child_process');
const bodyParser = require('body-parser');
const multer = require('multer');

var sdk = require('./sdk.js');
var path = require('path');
const { getSystemErrorMap } = require('util');

const app = express();
app.use(cors());
app.use(bodyParser.json());

var port = process.env.PORT || 80;
var HOST = 'localhost';

var TokenID = 0;
const users = [];

const upload = multer({
  dest: 'uploads/', // 업로드된 파일이 저장될 경로
  limits: {
    fileSize: 1024 * 1024 * 100, // 파일 크기 제한 (100MB)
  },
});

function findUserById(id) {
  return users.find(user => user.id === id);
}

function addUser(id, password, org) {
  users.push({ id, password, org });
}

app.listen(port,function(){
  console.log(`Live on port: http://${HOST}:${port}`);
});

app.post('/login', (req, res) => {
  const { id, password} = req.body;
  const user = findUserById(id);
  if (!user) {
    return res.json('존재하지 않는 사용자입니다.');
  }

  if (user.password !== password) {
    return res.json('비밀번호가 일치하지 않습니다.');
  }

  if (user.org === "1"){
    return res.json('관리자 로그인 성공');
  }
  else if (user.org === "2"){
    return res.json('판매자 로그인 성공');
  }
  if (user.org === "3"){
    return res.json('구매자 로그인 성공');
  }
});

app.post('/signup', (req, res) => {
  const { id, password, org } = req.body;

  const user = findUserById(id);
  if (user) {
    return res.json('이미 존재하는 사용자입니다.');
  }
  addUser(id, password, org)
  sdk.initUserForOrg(org, id);
  return res.json('회원가입 성공');
});

app.post('/erc20Init', (req, res) => {
  const { id } = req.body;  
  const user = findUserById(id);
  const org = user.org;
  const channelName = "sale";
  const chaincodeName = "token20";
  const args=["chatcoin", "CC", 18]
  return (sdk.send(channelName, chaincodeName, org, id, true, "Initialize", args, res));
});

app.post('/erc721Init', (req, res) => {
  const { id } = req.body;
  const user = findUserById(id);
  const org = user.org;
  const channelName = "sale";
  const chaincodeName = "token721";
  const args=[ "chatdata", "CD"]
  return (sdk.send(channelName, chaincodeName, org, id, true, "Initialize", args, res));
});

app.post('/erc20Mint', (req, res) => {
  const { id, amount } = req.body;
  const user = findUserById(id);
  const org = user.org;
  const channelName = "sale";
  const chaincodeName = "token20";
  const args=[ amount]
  return (sdk.send(channelName, chaincodeName, org, id, true, "Mint", args, res));
});

app.post('/wallet', (req, res) => {
  const { id } = req.body;
  const user = findUserById(id);
  const org = user.org;
  const channel = 'sale';
  const chaincodeName = 'token20';
  const args=[];
  return (sdk.send(channel, chaincodeName, org, id, true, "ClientAccountID", args, res)); 
});

app.post('/balance', (req, res) => {
  const { id } = req.body;
  const user = findUserById(id);
  const org = user.org;
  const channel = 'sale';
  const chaincodeName = 'token20';
  const args=[];
  return (sdk.send(channel, chaincodeName, org, id, true, "ClientAccountBalance", args, res));
});

app.get('/upload', (req, res) => {
  res.send(`
    <h1>업로드 페이지</h1>
    <form action="/upload" method="post" enctype="multipart/form-data">
    <input type="file" name="file">
    <button type="submit">업로드</button>
  </form>
  `);
});

const client = create({ url: "http://127.0.0.1:5001/api/v0" });

async function uploadFileToIPFS(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const fileAdded = await client.add({ path: filePath, content: fileContent });
    const fileHash = fileAdded.cid.toString();
    console.log(`File added to IPFS with hash: ${fileHash}`);
    return fileHash;
  } catch (error) {
    console.error(`Error uploading file to IPFS: ${error}`);
  }
}

app.post('/upload', upload.single('file'), async (req, res) => {
  const { path } = req.file;

  const pythonProcess = spawn('python', ['/root/go/src/fabric-ml/server/ml/Curse_Detection.py', path]);
  let size = 0; 
  let fileURI = "";
  pythonProcess.on('close', async (code) => {
    console.log(`child process exited with code ${code}`);
    try {
      fileURI = await uploadFileToIPFS(path);
      console.log(`Modified file uploaded to IPFS: ${fileURI}`);
      size = await fs.promises.stat(path).size;
      return (size, fileURI);
    } catch (error) {
      console.error(error);
    }
  });
  
});

app.post('/nftMint', (req, res) => {
  const { id , fileURI } = req.body;
  const user = findUserById(id);
  const org = user.org;
  const channel = 'sale';
  const chaincodeName = 'token721';
  TokenID = TokenID + 1;
  let args = [TokenID, fileURI];
  sdk.send(channel, chaincodeName, org, id, true, "MintWithTokenURI", args, res);
});

app.post('/create', (req, res) => {
  const { id , size } = req.body;
  const user = findUserById(id);
  const org = user.org;
  const channel = 'sale';
  const chaincodeName = 'market';
  const balance = size*100;
  console.log(TokenID);
  let args = [TokenID, user.id, balance];
  sdk.send(channel, chaincodeName, org, id, true, "CreateProduct" , args, res);
});

app.post('/market', (req, res) => {
  const { id } = req.body;
  const user = findUserById(id);
  const org = user.org;
  const channel = 'sale';
  const chaincodeName = 'market';
  const args=[];
  sdk.send(channel, chaincodeName, org, id, false, "GetAllProducts", args, res);
});

app.post('/my', (req, res) => {
  const { id } = req.body;
  const user = findUserById(id);
  const org = user.org;
  const channel = 'sale';
  const chaincodeName = 'market';
  const args=[user.id];
  sdk.send(channel, chaincodeName, org, id, false, "GetMyProducts", args, res);
});

app.post('/buy', (req, res) => {
  const { id, pid } = req.body;
  const user = findUserById(id);
  const org = user.org;
  const channel = 'sale';
  var chaincodeName = 'market';
  const args=[pid, id];
  sdk.send(channel, chaincodeName, org, id, true, "UpdateBuyer", args, res);
});


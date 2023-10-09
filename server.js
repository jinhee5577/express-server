const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const app = express();
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
app.use(express.urlencoded({extended: true}));

let db;
MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, (에러, client) => {
    if (에러) return console.log(에러);
    
    db = client.db('jiniDash');  // jiniDash라는 database 연결좀요.
    // database접속이 완료되면 콜백함수를 실행해준다.
    app.listen(process.env.PORT, () => { //  app.listen()은 원하는 포트에 서버를 오픈하는 문법이라고 보면 된다.
        console.log('listening on 8080');
    });
    // 여기까지가 서버를 띄우기 위해 작성할 기본 셋팅.
});


app.use(express.json());  // 유저가 보낸 array/object 데이터를 출력해보기 위해 필요하고
app.use(cors({origin: [  // 다른 도메인주소끼리 ajax요청 주고받을 때 필요하다. 
   'http://localhost:3000',
   'https://jinipro-a2903.web.app',  // jini3d사이트 origin
   'https://jinidash.du.r.appspot.com',
   'http://openapi.molit.go.kr:8081',
   'https://raw.githubusercontent.com'
]}));

 

app.use(express.static(path.join(__dirname, 'material-dashboard-react-main/build')));
// 메인페이지로 접속하면 리액트로 build한 index.html 보내주셈.
app.get('/dashboard', (req, res) => {
  // res.header("Access-Control-Allow-Origin", "http://openapi.molit.go.kr:8081"); // 특정 도메인 허용
  res.sendFile(path.join(__dirname, '/material-dashboard-react-main/build/index.html'));
});


app.get('/realestate', async (req, res) => {
  const baseurl = 'http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTrade';
  const params = {
    serviceKey : process.env.KEY,
    LAWD_CD : req.query.LAWD_CD,
    // numOfRows : 200,
    DEAL_YMD : 202303,
  };

  try {
    const { data } = await axios.get(baseurl, {params: params});
    console.log(data);
    res.send(data); // react에서 /apitest로 요청하면, 여기서버에서 openAPI를 요청하고 받은 data를 react프론트로 보내준다.
  } catch (err) {
    console.log(err);
  }   
});

app.post('/product/:id', async (req, res) => { // 제품 상세페이지 제품정보 찾아서 보내줌.
   try{
     const { data : { products } } = await axios.get('https://raw.githubusercontent.com/jinhee5577/allData/master/product.json');

     const mlbFind = products.find((item, i) => { // 찾은상품.
           return item.id === parseInt(req.params.id);
     });
     mlbFind['qunn'] = 1; // 수량추가.
     console.log(mlbFind);
     res.send(mlbFind);
   } catch(err) {
     console.log(err);
   }
});


app.get('/dangerserver', (req, res) => {
  console.log(req.query.ip);
  db.collection('danger').findOne({ip: req.query.ip}, (err, output) => {
    console.log(output);
    res.send(output);
  });
});


app.get('/devicehealth', (req, res) => {
  db.collection('allDevice').findOne({customer: req.query.company}, (err, output) => {
     if(output) { res.send(output); }
     if(output == null) { res.status(400); }  // 몽고디비에 저장된 데이터가 몇개 없어서 찾는게 없을수 있다.
  });
});











// 리액트가 라우팅 하도록 전권을 넘기고 싶다면 server.js에 다음과 같은 코드를 밑에 추가하자. 
app.get('*', (req, res) => { // 이코드는 항상 가장 하단에 놓아야 잘된다. 
  res.sendFile(path.join(__dirname, '/material-dashboard-react-main/build/index.html'));
  // "고객이 URL란에 아무거나 입력하면 걍 리액트 프로젝트나 보내주셈"이라는 뜻인데 이렇게 하면 리액트 라우팅 잘된다.
});
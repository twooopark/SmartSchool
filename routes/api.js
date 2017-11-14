var router = express.Router()
  // HTTP Verbs 
  // GET - get a resource 
  // POST - create a resource 
  // PATCH - update a resource
  // PUT - replace a resource
  // DELETE - Delete a resource
router.get("/stat-data", (req, res) => {
  var data = req.query || {}
  var start_day = data.start_day || data["start-day"] || "20171020"
  var end_day = data.end_day || data["end-day"] || "20171120"
  // var category = data.category || 0
  // console.log(data)//{}
  // console.log(data.start_day)//undefined
  // console.log(data.start_day || data["start-day"])//undefined
  // console.log(data.start_day || data["start-day"] || "20171020")//20171020
/*
//자꾸 오류가 생기는데 .... mysql에 시간 타입은 timestamp와 datetime 두가지가 있는데... STAT_DATA는 timestamp, 우리는 datetime으로 했음;;
  var query =
  'SELECT DATE_FORMAT(TIME, "%Y-%m-%d %H:%i:%s") AS time, TYPE AS type, DATA as data, MAC as mac ' +
  'FROM sensor_error ' +
  'WHERE TIME between \'' + iter_split(start_day, [4,2,2]).join("-") + '\' and \'' + iter_split(end_day, [4,2,2]).join("-") + '\'';
 // 'WHERE TIME BETWEEN (\'' + iter_split(start_day, [4,2,2]).join("-") + '\' AND \'' + iter_split(end_day, [4,2,2]).join("-") + '\') ';
*/
/*
 var query =
  'SELECT LOCATION as c_name, DATE_FORMAT(TIME, "%Y-%m-%d %H:%i:%s") AS time, TYPE AS type, DATA as data, MAC as mac ' +
  'FROM sensor_error, classroom ' +
  'WHERE sensor_error.MAC = classroom.MAC_DEC and '+
  'TIME between \'' + iter_split(start_day, [4,2,2]).join("-") + '\' and \'' + iter_split(end_day, [4,2,2]).join("-") + '\'';
*/
//http://neouser.tistory.com/159
//몇십만 row를 불러와서 웹에서 연산한 결과, 응답속도가 10초정도로 너무 느려서 dbms에서 연산하도록 개선했고 row를 줄임
//결과적으로 10초에서 3초정도로 개선됨...ㅠ;; 날짜별로 테이블 만들어야 할것 같기도... mysql 힘들겟다..ㅎㅎ;
 /*
  var query =
  'SELECT LOCATION as loc, DATE_FORMAT(TIME, "%Y-%m-%d") AS time, INFO AS type, count(DATA) as cnt ' +
  'FROM sensor_error, classroom, sensor ' +
  'WHERE sensor.TYPE = sensor_error.TYPE and sensor_error.MAC = classroom.MAC_DEC and '+
  'TIME between \'' + iter_split(start_day, [4,2,2]).join("-") + '\' and \'' + iter_split(end_day, [4,2,2]).join("-") + '\'' +
  'group by loc, DATE_FORMAT(TIME, "%Y-%m-%d"), type ';
*/
//수많은 시도 끝에 결국 통계 테이블 만들었음. 
  var query =
  'SELECT loc, time, type, cnt ' +
  'from sensor_error_hourly order by time';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})
/*
SELECT 
    LOCATION AS CLASSROOM_NAME,
    MAC_HEX AS MAC,
    INFO AS TYPE,
    DATA,
    DATE_FORMAT(TIME, "%Y-%m-%d %H:%i:%s") AS TIME
FROM
    classroom
        LEFT OUTER JOIN
    sensor_data_update ON sensor_data_update.MAC = classroom.MAC_DEC
        LEFT OUTER JOIN
    sensor ON sensor.TYPE = sensor_data_update.TYPE
ORDER BY CLASSROOM_NAME , TYPE
 */
router.get("/sensor-data", (req, res) => {
  var query =
  'SELECT LOCATION AS LOC, MAC_HEX AS MAC, INFO AS TYPE, DATA, DATE_FORMAT(TIME, "%Y-%m-%d %H:%i:%s") AS TIME '+
  'FROM classroom '+
  'left outer join sensor_data_update on sensor_data_update.MAC = classroom.MAC_DEC '+
  'left outer join sensor on sensor.TYPE = sensor_data_update.TYPE '+
  'ORDER BY LOC , TYPE';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})

router.get("/class-data", (req, res) => {
  //No, Location, Serial, MAC_DEC, MAC_HEX, Data_coords
  var query =
  'SELECT NO, LOCATION as LOC, SERIAL, MAC_DEC, MAC_HEX, COORD_X as x, COORD_Y as y '+
  'FROM classroom ORDER BY LOC'

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})

//http://www.opentechguides.com/how-to/article/nodejs/124/express-mysql-json.html
router.post("/class-data-update", (req, res) => {
  var jsondata = req.body;
  var values = "";
  for(var i=0; i< jsondata.length; i++){
    values += "("+jsondata[i].No+",\""+jsondata[i].Location+"\",\""+jsondata[i].Serial+"\","+jsondata[i].MAC_DEC+",\""+jsondata[i].MAC_HEX+"\","+jsondata[i].X+","+jsondata[i].Y+"),";
  }
  values = values.slice(0,-1); //마지막 쉼표 제거
  values += "ON DUPLICATE KEY UPDATE location=VALUES(location),COORD_X=VALUES(coord_x),coord_y=VALUES(coord_y);" //PK 제외
  
  var query = "INSERT INTO classroom (NO,LOCATION,SERIAL,MAC_DEC,MAC_HEX,COORD_X,COORD_Y) VALUES " ;
  query += values;
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }else{res.status(200).send('Complete!');}
  })
})



/****************** MongoDB ****************/
// var User = require('mongoose').model('Raw');//mongoose 모듈을 사용해서 정의해 두었던 Raw 모델을 불러온다.
// router.get('/raws', (req,res,next) => {//express 의 라우팅 기능으로 get 형식으로 /raws 로 들어올 때!
//     User.aggregate([
//     {"$project" : { "loc" : 1, "mac" : 1, "type" : 1, "time" : 1, "cnt" : 1 }},
//     {"$match": { "time": { $gt: "2017-10-24 00:00:00", $lt: "2017-11-24 00:00:00" }}},
//     {"$group" : {_id: {loc:"$loc", mac:"$mac", type:"$type", time:{ $substr: [ "$time", 0, 10 ] }} , cnt:{$sum:1}}}//2011-11-11 10자리 뽑아, 일별로 분류
// ] , function (err,raws) { //find 명령어를 사용하고 콜백함수에 인자로 users 라는 collection 이름을 넣어
//         if(err) {//에러가 난다면 next(err) 오류를 다음 미들웨어로 넘기고
//             return next(err);
//         }else{//에러가 없을 경우 users 컬렉션의find 명령어에 대한 데이터를 응답할 것 이다.
//             res.json(raws)
//         }
//     })
// });//출처: http://alexband.tistory.com/21 [Front-end Rider]



// const User = require('../user.js');

// router.get('/:name', (req, res) => {
//   User.find({ CLASSROOM_MAC: req.params.CLASSROOM_MAC }, (err, user) => {
//     res.end({ user: user });//3.html에 던져줌...(의미없네 ㅎㅎ;;)
//     //res.send()메소드에 전달하는 파라미터마다 content-type이라는 헤더의 설정이 자동으로 바뀜(?) 버퍼를 전달할때, application/octet-stram, 문자열이면 text/html으로, 객체나 배열일땐 application/json으로 설정된다.
//   });
// });
/*
router.post("/class-data-update", (req, res) => {
  var jsondata = req.body;
  var values = [];

  for(var i=0; i< jsondata.length; i++)
    values.push([jsondata[i].name,jsondata[i].address]);

  console.log(values);
  //Bulk insert using nested array [ [a,b],[c,d] ] will be flattened to (a,b),(c,d)
  db.query('INSERT INTO customers (name, address) VALUES ?', [values], function(err,result) {
    if(err) {
       res.send('Error');
    }
   else {
       res.send('Success');
    }
  })
})
*/
/*
router.post("/class-data-update", (req, res) => {

  var jsondata = req.body;
  var values = [];

  for(var i=0; i< jsondata.length; i++)
    values.push([jsondata[i].No,jsondata[i].Location.toString(),jsondata[i].Serial.toString(),jsondata[i].MAC_DEC,jsondata[i].MAC_HEX.toString(),jsondata[i].X,jsondata[i].Y]);

  console.log([values]);
  //Bulk insert using nested array [ [a,b],[c,d] ] will be flattened to (a,b),(c,d)
  db.query('INSERT INTO classroom (`NO`,`LOCATION`,`SERIAL`,`MAC_DEC`,`MAC_HEX`,`COORD_X`,`COORD_Y`) VALUES ?', [values], function(err,result){
    if(err) {
       res.send('Error');
    }
    else {
       res.send('Success');
    }
  })
})
*/







module.exports = router

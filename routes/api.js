var router = express.Router()
var dateutil  = require('date-utils')

function HexToDec(Hex){
  var tempArr, temp, Dec;
  tempArr = Hex.split("-");
  tempArr.reverse();
  temp = tempArr.toString();
  temp = temp.replace(/,/g,"");
  Dec = parseInt(temp, 16);
  return Dec;
}


function DecToHex(Dec){
  var tempArr = new Array(),
      temp = Dec.toString(16).toUpperCase(),
      Hex;
  for(var i = 0; i <= 5; i++){
    tempArr[i] = temp.slice(i*2,i*2+2);
  }
  temp = tempArr.reverse();
  Hex = temp.join("-");
  return Hex;
}

router.get("/dashboard-data", (req, res) => {
  var query =
  'SELECT INFO AS type, round(avg(DATA)) as data '+
  'FROM sensor_data_update '+
  'join sensor on sensor.TYPE = sensor_data_update.TYPE '+
  'GROUP BY TYPE '+
  'ORDER BY TYPE; ';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})


//////////////////////////////////////////////////////////////////////////
///////////////////////////////////sensor/////////////////////////////////
//////////////////////////////////////////////////////////////////////////


router.get("/error-data", (req, res) => {
  var query =
  'SELECT loc, time, type, cnt ' +
  'FROM sensor_error_hourly ORDER BY time';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})

router.get("/sensor_daily-data", (req, res) => {
  var query =
  'SELECT type, time, avge, loc '+
  'FROM sensor_data_daily ORDER BY type, time;';//hourly order by type, time;';//

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})

// daily? hourly? where?
router.post("/sensor_dh-data", (req, res) => {
  var jsondata = req.body;
  var query =
  'SELECT type, time, avge, loc '+
  'FROM sensor_data_'+jsondata.sel;
  if(jsondata.loc) query += ' where loc = \"'+jsondata.loc+'\" ';
  query += ' ORDER BY type, time ';
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }else res.end(JSON.stringify(result))//JSON.stringify(result))
  })
})

//환경정보 (구버전)
router.get("/sensor-data", (req, res) => {
  var query =
  'SELECT  classroom.LOCATION AS LOC,  classroom.MAC_DEC AS MAC, INFO AS TYPE, DATA, DATE_FORMAT(TIME, "%Y-%m-%d %H:%i:%s") AS TIME '+
  'FROM  classroom '+
  'left outer join sensor_data_update on sensor_data_update.MAC =  classroom.MAC_DEC '+
  'left outer join sensor on sensor.TYPE = sensor_data_update.TYPE '+
  'ORDER BY LOC , TYPE';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    for(var i=0; i<result.length; i++){
      result[i].MAC = DecToHex(result[i].MAC);
    }
    var Rs = JSON.stringify(result);
    res.end(Rs)
  })
})

//교실별 디바이스 현황(작동/확인요)
router.get("/sensor_update-data", (req, res) => {
  var query =
    'SELECT z.LOCATION as class_name, z.MAC as mac, MIN(su.TIME) as time '+
    'FROM classroom_new as z '+
    'left outer join sensor_data_update as su on su.MAC = z.MAC '+
    'GROUP BY z.LOCATION, z.MAC ;';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    var Rs = JSON.stringify(result);
    res.end(Rs)
  })
})

//선택 교실 디바이스 정보(센서별 시간/오류)
router.post("/sensor_type_rt-data", (req, res) => {
  var jsondata = req.body;
  var query =
    'SELECT s.INFO as type, su.data as data, su.TIME as time '+
    'FROM  classroom_new as z '+
    'left outer join sensor_data_update as su on su.MAC = z.MAC '+
    'left outer join sensor as s on su.TYPE = s.TYPE '+
    'WHERE su.MAC = z.MAC and su.TYPE = s.TYPE and z.LOCATION = \"'+jsondata.c_name+'\" '+
    'ORDER BY s.TYPE ;';
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    var Rs = JSON.stringify(result);
    res.end(Rs)
  })
})

//당일 교실 디바이스 오류(센서별 시간/오류)
router.post("/sensor_type_error-data", (req, res) => {
  var jsondata = req.body;
  var dt = new Date();
      //dt.setDate(dt.getDate()-1); 
  var d = dt.toFormat('YYYY-MM-DD');
  var query =
    'SELECT se.type, DATE_FORMAT(time, "%Y-%m-%d") as time, SUM(cnt) as cnt '+
    'FROM sensor_error_hourly as se '+
    'WHERE time > \''+d+'\' and loc = \"'+jsondata.c_name+'\" '+
    'GROUP BY se.type, DATE_FORMAT(time, "%Y-%m-%d") ';
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    var Rs = JSON.stringify(result);
    res.end(Rs)
  })
})

//(craftMap)
router.get("/devicesensor-data", (req, res) => {
  var query =
  'SELECT m.no as no, m.SERIAL as device_name, z.LOCATION as loc,  DATE_FORMAT(m.REPLACED_DATE, "%Y-%m-%d") as replaced_date, m.MAC as mac, m.DESCRIPTION as description, z.COORD_X as x, z.COORD_Y as y '+
  'FROM  classroom as z, module as m '+
  'WHERE z.MAC_DEC = m.MAC '+
  'ORDER BY LOC';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    for(var i=0; i<result.length; i++){
      result[i].mac = DecToHex(result[i].mac);
    }
    var Rs = JSON.stringify(result);
    res.end(Rs)
  })
})




//////////////////////////////////////////////////////////////////////////
///////////////////////////////////device/////////////////////////////////
//////////////////////////////////////////////////////////////////////////


//(GET)
router.get("/device-data", (req, res) => {
  var query =
  'SELECT m.no as no, m.SERIAL as device_name, z.LOCATION as class_name,  DATE_FORMAT(m.REPLACED_DATE, "%Y-%m-%d") as replaced_date, m.MAC as mac, m.DESCRIPTION as description '+
  'FROM  classroom_new as z right outer join module as m on z.MAC = m.MAC '+
  'ORDER BY z.LOCATION ';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    for(var i=0; i<result.length; i++){
      result[i].mac = DecToHex(result[i].mac);
      if(!result[i].loc)
          result[i].loc = "-"
    }
    var Rs = JSON.stringify(result);
    res.end(Rs)
  })
})

//(POST)
router.post("/device-data", (req, res) => {
  var jsondata = req.body;
  var query =
  'SELECT m.no as no, m.SERIAL as device_name, z.LOCATION as class_name,  DATE_FORMAT(m.REPLACED_DATE, "%Y-%m-%d") as replaced_date, m.MAC as mac, m.DESCRIPTION as description '+
  'FROM  classroom_new as z right outer join module as m on z.MAC = m.MAC '+
  'WHERE m.SERIAL = "'+jsondata.d_name+'" ' +
  'ORDER BY z.LOCATION';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    for(var i=0; i<result.length; i++){
      result[i].mac = DecToHex(result[i].mac);
    }
    var Rs = JSON.stringify(result);
    res.end(Rs)
  })
})


//device_insert
router.post("/device_insert", (req, res) => {
  var jsondata = req.body;

  if(jsondata.물리주소.length != 17){
    res.end("물리주소 값이 올바르지 않습니다.");
    return
  }
  var query = "INSERT INTO module (SERIAL,MAC,REPLACED_DATE,DESCRIPTION) VALUES " +
             "(\""+jsondata.이름+"\", "+HexToDec(jsondata.물리주소)+" ,\""+jsondata.최종교체일+"\",\""+jsondata.기타+"\"); ";//+
            //"ON DUPLICATE KEY UPDATE SERIAL=VALUES(SERIAL), REPLACED_DATE=VALUES(REPLACED_DATE), DESCRIPTION=VALUES(DESCRIPTION);"
  query += "UPDATE classroom_new SET MAC = "+HexToDec(jsondata.물리주소)+" WHERE LOCATION = \""+jsondata.교실명+"\"; ";

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      if(err.code == 'ER_DUP_ENTRY'){
        res.end("이미 등록 된 디바이스가 있습니다.")
      }
      else if(err.code == 'ER_TRUNCATED_WRONG_VALUE' || err.code =='ER_BAD_FIELD_ERROR'){
        res.end("입력된 값이 올바르지 않습니다.")
      }
      else{
        res.end("error : "+err)
      }
      return
    }else{res.status(200).send('등록 완료되었습니다.');}
  })
})


//device_update
router.post("/device_update", (req, res) => {
  var jsondata = req.body;
  var query = 'UPDATE `smartschool`.`module` '+
              'SET '+
              '`SERIAL` = \"'+jsondata.이름+'\", '+
              '`REPLACED_DATE` = \"'+jsondata.최종교체일+'\", '+
              '`DESCRIPTION` = \"'+jsondata.기타+'\" '+
              'WHERE `MAC` = '+HexToDec(jsondata.물리주소)+' ';
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      if(err.code == 'ER_TRUNCATED_WRONG_VALUE' || err.code =='ER_BAD_FIELD_ERROR'){
        res.end("입력된 값이 올바르지 않습니다.")
      }
      else{
        res.end("error : "+err)
      }
      return
    }else{res.status(200).send('수정 완료되었습니다.');}
  })
})

//device_delete
router.post("/device_delete", (req, res) => {
  var jsondata = req.body;
  var query = "DELETE FROM module WHERE MAC = "+HexToDec(jsondata.d_mac)+" ;";
  query += "UPDATE classroom_new SET MAC = null WHERE LOCATION = \""+jsondata.c_name+"\"; ";
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
       if(err.code == 'ER_TRUNCATED_WRONG_VALUE' || err.code =='ER_BAD_FIELD_ERROR'){
         res.end("이미 삭제되었거나, 입력된 값이 올바르지 않습니다.")
       }
       else{
        res.end("error : "+err)
       }
      return
    }else{res.status(200).send('삭제 완료되었습니다.');}
  })
})



//////////////////////////////////////////////////////////////////////////
///////////////////////////////////class//////////////////////////////////
//////////////////////////////////////////////////////////////////////////

//class_mng-data
router.get("/class-data", (req, res) => {
// var query =
//   'SELECT c.no as no, c.LOCATION as class_name, t.NAME as teacher_name, s.cnt as student_cnt, \"유\" as sensor_in,c.SERIAL as device_id '+
//   'FROM classroom as c left outer join teacher as t on c.MAC_DEC = t.CLASSROOM_MAC, '+
//     '(SELECT student.CLASSROOM_MAC, count(*) as cnt '+
//     'FROM student '+
// //    'CROSS JOIN (SELECT @cnt := 0) as dummy '+
//     'GROUP BY student.CLASSROOM_MAC) as s '+
//   'WHERE c.MAC_DEC = s.CLASSROOM_MAC '+
//   'ORDER BY c.LOCATION ';

  var query =
    'SELECT z.no as no, z.LOCATION as class_name, t.NAME as teacher_name, sc.cnt as student_cnt, m.SERIAL as device_id '+
    'FROM  classroom_new as z '+
    'left outer join teacher as t on z.MAC = t.CLASSROOM_MAC '+
    'left outer join module as m on m.MAC = z.MAC '+
    'left outer join (SELECT st.CLASSROOM_MAC, count(*) as cnt '+
                     'FROM student as st GROUP BY st.CLASSROOM_MAC) as sc '+
                  'on z.MAC = sc.CLASSROOM_MAC '+
    'ORDER BY z.LOCATION ;';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    for(var i=0; i<result.length; i++){
      if(!result[i].SERIAL){
          result[i].SERIAL = "-"
      }
      if(!result[i].teacher_name){
          result[i].teacher_name = "-"
      }
      if(!result[i].student_cnt){
          result[i].student_cnt = 0
      }
    }
    var Rs = JSON.stringify(result);
    res.end(Rs);
  })
})

//class_name-data (GET)
router.get("/class_name-data", (req, res) => {
  var query =
  'SELECT z.no as no, m.SERIAL as device_name, z.LOCATION as loc,  DATE_FORMAT(m.REPLACED_DATE, "%Y-%m-%d") as replaced_date, m.MAC as mac, m.DESCRIPTION as description, z.COORD_X as x, COORD_Y as y '+
  'FROM  classroom as z, module as m '+
  'WHERE z.MAC = m.MAC '+
  'ORDER BY LOC';


  db.query(query, (err, result) => {
    if(err) { 
      console.error(query, err)
      res.end("error")
      return
    }
    for(var i=0; i<result.length; i++){
      result[i].mac = DecToHex(result[i].mac);
    }
    var Rs = JSON.stringify(result);
    res.end(Rs)
  })
})

//class_name-data (POST)
router.post("/class_name-data", (req, res) => {
  var jsondata = req.body;
  switch(jsondata.flag){
    case "chk" : 
       var query =
        'SELECT LOCATION '+
        'FROM  classroom_new '+
        'WHERE location = "'+jsondata.c_name+'"';
      break;
    case "delete" : 
       var query =
        'DELETE '+
        'FROM  classroom_new '+
        'WHERE loc = "'+jsondata.c_name+'";';
     //break;
    case "edit" || "add": 
       var query =
        'INSERT INTO `smartschool`.` classroom_new`';
        '(`LOCATION`) '+
        'VALUES '+
        '("'+jsondata.c_name+'");';
      break;
    default : 
       res.end("Flag-error");
      break;
  }
  
  db.query(query, (err, result) => {
    if(err) {
      res.send({ success: false, message: 'query error', error: err });
      return;
    }
    else{
      switch(jsondata.flag){
        case "chk" : 
            if(result==""){
              res.end(JSON.stringify("중복된 교실명이 없습니다. 수정 가능합니다."))
            }
            else{
              res.end(JSON.stringify("중복된 교실명이 있습니다."))
            }
          break;
        case "delete" : 
           var query =
            'DELETE '+
            'FROM  classroom_new '+
            'WHERE loc = "'+jsondata.c_name+'";';
         //break;
        case "edit" || "add": 
           var query =
            'INSERT INTO `smartschool`.` classroom_new`';
            '(`LOCATION`) '+
            'VALUES '+
            '("'+jsondata.c_name+'");';
          break;
        default : 
           res.end("Flag-error");
          break;
      }
    }
  })
})


/*
router.post("/students-data", (req, res) => {
  var jsondata = req.body;
  var query =
  'SELECT s.idx as no, s.name as student_name, \"등교\" as student_state '+
  'FROM classroom as c, student as s '+
  'WHERE c.MAC_DEC = s.CLASSROOM_MAC ';
  if(jsondata.c_name) 
    query += 'and c.LOCATION = \"'+jsondata.c_name+'\" GROUP BY s.idx';
  
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})
*/
/*
router.post("/student-data", (req, res) => {
  var jsondata = req.body;
  var query =
  'SELECT (@cnt := @cnt + 1) as no, s.name as student_name, \"등교\" as student_state '+
  'FROM classroom as c, student as s '+
  'CROSS JOIN (SELECT @cnt := 0) as dummy '+
  'WHERE c.MAC_DEC = s.CLASSROOM_MAC ';
  if(jsondata.c_name) 
    query += 'and c.LOCATION = \"'+jsondata.c_name+'\" ';
  if(jsondata.s_name) 
    query += 'and s.NAME = \"'+jsondata.s_name+'\" ';
  
  console.log(query)
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})
*/
















/***********************************************************************************************************************************************************************/







router.get("/sensor-classroom", (req, res) => {
  var data = req.query || {}
  var query =
 // 'SELECT  DATE_FORMAT(TIME, "%Y-%m-%d %H:%i:%s") AS time, MAC AS mac, DATA AS data,  TYPE AS type ' +
 // 'FROM  sensor_data_update '
 // 'where MAC = ' + mac
'SELECT classroom.NO as no, classroom.LOCATION as location, classroom.MAC_DEC as mac, sensor_data_update.TYPE as type, sensor_data_update.DATA as data , DATE_FORMAT(sensor_data_update.TIME, "%Y-%m-%d %H:%i:%s") AS time ' +
'FROM classroom JOIN sensor_data_update ' + 
'ON classroom.MAC_DEC = sensor_data_update.MAC and sensor_data_update.time>current_date() '+
'order by sensor_data_update.time desc'

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})

router.get("/classroom", (req, res) => {
  var data = req.query || {}
  var query =
 // 'SELECT  DATE_FORMAT(TIME, "%Y-%m-%d %H:%i:%s") AS time, MAC AS mac, DATA AS data,  TYPE AS type ' +
 // 'FROM  sensor_data_update '
 // 'where MAC = ' + mac

'SELECT  distinct(classroom.location) as location, student.CLASSROOM_MAC , ifnull(ble_count,0) as ble_count, teacher.name as teacher '+
'FROM( select  student.CLASSROOM_MAC, count(BLE_MAC) as ble_count '+
 'from smartschool.student GROUP BY CLASSROOM_MAC '+
 ')x join student on x.classroom_mac = student.classroom_mac '+
 'right outer join classroom on classroom.MAC_DEC = student.CLASSROOM_MAC ' +
 'left outer join teacher on classroom.MAC_DEC = teacher.CLASSROOM_MAC '+
 'order by location; '


/*'SELECT classroom.NO as no, classroom.LOCATION as location ' +
'FROM classroom '*/ 


  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})



router.get("/student_attend", (req, res) => {
  var data = req.query || {}

  var query =

'SELECT attend_check.BLE_MAC as student, DATE_FORMAT(attend_check.IN_TIME, "%Y-%m-%d")  as inTime, DATE_FORMAT(attend_check.OUT_TIME, "%Y-%m-%d") as outTime, attend_check.state, student.CLASSROOM_MAC as classroom, classroom.location, teacher.name as name '+
'FROM smartschool.attend_check join smartschool.student '+
'on attend_check.BLE_MAC = student.BLE_MAC '+
'join smartschool.classroom '+
'on student.classroom_mac = classroom.MAC_DEC '+
'join teacher on teacher.classroom_mac = classroom.mac_dec and attend_check.in_time > current_date()' +
'order by inTime desc'

/*'SELECT RAW_BLE.CLASSROOM_MAC as currents , student.classroom_mac as iden, RAW_BLE.ble_mac as student, DATE_FORMAT(RAW_BLE.time, "%Y-%m-%d %H:%i:%s") as time, classroom.no, classroom.location '+
'FROM smartschool.RAW_BLE join smartschool.student '+
//'on RAW_BLE.ble_mac = CLASS.ble_mac and RAW_BLE.time>current_date() '
'on RAW_BLE.ble_mac = student.ble_mac and RAW_BLE.time>DATE_ADD(now(), INTERVAL -3 hour) '+
'join classroom on student.CLASSROOM_MAC = classroom.mac_dec ' + 
'order by student.BLE_MAC, RAW_BLE.time desc'*/


  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})

router.get("/sensor_graph_daily", (req, res) => { // 날짜별 그래프 그리기

    var query ="SELECT loc,type,date_format(time,'%Y-%m-%d %T') as sensor_time,avge FROM smartschool.sensor_data_daily where month(time)=month(now())"


    db.query(query, (err, result) => {
        if (err) {
            console.error(query, err)
            res.end("error")
            return
        }

        res.end(JSON.stringify(result))

    })
})
//계속 추가 가능 
router.get("/sensor_graph_hourly", (req, res) => { // 시간별 그래프 그리기

    var query ="SELECT loc,type,date_format(time,'%Y-%m-%d %T') as sensor_time,avge from sensor_data_hourly where time >current_date()"


    db.query(query, (err, result) => {
        if (err) {
            console.error(query, err)
            res.end("error")
            return
        }

        res.end(JSON.stringify(result))

    })
})
router.get("/sensor_current", (req, res) => { // 시간별 그래프 그리기

    var query ="SELECT sensor_data_update.mac,sensor_data_update.type,date_format(sensor_data_update.time,'%Y-%m-%d %T') as sensor_time,sensor_data_update.data , classroom.location from sensor_data_update join classroom on classroom.MAC_DEC = sensor_data_update.MAC and time >current_date();"

    db.query(query, (err, result) => {
        if (err) {
            console.error(query, err)
            res.end("error")
            return
        }

        res.end(JSON.stringify(result))

    })
})


/*router.get("/weather", (req,res) => {
  http.get('http://www.kma.go.kr/wid/queryDFSRSS.jsp?zone=1111060000',
    function (web){
      //데이터를 읽을 때마다
      web.on('data', function(buffer){
        res.write(buffer);
      });
      //데이터를 모두 읽으면
      web.on('end', function(){
        res.end();
      })
    })
})
*/
router.get("/student_list", (req, res) => { 

    var query ="select student.name, student.ble_mac,student.classroom_mac from student,attend_check where student.ble_mac = attend_check.ble_mac group by student.ble_mac order by student.ble_mac;"


    db.query(query, (err, result) => {
        if (err) {
            console.error(query, err)
            res.end("error")
            return
        }

        res.end(JSON.stringify(result))

    })
})

router.get("/attendance_student", (req, res) => {  
  
    //var query =
        //"select ble_mac as student, date_format(min(ble_time),'%Y-%m-%d %T') as attend ,date_format(max(ble_time),'%Y-%m-%d %T') as attend2 from RAW_BLE  where ble_time > current_date() group by ble_mac"
    var query = "SELECT student.name,student.ble_mac,date_format(attend_check.IN_TIME,'%Y-%m-%d %T') as in_time,date_format(attend_check.OUT_TIME,'%Y-%m-%d %T') as out_time,student.classroom_mac,attend_check.state,date_format(attend_check.in_time,'%Y') as year,date_format(attend_check.in_time,'%m') as month,date_format(attend_check.in_time,'%e') as day  FROM student,attend_check where student.ble_mac = attend_check.ble_mac order by student.ble_mac, attend_check.in_time"
    db.query(query, (err, result) => {
        if (err) {
            console.error(query, err)
            res.end("error")
            return
        }
        result.forEach(function(row) {
            //row.student = convertMacFormatIntToHex(row.student)
            //row.last=convertMacFormatIntToHex(row.last)
        })
        res.end(JSON.stringify(result))
        //var obj, i;
    })
})

router.get("/student_info", (req, res) => { 

    var query ="select student.name ,student.ble_mac,student.classroom_mac, student.birth, student.PHONE_NUM, student.EMAIL, student.address, student.PARENT_NAME, student.PARENT_PHONE from student,attend_check where student.ble_mac = attend_check.ble_mac group by student.ble_mac order by student.ble_mac"


    db.query(query, (err, result) => {
        if (err) {
            console.error(query, err)
            res.end("error")
            return
        }

        res.end(JSON.stringify(result))

    })
})


module.exports = router

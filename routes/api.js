var router = express.Router()

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
  var query =
//  'SELECT (@cnt := @cnt + 1) as NO, LOCATION as LOC, SERIAL, DATE_FORMAT(REPLACED_DATE, "%Y-%m-%d") AS TIME, MAC_HEX as MAC, DESCRIPTION, COORD_X as x, COORD_Y as y '+
  'SELECT classroom.no as NO, LOCATION as LOC, SERIAL, DATE_FORMAT(REPLACED_DATE, "%Y-%m-%d") AS TIME, MAC_HEX as MAC, DESCRIPTION, COORD_X as x, COORD_Y as y '+
  'FROM classroom '+
//  'CROSS JOIN (SELECT @cnt := 0) AS dummy '+
  'ORDER BY LOC';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})

router.get("/class_mng-data", (req, res) => {
  var query =
  'SELECT c.no as no, c.LOCATION as class_name, t.NAME as teacher_name, s.cnt as student_cnt, \"유\" as sensor_in,c.SERIAL as device_id '+
  'FROM classroom as c left outer join teacher as t on c.MAC_DEC = t.CLASSROOM_MAC, '+
    '(SELECT student.CLASSROOM_MAC, count(*) as cnt '+
    'FROM student '+
//    'CROSS JOIN (SELECT @cnt := 0) as dummy '+
    'GROUP BY student.CLASSROOM_MAC) as s '+
  'WHERE c.MAC_DEC = s.CLASSROOM_MAC '+
  'ORDER BY c.LOCATION ';

  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
  })
})

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

function HexToDec(Hex){
  var tempArr, temp, Dec;
  tempArr = Hex.split("-");
  tempArr.reverse();
  temp = tempArr.toString();
  temp = temp.replace(/,/g,"");
  Dec = parseInt(temp, 16);
  return Dec;
}

router.post("/class-data-update", (req, res) => {
  var jsondata = req.body;
  
  var query = "DELETE FROM classroom; INSERT INTO classroom (NO,LOCATION,SERIAL,MAC_DEC,MAC_HEX,COORD_X,COORD_Y,REPLACED_DATE,DESCRIPTION) VALUES " ;
  var values = "";
  for(var i=0; i< jsondata.length; i++){
    values += "("+jsondata[i].번호+",\""+jsondata[i].위치+"\",\""+jsondata[i].이름+"\","+HexToDec(jsondata[i].물리주소)+","+
                "\""+jsondata[i].물리주소+"\","+jsondata[i].X+","+jsondata[i].Y+",\""+jsondata[i].교체일+"\",\""+jsondata[i].설명+"\"),";
  }
  values = values.slice(0,-1);
  values += "ON DUPLICATE KEY UPDATE LOCATION=VALUES(LOCATION),COORD_X=VALUES(COORD_X),COORD_Y=VALUES(COORD_Y),REPLACED_DATE=VALUES(REPLACED_DATE),DESCRIPTION=VALUES(DESCRIPTION);"
  
  query += values;
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error : "+err)
      return
    }else{res.status(200).send('Complete!');}
  })
})

module.exports = router

var router = express.Router()

router.get("/dashboard-data", (req, res) => {
  var query =
  'SELECT INFO AS type, round(avg(DATA)) as data '+
  'FROM sensor_data_update '+
  'join sensor on sensor.TYPE = sensor_data_update.TYPE '+
  'group by TYPE '+
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

router.get("/sensor_daily-data", (req, res) => {
  var query =
  'SELECT type, time, avge, loc '+
  'from sensor_data_daily order by type, time;';//hourly order by type, time;';//

/*
  'SELECT loc, time, type, avge ' +
  'from sensor_data_daily order by time';
*/
  db.query(query, (err, result) => {
    if(err) {
      console.error(query, err)
      res.end("error")
      return
    }
    res.end(JSON.stringify(result))
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
  'SELECT NO, LOCATION as LOC, SERIAL, DATE_FORMAT(REPLACED_DATE, "%Y-%m-%d") AS TIME, MAC_HEX as MAC, DESCRIPTION, COORD_X as x, COORD_Y as y '+
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

function HexToDec(Hex){
  var tempArr = Hex.split("-");
  tempArr.reverse();
  var temp = tempArr.toString();
  temp = temp.replace(/,/g,"");
  var Dec = parseInt(temp, 16);
  return Dec;
}

router.post("/class-data-update", (req, res) => {
  var jsondata = req.body;
  var values = "";
  for(var i=0; i< jsondata.length; i++){
    values += "("+jsondata[i].번호+",\""+jsondata[i].위치+"\",\""+jsondata[i].이름+"\","+HexToDec(jsondata[i].물리주소)+","+
                "\""+jsondata[i].물리주소+"\","+jsondata[i].X+","+jsondata[i].Y+",\""+jsondata[i].교체일+"\",\""+jsondata[i].설명+"\"),";
  }
  values = values.slice(0,-1);
  values += "ON DUPLICATE KEY UPDATE LOCATION=VALUES(LOCATION),COORD_X=VALUES(COORD_X),COORD_Y=VALUES(COORD_Y),REPLACED_DATE=VALUES(REPLACED_DATE),DESCRIPTION=VALUES(DESCRIPTION);"
  
  var query = "DELETE FROM classroom; INSERT INTO classroom (NO,LOCATION,SERIAL,MAC_DEC,MAC_HEX,COORD_X,COORD_Y,REPLACED_DATE,DESCRIPTION) VALUES " ;
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

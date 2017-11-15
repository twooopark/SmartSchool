var router = express.Router()

router.get("/dashboard-data", (req, res) => {
  var query =
  'SELECT INFO AS TYPE, round(avg(DATA)) '+
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
  'SELECT loc, time, type, avge ' +
  'from sensor_data_daily order by time';

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

router.post("/class-data-update", (req, res) => {
  var jsondata = req.body;
  var values = "";
  for(var i=0; i< jsondata.length; i++){
    values += "("+jsondata[i].No+",\""+jsondata[i].Location+"\",\""+jsondata[i].Serial+"\","+jsondata[i].MAC_DEC+",\""+jsondata[i].MAC_HEX+"\","+jsondata[i].X+","+jsondata[i].Y+"),";
  }
  values = values.slice(0,-1);
  values += "ON DUPLICATE KEY UPDATE location=VALUES(location),COORD_X=VALUES(coord_x),coord_y=VALUES(coord_y);"
  
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

module.exports = router

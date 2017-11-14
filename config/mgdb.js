/****************** MongoDB ****************/
var mongoose = require('mongoose'),
     Schema = mongoose.Schema;

module.exports = function() {
  var db = mongoose.connect('mongodb://localhost/smartschool'); 
  var RawSchema = new Schema({//mongoose 의 Schema 생성자를 통해서 RawSchema 객체를 정의
    loc : String,
    mac : String,//Date, --> 2017-11-01T05:15:05.000Z
    type : Number,
    data : Number,
    time : Number
  }, { collection: 'sensor_error' });
  mongoose.model('Raw', RawSchema);//Raw 모델을 정의하기 위해 RawSchema 를 이용
  return db;//db 를 연결한 객체를 리턴 시킨다.
}//출처: http://alexband.tistory.com/20 [Front-end Rider]


// const mongoose = require('mongoose');
// module.exports = () => {
//   function connect() {
//     mongoose.connect('192.168.162.136:27017', function(err) {
//       if (err) {
//         console.error('mongodb connection error', err);
//       }
//       console.log('mongodb connected');
//     });
//   }
//   connect();
//   mongoose.connection.on('disconnected', connect);
//   require('./user.js'); // user.js는 나중에 만듭니다.
// };
var router = express.Router()//express 객체중에서 routing하는 능력이 있는 객체를 추출해낸다.


router.get("/", (req, res) => {//만약 get 방식이며 "/"로 시작한다면 여기서 처리를 한다.
  //res는 client에게 돌려주는 변수이며 
  // render는 view에 준비한 화면을 뿌려주는 역활을 한다.
  //출처: http://posnopi13.tistory.com/12 [다산에서의 하루]
  res.render("index").end();//view 폴더에 있는 index 파일을 뿌려준다는 의미
})

router.get("/page/:name", (req, res) => {
  var p_name = req.params.name
  try {
    res.render(p_name)
  } catch(e) {
    res.status(403)
  }
  res.end()
})






module.exports = router

var router = express.Router()

router.get("/", (req, res) => {
  res.render("index").end();
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

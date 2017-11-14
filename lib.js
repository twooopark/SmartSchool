global.commit = (targ_obj, obj) => {
  Object.keys(obj).forEach(name => {
    targ_obj[name] = obj[name]
  })
}

commit(global, {
  iter_split(str, len_arr) {
    let idx = 0
    var rt_arr = []
    len_arr.forEach(sub_len => {
      rt_arr.push(str.substr(idx, sub_len))
      idx += sub_len
    })
    return rt_arr
  },
})

import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const Home = { template: '<div>Home</div>' }
const Foo = () =>
  new Promise(resolve => {
    setTimeout(() =>
      resolve({
        template: `<div class="foo">This is Foo</div>`
      })
      , 10)
  })

debugger
const router = new VueRouter({
  mode: 'history',
  base: __dirname,
  routes: [
    { path: '/', component: Home },
    // Just use them normally in the route config
    { path: '/async', component: Foo }
  ]
})

// 这个有什么作用: 重新跳转路由
router.onReady(() => {
  router.push('/async')
})

document.getElementById('load-button').addEventListener('click', (event) => {
  new Vue({
    router,
    template: `
    <div id="app">
      <h1>Async</h1>
      <router-view class="view"></router-view>
    </div>
  `
  }).$mount('#app')
  event.target.remove()
})

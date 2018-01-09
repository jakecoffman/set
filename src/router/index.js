import Vue from 'vue'
import Router from 'vue-router'
import SetGame from '@/components/SetGame'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'main',
      component: SetGame
    },
    {
      path: '/:id',
      name: 'game',
      component: SetGame
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    return { x: 0, y: 0 }
  }
})

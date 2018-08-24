import Vue from 'vue'
import Router from 'vue-router'
import SetGame from '@/components/SetGame'
import SetHelp from '@/components/SetHelp'

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
    },
    {
      path: '/:id/help',
      name: 'help',
      component: SetHelp
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    return { x: 0, y: 0 }
  }
})

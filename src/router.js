import Vue from 'vue'
import Router from 'vue-router'
import SetGame from './views/SetGame'
import SetHelp from './views/SetHelp'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
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
  scrollBehavior() {
    return { x: 0, y: 0 }
  }
})

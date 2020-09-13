import { Router } from 'express'
import ctrl from './Controller'
/**
 * @param {Router} router
 */
export default (router) => {
  router.post('/talks', ctrl.ordenation)
}

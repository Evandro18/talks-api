import { Router } from 'express'
import ctrl from './Controller'
/**
 * @param {Router} router
 */
export default (router) => {
  router.get('/health', ctrl.check)
}

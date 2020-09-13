import { Router } from 'express'

import HealthCheck from './HealthCheck/route'
import Talks from './Talks/route'

const router = new Router()
HealthCheck(router)
Talks(router)

export default router

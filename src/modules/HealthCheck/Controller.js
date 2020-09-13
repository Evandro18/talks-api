import { Response, Request } from 'express'
import httpStatus from 'http-status'

/**
 * @class HealthCheckController
 */
class HealthCheckController {
  /**
   * @param {Request} req
   * @param {Response} res
   */
  check(req, res) {
    res.status(httpStatus.Ok).json({
      message: 'Service running',
      success: true,
    })
  }
}

export default new HealthCheckController()

import httpStatus from 'http-status';

class HealthCheckController {
  check(req, res) {
    res.status(httpStatus.Ok).json({ message: 'Service running', success: true })
  }

}

export const healthController = new HealthCheckController()
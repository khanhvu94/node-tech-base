const jwt = require('jsonwebtoken')
const { StatusCodes } = require('http-status-codes')

const userService = require('../services/user')
const messageCode = require('../common/message-code')

const config = require('config')
const accessToken = config.get('accessToken')
const accessTokenSecret = accessToken.accessTokenSecret
const refreshTokenSecret = accessToken.refreshTokenSecret
let refreshTokens = []

const login = (req, res) => {
  const { username, password } = req.body
  userService.getUserByAccount(username, password)
    .then((user) => {
      const response = {}
      if (user) {
        response.accessToken = jwt.sign({ userName: user.userName, userId: user.userId }, accessTokenSecret, { expiresIn: '30m' })
        response.refreshToken = jwt.sign({ userName: user.userName, userId: user.userId }, refreshTokenSecret)
        response.userName = user.userName
        refreshTokens.push(response.refreshToken)

        res.send(response)
      } else {
        res.status(StatusCodes.UNAUTHORIZED).send(messageCode.responseMessage(messageCode.E004))
      }
    })
    .catch((error) => {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error)
    })
}

const refreshToken = (req, res) => {
  const { refreshToken } = req.body

  console.log(refreshToken)
  if (!refreshToken) {
    return res.sendStatus(StatusCodes.UNAUTHORIZED)
  }

  const token = refreshToken

  if (!token) {
    return res.sendStatus(StatusCodes.FORBIDDEN)
  }

  jwt.verify(token, refreshTokenSecret, (err, user) => {
    if (err) {
      return res.sendStatus(StatusCodes.FORBIDDEN)
    }

    const accessToken = jwt.sign({ userName: user.userName, userId: user.userId }, accessTokenSecret, { expiresIn: '20m' })

    res.json({
      accessToken
    })
  })
}

const logout = (req, res) => {
  const authHeader = req.headers.authorization
  refreshTokens = refreshTokens.filter(t => t.accessToken !== authHeader)

  res.send(messageCode.responseMessage(messageCode.I001))
}

module.exports = {
  login,
  refreshToken,
  logout
}

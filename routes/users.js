const express = require('express');
const router = express.Router();

const { User, Games } = require('../models/index');
const sequilize = require('../db.connection');
const resp = require('../resp');

// router.post('/signup', async function (req, res) {
//   try {
//     const body = req.body;
//     const user = await User.create(body);
//     console.log(user);
//     return resp.success(res, user);

//   } catch (err) {
//     console.error(err);
//     return resp.error(res, 'Error creating user', err.parent?.sqlMessage);
//   }
// });

router.post('/login', async function (req, res) {

  /**
   * 
   * user = find by device id
   * 
   * if !user then send SIGNUP key
   * if user == blocked
   * then send response with BLOCKED status
   * 
   * if !user.discordName
   * then respond SIGNUP
   * 
   * send user in response
   * 
   **/
  try {

    const body = req.body;
    const { deviceId, lastLoginIp } = body;

    if (!deviceId || !lastLoginIp)
      return resp.error(res, 'Provide device id and login ip');

    const include = [{ model: Games }];

    var user = await User.findOne({ where: { deviceId } });

    if (!user)
      return resp.success(res, { api_status: 'SIGNUP' });

    if (user.status == 'BLOCKED')
      return resp.success(res, { api_status: 'BLOCKED' });

    if (!user.discordName)
      return resp.success(res, { api_status: 'LOGIN' });

    await User.update({ lastLogin: new Date(), lastLoginIp }, { where: { id: user.id } });

    return resp.success(res, { api_status: 'LOGIN', user });

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error finding user', err.message);
  }
});

router.post('/login/guest', async function (req, res) {

  /**
   * 
   * input = loginIp, deviceId
   * 
   * if !user
   * add new user with fields (NickName, signup Date, mobile device ID, sign-up IP address, Balance 0, Account Status (Active))
   * Response: LOGIN, userId, nickName
   * 
   * 
   * if user exists with device id
   * update Last Login IP, Last Login Date
   * Response: LOGIN, userId, nickName 
   * 
   * if user == BLOCKEDt Login Date
   * Response: LOGIN, userId, nickName 
   * 
   * if user == BLOCKED
   * respond with BLOCKED status
   * 
   * respond with BLOCKED status
   * 
   * 
   * 
   **/

  try {

    const body = req.body;
    const { deviceId, nickName, lastLoginIp } = body;
    if (!deviceId || !nickName || !lastLoginIp)
      return resp.error(res, 'Provide nick name, last login ip and device id');

    const include = [{ model: Games }];
    const user = await User.findOne({ where: { deviceId } });

    if (user && user.status == 'BLOCKED')
      return resp.success(res, { api_status: 'BLOCKED' });

    if (user && user.status == 'ACTIVE')
      await User.update({ lastLogin: new Date, lastLoginIp }, { where: { id: user.id } });

    if (!user) {
      let date = new Date();
      body.signupDate = date
      body.lastLogin = date
      body.signupIpAddr = lastLoginIp;

      delete body.discordId;
      delete body.discordName;
      await User.create(body);
    }

    const newuser = await User.findOne({ where: { deviceId: body.deviceId } });

    return resp.success(res, { api_status: 'LOGIN', user: newuser });

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error finding user', err.message);
  }
});

router.post('/login/discord', async function (req, res) {
  /**
   * 
   * input = loginIp, deviceId, discordName
   * 
   * find user with deviceId
   * if !user
   * then find with discordName 
   * 
   * if !user
   * add new user with fields (NickName, signup Date, mobile device ID, sign-up IP address, Balance 0, Account Status (Active))
   * Response: LOGIN, userId, nickName
   * 
   * 
   * if user exists with device id
   * update Last Login IP, Last Login Date
   * Response: LOGIN, userId, nickName 
   * 
   * if user == BLOCKEDt Login Date
   * Response: LOGIN, userId, nickName 
   * 
   * if user == BLOCKED
   * respond with BLOCKED status
   * 
   * respond with BLOCKED status
   * 
   * 
   * 
   **/

  try {

    const body = req.body;
    const { deviceId, discordName, signupIpAddr, lastLoginIp } = body;
    if (!deviceId || !signupIpAddr)
      return resp.error(res, 'Provide device id and signup ip address');

    const include = [{ model: Games }];
    const user = await User.findOne({ where: { deviceId } });


    if (user && user.status == 'BLOCKED')
      return resp.success(res, { api_status: 'BLOCKED' });

    if (user && user.status == 'ACTIVE')
      await User.update({ lastLogin: new Date }, { where: { id: user.id } });

    if (!user) {
      const discordUser = await User.findOne({ where: { discordName } });

      if (!discordUser) {
        // body.discordMember ;
        body.signupDate = new Date();
        body.lastLogin = new Date();
        body.lastLoginIp = signupIpAddr;

        await User.create(body);
        const newuser = await User.findOne({ where: { deviceId } });
        return resp.success(res, { api_status: 'LOGIN', user: newuser });

      } else {

        await User.update({ lastLogin: new Date(), lastLoginIp }, { where: { deviceId } });
        return resp.success(res, { api_status: 'LOGIN', user });

      }
    }

    await User.update({ lastLogin: new Date(), lastLoginIp }, { where: { id: user.id } });
    return resp.success(res, { api_status: 'LOGIN', user });


  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error finding user', err.message);
  }
});


router.get('/balance', async function (req, res) {
  const userId = req.query.userId;
  if (!userId)
    return resp.error(res, 'Provide user id');

  const user = await User.findOne({ where: { id: userId } });
  if (!user)
    return resp.error(res, 'User not found with this device id');

  return resp.success(res, { balance: user.balance });
});

// reward
router.post('/game', async function (req, res) {
  try {
    const body = req.body;
    if (!body.userId)
      return resp.error(res, 'Provide userId');

    const totalReward = body.totalReward;
    const game = await Games.create(body);

    await User.increment('balance', { by: totalReward, where: { id: body.userId } });
    const user = await User.findOne({ where: { id: body.userId } });

    return resp.success(res, { game, balance: user.balance });

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error creating game', err.message);
  }
});

router.get('/rewards', async function (req, res) {
  try {
    const body = req.body;
    const { userId } = body;
    if (!userId)
      return resp.error(res, 'Provide userId');

    const rewards = await Games.find({ where: { userId } });

    return resp.success(res, rewards);

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error creating reward', err.message);
  }
});

router.get('/leaderboard', async function (req, res) {
  try {
    const body = req.query;

    const { period, userId } = body;
    if (!period || !['DAILY', 'WEEKLY', 'MONTHLY', 'OVERALL'].includes(period))
      return resp.error(res, 'Provide valid period');

    // const WEEKLY = `SELECT * FROM games LEFT OUTER JOIN user AS user ON games.userId = user.id WHERE games.createdAt >= DATE(NOW()) - INTERVAL 7 DAY`;
    const DAILY = `SELECT  userId FROM games WHERE DATE(games.createdAt) = DATE(NOW()) LIMIT 20;`;
    const WEEKLY = `SELECT userId FROM games WHERE games.createdAt >= DATE(NOW()) - INTERVAL 7 DAY LIMIT 20;`;
    const MONTHLY = `SELECT  userId FROM games WHERE games.createdAt >= DATE(NOW()) - INTERVAL 30 DAY LIMIT 20;`;
    const OVERALL = `SELECT userId  FROM games  LIMIT 20;`;

    let query = null;

    switch (period) {
      case 'DAILY':
        query = DAILY;
        break;

      case 'WEEKLY':
        query = WEEKLY;
        break;

      case 'MONTHLY':
        query = MONTHLY;
        break;

      case 'OVERALL':
        query = OVERALL;
        break;

      default:
        break;
    }

    const data = await sequilize.query(query);
    const games = data[0];

    if (!games.length) return resp.success(res, { period, myRank: 0, myPoints: 0, top20: games });

    let userIds = []
    let result = [];


    games.map(game => userIds.push(game.userId));

    userIds = [... new Set(userIds)];

    let period_query = '';
    if (period == 'DAILY') period_query = `DAY(games.createdAt) = DAY(NOW())`;
    else if (period == 'WEEKLY') period_query = `WEEKOFYEAR(games.createdAt) = WEEKOFYEAR(NOW())`;
    else if (period == 'MONTHLY') period_query = `MONTH(games.createdAt) = MONTH(NOW())`;
    else if (period == 'OVERALL') period_query = `1`;

    for (let userId of userIds) {
      const query = `
      SELECT games.userId, games.createdAt, user.nickName, 
      SUM(games.totalReward) AS totalPoints, user.nickName as nickName
      FROM games  
      LEFT JOIN user ON games.userId = user.id 
      WHERE userId = ${userId} AND status != 'BLOCKED'
      AND ${period_query};`;

      let data = await sequilize.query(query);
      if (data[0].length) result.push(data[0][0])
    }

    result = result.filter(rs => rs.userId !== null);
    let myRank = result.filter(rs => rs.userId == userId);

    result = result.sort((a, b) => +b.totalPoints - +a.totalPoints);

    for (const index in result) {
      delete result[index].userId
      result[index].rank = +index + 1
    }

    const myPoints = myRank.length > 0 ? myRank[0].totalPoints : 0;
    if (myRank.length) myRank = myRank[0].rank;


    // for(const game of data[0]) {
    //   const user = await User.findOne({ id: game.userId });
    //   game.user = user;
    // }

    const response = { period, myRank, myPoints, top20: result }

    return resp.success(res, response);

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error creating reward', err.message);
  }
});

module.exports = router;

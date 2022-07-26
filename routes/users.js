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
   * 
   * 
   * 
   **/
  try {
    
    const body = req.body;
    const { deviceId, lastLoginIp } = body;

    if (!deviceId)
      return resp.error(res, 'Provide device id and login ip');

    const include = [{ model: Games }];

    var user = await User.findOne({ where: { deviceId }, include });

    if (!user)
      return resp.success(res, { status: 'SIGNUP' });

    if (user.status == 'BLOCKED')
      return resp.success(res, { status: 'BLOCKED' });

    if (!user.discordName)
      return resp.success(res, { status: 'LOGIN' });

    await User.update({ lastLogin: new Date(), lastLoginIp }, { where: { id: user.id } });

    return resp.success(res, user);

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error finding user', err.message);
  }
});

router.post('/login/guest', async function (req, res) {
  try {
    const body = req.body;
    const { deviceId, nickName } = body;
    if (!deviceId || !nickName)
      return resp.error(res, 'Provide nick name and device id');

    var user = null;
    const include = [{ model: Games }];
    user = await User.findOne({ where: { deviceId }, include });

    if (!user) {
      body.discordMember = 'No';
      body.lastLogin = new Date();
      user = await User.create(body);
    }
    else if (user.status == 'BLOCKED')
      return resp.error(res, 'User is blocked');
    else {
      await User.update({ lastLogin: new Date }, { where: { deviceId } });
      user = await User.findOne({ where: { deviceId }, include });
    }

    return resp.success(res, user);

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error finding user', err.message);
  }
});

// reward
router.post('/reward', async function (req, res) {
  try {
    const body = req.body;
    if (!body.userId)
      return resp.error(res, 'Provide userId');

    const totalReward = body.totalReward;
    const game = await Games.create(body);
    await User.increment('balance', { by: totalReward, where: { id: body.userId } });

    return resp.success(res, game);

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
    const body = req.body;
    const { period } = body;
    if (!period || !['DAILY', 'WEEKLY', 'MONTHLY', 'OVERALL'].includes(period))
      return resp.error(res, 'Provide valid period');

    // const WEEKLY = `SELECT * FROM games LEFT OUTER JOIN user AS user ON games.userId = user.id WHERE games.createdAt >= DATE(NOW()) - INTERVAL 7 DAY`;
    const WEEKLY = `SELECT * FROM user WHERE user.createdAt >= DATE(NOW()) - INTERVAL 7 DAY ORDER BY balance DESC LIMIT 20`;
    const MONTHLY = `SELECT * FROM user WHERE user.createdAt >= DATE(NOW()) - INTERVAL 30 DAY ORDER BY balance DESC LIMIT 20`;
    const DAILY = `SELECT * FROM user WHERE DATE(user.createdAt) = DATE(NOW()) ORDER BY balance DESC LIMIT 20`;
    const OVERALL = `SELECT * FROM user ORDER BY balance DESC LIMIT 20`;

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

    // for(const game of data[0]) {
    //   const user = await User.findOne({ id: game.userId });
    //   game.user = user;
    // }


    return resp.success(res, data[0]);

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error creating reward', err.message);
  }
});

module.exports = router;

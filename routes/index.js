const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();

const { User, Games } = require('../models/index');
const sequilize = require('../db.connection');
const USERNAME = 'admin';
const PASSWORD = 'comp';
const ID = 1122;

router.get('/', (req, res, next) => res.render('index', { title: 'Express', id: null }));


router.get('/newUsers', async (req, res) => res.render('newUsers', { title: 'Express', users: [] }));
router.get('/login', async (req, res) => res.render('login', { title: 'Express', users: [] }));

router.post('/login', async (req, res) => {
  if (req.body.username !== USERNAME || req.body.password !== PASSWORD) return res.status(403).render('login');
  return res.status(200).render('index', { id: ID });
});

router.post('/newUsers', async (req, res) => {
  const { startDate, endDate } = req.body;
  if (!startDate) return res.render('newUsers', { title: 'Express', users: [] });

  const query = `SELECT * FROM user WHERE Date(createdAt) >= '${startDate}' AND Date(createdAt) <= '${endDate}';`;
  const users = await sequilize.query(query);
  return res.render('newUsers', { title: 'Express', users: users[0], id: ID });

});

const getDays = (startDate, endDate) => {
  const ms = new Date(endDate) - new Date(startDate);
  const days = ms / (1000 * 60 * 60 * 24);
  return days;
}

/**
 * Games Summary
 */

router.get('/gamesSummary', async (req, res) => res.render('gamesSummary', { title: 'Express', data: [], id: ID }));

router.post('/gamesSummary', async (req, res) => {

  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) return res.render('gamesSummary', { title: 'Express', data: [] });


  const query = `SELECT userId FROM games WHERE Date(createdAt) >= '${startDate}' AND Date(createdAt) <= '${endDate}';`;
  const result = await sequilize.query(query);

  const userIds = result[0].map(user => user.userId);

  const where = {
    'id': {
      [Op.in]: userIds
    }
  }

  const include = [{ model: Games }];
  const data = await User.findAll({ where, include });


  const days = getDays(startDate, endDate);

  data.map(d => d = d.toJSON());

  for (const user of data) {
    const games = user.games;

    user['totalSessions'] = games.length;
    user['singleSessions'] = games.filter(game => game.mode == 'SINGLE').length;
    user['missionsSessions'] = games.filter(game => game.mode == 'MISSIONS').length;
    user['multiSessions'] = games.filter(game => game.mode == 'MULTI').length;
    user['tournamentSessions'] = games.filter(game => game.mode == 'TOURNAMENT').length;

    user['wins'] = games.filter(game => game.result == 'WIN').length;
    user['lose'] = games.filter(game => game.result == 'LOSE').length;

    user['winsPercent'] = (user['wins'] / user['totalSessions']) * 100;
    user['avgDailySessions'] = ((user['totalSessions'] / days) * 100).toFixed();

    let totalPoints = 0;

    games.forEach(game => totalPoints += game.totalReward);

    user['totalPoints'] = totalPoints;

    user['pointsPerSession'] = (totalPoints / user['totalSessions']).toFixed();
    user['avgDailyPoint'] = (totalPoints / days).toFixed();
  }
  // data.map(user => {

  // });


  return res.render('gamesSummary', { title: 'Express', data, id: ID });

});

/**
 * Games APIs
 */
router.get('/games', async (req, res) => res.render('games', { title: 'Express', games: [], id: ID }));

router.post('/games', async function (req, res) {
  try {
    const { startDate, endDate, nickName } = req.body;
    const user = await User.findOne({ where: { nickName } });
    if (!user) return res.render('games', { title: 'Games', games: [], id: ID })
    // const games = await Games.findAll({ where: { userId: user.id } });
    const query = `SELECT * FROM games WHERE userId = ${user.id} AND Date(createdAt) >= '${startDate}' AND Date(createdAt) <= '${endDate}';`;
    const games = await sequilize.query(query);
    return res.render('games', { title: 'Games', games: games[0], id: ID });
  } catch (err) {
    console.error(err);
    return
  }
});



/**
 * Profile APIs
 */
router.get('/profile', (req, res) => res.render('profile', { title: 'Express', users: [], id: ID }));

router.post('/profile', async function (req, res, next) {

  const nickName = req.body.nickName;

  // const include = [{ model: Games }]
  const users = await User.findAll({ where: { nickName } });

  return res.render('profile', { title: 'Express', users, id: ID });

});

router.put('/profile', async function (req, res, next) {
  if (req.body.discordMember)
    req.body.lastDiscordStatusChangedDate = new Date();
  else if (req.body.status)
    req.body.lastStatusChangedDate = new Date();



  const { userId, ...rest } = req.body;

  await User.update({ ...rest }, { where: { id: userId } });

  const users = await User.findAll({ where: { id: userId } });

  return res.render('profile', { title: 'Express', users, id: ID });

});

router.get('/updateUser', (req, res) => res.render('updateUser', { title: 'Update User Data', user: {}, id: ID }));

router.post('/updateUser', async (req, res) => {
  const key = req.body.key;
  const where = {
    [Op.or]: [
      {
        id: {
          [Op.eq]: key
        },
      },
      {
        nickName: {
          [Op.eq]: key
        }
      }
    ]
  }
  const user = await User.findOne({ where });
  return res.render('updateUser', { user: user || {}, id: ID });
  console.log(user)
});

module.exports = router;

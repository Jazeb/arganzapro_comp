const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();

const { User, Games } = require('../models/index');
const sequilize = require('../db.connection');

router.get('/', (req, res, next) => res.render('index', { title: 'Express' }));


/**
 * New users summary
 */
router.get('/newUsers', async (req, res) => res.render('newUsers', { title: 'Express', users: [] }));

router.post('/newUsers', async (req, res) => {
  const { startDate, endDate } = req.body;
  if (!startDate) return res.render('newUsers', { title: 'Express', users: [] });

  const query = `SELECT * FROM user WHERE Date(createdAt) >= '${startDate}' AND Date(createdAt) <= '${endDate}';`;
  const users = await sequilize.query(query);
  return res.render('newUsers', { title: 'Express', users: users[0] });

});

const getDays = (startDate, endDate) => {
  const ms = new Date(endDate) - new Date(startDate);
  const days = ms / (1000 * 60 * 60 * 24);
  return days;
}

/**
 * Games Summary
 */

router.get('/gamesSummary', async (req, res) => res.render('gamesSummary', { title: 'Express', data: [] }));

router.post('/gamesSummary', async (req, res) => {

  const { startDate, endDate } = req.body;
  if (!startDate) return res.render('gamesSummary', { title: 'Express', summary: [] });

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
  data.map(user => {
    const games = user.games;

    user['totalSessions'] = games.length;
    user['singleSessions'] = games.filter(game => game.mode == 'Single').length;
    user['missionsSessions'] = games.filter(game => game.mode == 'Missions').length;
    user['multiSessions'] = games.filter(game => game.mode == 'Multi').length;
    user['tournamentSessions'] = games.filter(game => game.mode == 'Tournament').length;

    user['wins'] = games.filter(game => game.result == 'Win').length;
    user['lose'] = games.filter(game => game.result == 'Lose').length;

    user['winsPercent'] = (user['wins'] / user['totalSessions']) * 100;
    user['avgDailySessions'] = ((user['totalSessions'] / days) * 100).toFixed();

    let totalPoints = 0;

    games.forEach(game => totalPoints += game.totalReward);

    user['totalPoints'] = totalPoints;

    user['pointsPerSession'] = totalPoints / user['totalSessions'];
    user['avgDailyPoint'] = (totalPoints / days).toFixed();
  });

  return res.render('gamesSummary', { title: 'Express', data });

});

/**
 * Games APIs
 */
router.get('/games', async (req, res) => res.render('games', { title: 'Express', games: [] }));

router.post('/games', async function (req, res) {
  console.log(req.body)
  const nickName = req.body.nickName;
  const user = await User.findOne({ where: { nickName } });
  if(!user) return res.render('games', { title: 'Games', games:[]})
  const games = await Games.findAll({ where: { userId: user.id } });
  return res.render('games', { title: 'Games', games });
});



/**
 * Profile APIs
 */
router.get('/profile', (req, res) => res.render('profile', { title: 'Express', users: [] }));

router.post('/profile', async function (req, res, next) {

  const nickName = req.body.nickName;

  // const include = [{ model: Games }]
  const users = await User.findAll({ where: { nickName } });

  return res.render('profile', { title: 'Express', users });

});

router.put('/profile', async function (req, res, next) {

  const { userId, ...rest } = req.body;

  await User.update({ ...rest }, { where: { id: userId } });

  const users = await User.findAll({ where: { id: userId } });

  return res.render('profile', { title: 'Express', users });

});

router.get('/updateUser', (req, res) => res.render('updateUser', { title: 'Update User Data', user: {} }));

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
  return res.render('updateUser', { user });
  console.log(user)
});

module.exports = router;

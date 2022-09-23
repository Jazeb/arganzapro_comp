const express = require('express');
const moment = require('moment');
const _ = require('lodash');
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

// const ms = new Date(endDate) - new Date(startDate);
// const days = ms / (1000 * 60 * 60 * 24);
// return days;

// const getDays = (startDate, endDate) => parseInt((endDate - startDate) / (1000 * 60 * 60 * 24), 10); 

const getDays = (endDate, signupDate) => {
  const noOfDays = moment(endDate).diff(signupDate, 'days') + 1
  console.log({ endDate, signupDate, noOfDays })
  return noOfDays;
}

/**
 * Games Summary
 */

router.get('/gamesSummary', async (req, res) => res.render('gamesSummary', { title: 'Express', games: [], id: ID }));

router.post('/gamesSummary', async (req, res) => {

  const { startDate, endDate } = req.body;
  if (!startDate || !endDate) return res.render('gamesSummary', { title: 'Express', data: [] });


  // const query = `SELECT userId FROM games WHERE Date(createdAt) >= '${startDate}' AND Date(createdAt) <= '${endDate}';`;
  // const result = await sequilize.query(query);

  // const userIds = result[0].map(user => user.userId);
  let eDate = moment(endDate).add(23, 'hours').utc().format();
  console.log({ eDate });

  const where = {
    [Op.and]: {
      'createdAt': {
        [Op.gte]: startDate,
        [Op.lte]: eDate
      }
    }
  }

  const include = [{ model: User }];
  const games = await Games.findAll({ where, include });

  // const days = getDays(startDate, endDate);

  // games.map(d => d = d.toJSON());

  // End Date - Sign Date + 1 Day



  for (const game of games) {
    const user = game.user;
    const userGames = games.filter(game => game.userId == user.id);


    let totalPoints = 0;

    const noOfDays = getDays(endDate, user.createdAt);
    console.log({ noOfDays });

    const totalSessions = userGames.length;

    game['totalSessions'] = totalSessions;
    game['singleSessions'] = userGames.filter(game => game.mode == 'SINGLE').length;
    game['missionsSessions'] = userGames.filter(game => game.mode == 'MISSION').length;
    game['multiSessions'] = userGames.filter(game => game.mode == 'MULTI').length;
    game['tournamentSessions'] = userGames.filter(game => game.mode == 'TOURNAMENT').length;

    game['wins'] = userGames.filter(game => game.result == 'Win').length;
    game['lose'] = userGames.filter(game => game.result == 'Lose').length;

    game['winsPercent'] = ((game['wins'] / totalSessions) * 100).toFixed(3);
    game['avgDailySessions'] = (totalSessions / noOfDays).toFixed(3);


    userGames.forEach(game => totalPoints += game.totalReward);

    game['totalPoints'] = totalPoints;

    game['pointsPerSession'] = (totalPoints / totalSessions).toFixed();
    game['avgDailyPoint'] = (totalPoints / noOfDays).toFixed();
  }

  const unique = _.uniqBy(games, 'userId');
  unique.sort((a, b) => b.totalPoints - a.totalPoints);

  console.log(unique)
  return res.render('gamesSummary', { title: 'Express', games: unique, id: ID });

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
    const result = await sequilize.query(query);
    const games = result[0];

    games.totalRewardSum = games.reduce((acc, game) => acc + game.totalReward, 0);
    games.totalWinReward = games.reduce((acc, game) => acc + game.winReward, 0);

    games.totalTimBonusSum = games.reduce((acc, game) => acc + game.timeBonus, 0);
    games.difficultyBonusSum = games.reduce((acc, game) => acc + game.difficultyBonus, 0);

    return res.render('games', { title: 'Games', games, id: ID });
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

  // const include = [{ model: Games }]
  const users = await User.findAll({ where });

  return res.render('profile', { title: 'Express', users, id: ID });

});

router.put('/profile', async function (req, res) {

  if (req.body.discordMember)
    req.body.lastDiscordStatusChangedDate = new Date();

  else if (req.body.status)
    req.body.lastStatusChangedDate = new Date();



  const { userId, ...rest } = req.body;

  await User.update({ ...rest }, { where: { id: userId } });

  // const users = await User.findAll({ where: { id: userId } });

  return res.sendStatus(200);

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

});

module.exports = router;

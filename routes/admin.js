const express = require('express');
const router = express.Router();

const { Rewards } = require('../models/index');
const resp = require('../resp');

router.post('/reward', async function (req, res, next) {
  try {
    const body = req.body;
    const reward = await Rewards.create(body);
    return resp.success(res, reward);

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error creating reward', err.parent?.sqlMessage);
  }
});

router.put('/reward', async function (req, res, next) {
  try {
    const body = req.body;
    const { id, ...rest } = body;

    await Rewards.update(...rest, { where: id });
    const reward = await Rewards.findOne({ where: id });
    return resp.success(res, reward);

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error creating reward', err.parent?.sqlMessage);
  }
});

router.get('/reward:/id', async function (req, res, next) {
  try {
    const id = req.params.id;
    const rewards = id ? await Rewards.find({ where: { id } }) : await Reward.find({});
    return resp.success(res, rewards);

  } catch (err) {
    console.error(err);
    return resp.error(res, 'Error creating reward', err.parent?.sqlMessage);
  }
});

// router.post('/reward', async function (req, res, next) {
//   try {
//     const body = req.body;
//     const reward = await Rewards.create(body);
//     return resp.success(res, reward);

//   } catch (err) {
//     console.error(err);
//     return resp.error(res, 'Error creating reward', err.parent?.sqlMessage);
//   }
// });

module.exports = router;

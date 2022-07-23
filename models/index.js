const Sequelize = require("sequelize");

const sequelize = require('../db.connection');

const db = { Sequelize, sequelize };

// sequelize.query('select * from user').then(a => console.log(a)).catch(err => console.log(err));

User = require('./User')(sequelize, Sequelize);
Games = require('./Games')(sequelize, Sequelize);


User.hasMany(Games, {
    foreignKey: 'userId',
    targetKey: 'id'
});

Games.belongsTo(User, {
    foreignKey: 'userId',
    targetKey: 'id'
});

// User.sync({ force: true }).then().catch(err => console.error(err));
// Games.sync({ force: true }).then().catch(err => console.error(err));

module.exports = { db, User, Games };

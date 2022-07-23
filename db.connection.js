require('dotenv');
const Sequelize = require('sequelize');

const { SYNC, MYSQL_LOCAL_PASSWORD, MYSQL_LOCAL_USER } = process.env;
const DATABASE = 'argan_comp'
const mysql_host = 'localhost';
const mysql_pwd = 'developers';
const mysql_user = 'sammy';

const sequelize = new Sequelize(DATABASE, mysql_user, mysql_pwd, {
    host: mysql_host,
    dialect: 'mysql',
    logging: true,
    operatorsAliases: 0,
    dialectOptions: {
        multipleStatements: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

sequelize.authenticate()
    .then(_ => console.log(`DB ${DATABASE} connected on: ${mysql_host}, user:${mysql_user}`))
    .catch(err => console.error('Unable to connect to the database:', err));


SYNC === 'true' && sequelize.sync({ force: true }).then(() => console.log(`Database & tables created!`));

module.exports = sequelize;

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('games', {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        mode: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        result: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        timeLeft: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        character: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        environment: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        winReward: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        }, 
        difficulty: {
            type: DataTypes.STRING(100),
            allowNull: true
        }, 
        bonus:{
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        timeBonus: {
            type: DataTypes.STRING(100),
            allowNull: true
        }, 
        totalReward:{
            type: DataTypes.INTEGER(11),
            allowNull: true
        }  
    }, {
        sequelize,
        tableName: 'games',
        timestamps: true
    });
}
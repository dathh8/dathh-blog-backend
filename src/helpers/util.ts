const bcrypt = require('bcrypt');
const saltRounds = 10;

export const hashPasswordHepler = async(plainPass: string) => {
    try {
        return await bcrypt.hash(plainPass, saltRounds);
        
    } catch (error) {
        console.log(error)
    }
}

export const comparePasswordHelper = async(plainPass: string, hashPassword: string) => {
    try {
        return await bcrypt.compare(plainPass, hashPassword);
        
    } catch (error) {
        console.log(error)
    }
}
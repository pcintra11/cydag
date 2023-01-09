import bcrypt from 'bcryptjs'; // bcrypt estava dando erro ao gerar o build local e posteriormente no 'start'

export const Crypt = {
  hashSync: bcrypt.hashSync,
  compareSync: bcrypt.compareSync,
};
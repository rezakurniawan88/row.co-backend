# ROW.CO Backend

[![Node.js Version](https://img.shields.io/badge/Node.js-20.11.1-green.svg)](https://www.php.net)
[![Express Version](https://img.shields.io/badge/Express.js-4.18.2-gray.svg)](https://www.php.net)
[![Prisma Version](https://img.shields.io/badge/PrismaORM-5.6.0-green.svg)](https://laravel.com)


## Technologies

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

## Getting Started

1. Clone the repository :
```bash
git clone https://github.com/rezakurniawan88/row.co-backend.git
cd row.co-backend
```
2. Install dependencies :
```bash
npm install
```
3. Env configuration :
```bash
cp .env.example .env
```
4. Then fill in the env file, and for the mailgun api key if you don't have a mailgun account, you can create one first at https://www.mailgun.com
5. Migrate Database :
```bash
npx prisma migrate
```
6. Start the development server:
```bash
npm run dev
```


### Note :
Link repo frontend row.co : https://github.com/rezakurniawan88/row.co
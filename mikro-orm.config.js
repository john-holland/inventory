const allEntities = require("./server/entities");
require("dotenv").config();

module.exports = {
  entities: allEntities,
  type: "postgresql",
  clientUrl: process.env.DATABASE_URL || "postgres://rorksyra:ED1XY2Z0yhr2yMdvkItncTRwMWI7ANp4@salt.db.elephantsql.com/rorksyra",
  debug: process.env.NODE_ENV === 'development',
  migrations: {
    path: './migrations',
    pattern: /^[\w-]+\d+\.js$/,
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    dropTables: false,
    safe: true,
    emit: 'ts',
  },
  seeder: {
    path: './seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
    fileName: (className: string) => className,
  },
};

-- Local development only: Prisma migrate dev creates and drops a shadow database.
GRANT CREATE, DROP, ALTER, REFERENCES, INDEX ON *.* TO 'zhishentang'@'%';
FLUSH PRIVILEGES;

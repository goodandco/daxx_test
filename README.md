# test task


### Manual

#### Data source info

table name: stat
user: postgres
password: root


to setup initial data, add file initial.xlsx to ./files dir
and run

```
$ node ./bin/automigrate
```

#### Routes

1. Uploading data: ```http://localhost:3000/api/stat/upload```
2. Downloading data: ```http://localhost:3000/api/stat/download```
3. Get attributes values by machine: ```http://localhost:3000/api/stat/getAttributesByMachine/:id```
